"""Integration checks against the real buildless app. Requires Python Playwright."""
import functools
import http.server
import pathlib
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parents[1]
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://localhost:{server.server_port}'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge')
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, permissions=['clipboard-read', 'clipboard-write'])
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url)
        total = page.locator('#estimate-total')
        count = page.locator('#page-count')
        expect(total).to_have_text('$660')
        for extra, contribution in [('copywriting',120), ('illustrations',200), ('contactForm',80), ('seo',90)]:
            page.get_by_role('button', name='Reset', exact=False).click()
            checkbox = page.locator(f'input[value="{extra}"]')
            selected = checkbox.is_checked()
            checkbox.click()
            expect(total).to_have_text(f'${660 + (-contribution if selected else contribution):,}')
        for value in ['', '1.5', '0', '13']:
            count.fill(value)
            expect(count).to_have_attribute('aria-invalid', 'true')
            page.get_by_role('button', name='Preview enquiry').click()
            assert page.locator('dialog').evaluate('(d) => !d.open')
            expect(count).to_be_focused()
        count.fill('1')
        expect(page.get_by_role('button', name='Decrease page count')).to_be_disabled()
        expect(total).to_have_text('$270')  # SEO was unchecked in last loop.
        count.fill('12')
        expect(page.get_by_role('button', name='Increase page count')).to_be_disabled()
        page.get_by_role('button', name='Reset', exact=False).click()
        expect(count).to_have_value('3')
        expect(total).to_have_text('$660')
        assert page.locator('input[name="addon"]:checked').count() == 2
        expect(page.get_by_role('status').first).to_contain_text('Scope reset')
        trigger = page.get_by_role('button', name='Preview enquiry')
        trigger.focus()
        page.keyboard.press('Enter')
        dialog = page.get_by_role('dialog')
        expect(dialog).to_be_visible()
        expect(dialog.get_by_role('heading')).to_be_focused()
        expect(dialog).to_contain_text('3 pages × $150')
        expect(dialog).to_contain_text('Copywriting polish')
        expect(dialog).to_contain_text('Basic SEO setup')
        expect(dialog).to_contain_text('$660')
        expect(dialog).to_contain_text('Nothing has been sent')
        expect(dialog).to_contain_text('hosting, domain, ongoing updates, photography')
        page.keyboard.press('Shift+Tab')
        expect(dialog.get_by_role('button', name='Back to editing')).to_be_focused()
        for _ in range(8):
            page.keyboard.press('Tab')
            assert page.evaluate('document.activeElement.closest("dialog") !== null')
        dialog.get_by_role('button', name='Copy summary').click()
        expect(dialog.get_by_role('status')).to_have_text('Summary copied.')
        copied = page.evaluate('navigator.clipboard.readText()')
        assert 'Illustrative total: $660 USD' in copied
        with page.expect_download() as download_info:
            dialog.get_by_role('button', name='Download summary').click()
        download = download_info.value
        assert download.suggested_filename == 'scopecraft-enquiry-summary.txt'
        assert pathlib.Path(download.path()).read_text(encoding='utf-8') == copied.replace('\r\n', '\n')
        page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: () => Promise.reject(new Error('denied'))}})")
        dialog.get_by_role('button', name='Copy summary').click()
        expect(dialog.get_by_role('status')).to_contain_text('Could not copy')
        page.keyboard.press('Escape')
        expect(dialog).not_to_be_visible()
        expect(trigger).to_be_focused()
        trigger.click()
        dialog.get_by_role('button', name='Back to editing').click()
        expect(trigger).to_be_focused()
        for width in [320,375,700,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':900})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}'
            trigger.click()
            assert dialog.evaluate('(d) => d.getBoundingClientRect().width <= innerWidth')
            dialog.get_by_role('button', name='Back to editing').click()
        page.emulate_media(reduced_motion='reduce')
        page.get_by_role('button', name='Increase page count').click()
        assert total.evaluate('(e) => getComputedStyle(e).animationName') == 'none'
        assert not errors, errors
        browser.close()
        print('PASS: rates, extras, invalid inputs, limits, reset, preview, clipboard success/failure, download, keyboard/focus, 6 viewport widths, reduced motion; no JS errors.')
finally:
    server.shutdown()
