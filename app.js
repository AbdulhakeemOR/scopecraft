/* React without JSX keeps the original buildless project easy to run. */
(() => {
  const h = React.createElement;
  const { useState, useRef, useEffect } = React;
  const rates = window.SCOPE_RATES;
  const { validatePages, calculate } = window.ScopeModel;
  const money = amount => new Intl.NumberFormat(rates.locale, {
    style: 'currency', currency: rates.currency, maximumFractionDigits: 0
  }).format(amount);
  const exclusions = [...document.querySelectorAll('.exclusions-list li')].map(item => item.textContent);

  function Breakdown({ scope, className = 'line-items' }) {
    return h('ul', { className, 'aria-label': 'Itemised illustrative estimate' },
      h('li', null, h('span', null, `${scope.pages} ${scope.pages === 1 ? 'page' : 'pages'} × ${money(rates.page)}`), h('span', null, money(scope.pageSubtotal))),
      scope.extras.map(extra => h('li', { key: extra.id }, h('span', null, extra.label), h('span', null, money(extra.price)))));
  }

  function PageCountControl({ value, error, onChange, pages, inputRef }) {
    return h(React.Fragment, null,
      h('div', { className: 'pages-field' },
        h('div', { className: 'field-copy' }, h('label', { htmlFor: 'page-count' }, 'How many pages?'),
          h('p', { id: 'page-hint' }, `A page is one distinct destination on your site. Choose ${rates.minPages}–${rates.maxPages}.`)),
        h('div', { className: 'number-control' },
          h('button', { type: 'button', className: 'stepper-button', 'aria-label': 'Decrease page count', disabled: pages <= rates.minPages, onClick: () => onChange(String(pages - 1)) }, '−'),
          h('input', { ref: inputRef, id: 'page-count', name: 'pages', type: 'number', inputMode: 'numeric', min: rates.minPages, max: rates.maxPages, step: 1, required: true,
            value, 'aria-describedby': 'page-hint page-error', 'aria-invalid': Boolean(error), onChange: event => onChange(event.target.value) }),
          h('button', { type: 'button', className: 'stepper-button', 'aria-label': 'Increase page count', disabled: pages >= rates.maxPages, onClick: () => onChange(String(pages + 1)) }, '+'))),
      h('p', { className: 'field-error', id: 'page-error', 'aria-live': 'polite' }, error));
  }

  function ExtraOption({ extra, selected, onToggle }) {
    return h('label', { className: `addon-option${selected ? ' is-selected' : ''}` },
      h('input', { type: 'checkbox', name: 'addon', value: extra.id, checked: selected, onChange: () => onToggle(extra.id) }),
      h('img', { src: `assets/icons/${extra.icon}.svg`, alt: '', width: 40, height: 40 }),
      h('span', { className: 'addon-copy' }, h('span', { className: 'addon-name' }, extra.label), h('span', { className: 'addon-detail' }, extra.description)),
      h('span', { className: 'addon-price' }, `+${money(extra.price)}`));
  }

  function EstimateSummary({ scope, onPreview, invalid }) {
    return h('aside', { className: 'estimate-panel', 'aria-labelledby': 'estimate-title' },
      h('div', { className: 'form-topline estimate-topline' }, h('span', null, '02'), h('span', null, 'Your estimate')),
      h('h3', { id: 'estimate-title' }, 'A first look at the numbers.'),
      h('p', { className: 'estimate-subtitle' }, invalid ? 'Showing the last valid page count. Correct the page count to preview.' : 'Adjust your scope to see what changes.'),
      h(Breakdown, { scope }),
      h('div', { className: 'estimate-total-row' }, h('span', null, 'Illustrative total'),
        h('strong', { key: scope.total, className: 'estimate-total total-changed', id: 'estimate-total' }, money(scope.total))),
      h('p', { className: 'estimate-disclaimer' }, 'Illustrative, not a quote · USD'),
      h('button', { className: 'preview-button', type: 'button', onClick: onPreview }, 'Preview enquiry', h('span', { 'aria-hidden': true }, '↗')),
      h('p', { className: 'estimate-footnote' }, 'No details are sent or stored.'));
  }

  function summaryText(scope) {
    return [ 'ScopeCraft — Your enquiry preview', '',
      `${scope.pages} ${scope.pages === 1 ? 'page' : 'pages'} × ${money(rates.page)}: ${money(scope.pageSubtotal)}`,
      'Selected extras:', ...(scope.extras.length ? scope.extras.map(extra => `${extra.label}: ${money(extra.price)}`) : ['None']),
      '', `Illustrative total: ${money(scope.total)} USD`, 'Illustrative, not a quote.',
      `Excluded: ${exclusions.join(', ')}. Timelines are not included.`,
      'This is a fictional studio and an illustrative calculator. Real project pricing depends on the details.',
      'This is a demo. Nothing has been sent. No details are sent or stored.' ].join('\n');
  }

  function EnquiryPreview({ scope, dialogRef, onClose }) {
    const [feedback, setFeedback] = useState('');
    const close = () => dialogRef.current.close();
    function keepFocusInside(event) {
      if (event.key !== 'Tab') return;
      const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement.id === 'dialog-title')) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    async function copy() {
      try {
        await navigator.clipboard.writeText(summaryText(scope));
        setFeedback('Summary copied.');
      } catch {
        setFeedback('Could not copy. Use Download summary to save a text file.');
      }
    }
    function download() {
      try {
        const url = URL.createObjectURL(new Blob([summaryText(scope)], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url; link.download = 'scopecraft-enquiry-summary.txt';
        document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setFeedback('Summary download requested.');
      } catch { setFeedback('Could not download. Try Copy summary.'); }
    }
    return h('dialog', { ref: dialogRef, className: 'preview-dialog', 'aria-labelledby': 'dialog-title', 'aria-describedby': 'dialog-demo', onKeyDown: keepFocusInside, onClose: () => { setFeedback(''); onClose(); } },
      h('div', { className: 'dialog-topline' }, h('span', { className: 'dialog-kicker' }, 'A first look'), h('button', { className: 'dialog-close', type: 'button', 'aria-label': 'Close preview', onClick: close }, '×')),
      h('h2', { id: 'dialog-title', tabIndex: -1 }, 'Your enquiry preview.'),
      h('p', { className: 'dialog-intro' }, "Here's the shape of the project you've put together."),
      h('div', { className: 'dialog-summary' }, h(Breakdown, { scope, className: 'dialog-items' }),
        scope.extras.length === 0 && h('p', { className: 'dialog-intro' }, 'Selected extras: none.'),
        h('div', { className: 'dialog-total' }, h('span', null, 'Illustrative total · USD'), h('strong', null, money(scope.total)))),
      h('p', { className: 'dialog-intro' }, `Illustrative, not a quote. Excludes ${exclusions.join(', ').toLowerCase()}. Timelines are not included. Real project pricing depends on the details.`),
      h('p', { className: 'dialog-note', id: 'dialog-demo' }, 'This is a fictional studio demo. Nothing has been sent. No details are sent or stored.'),
      h('div', { className: 'dialog-actions' }, h('button', { type: 'button', onClick: copy }, 'Copy summary'), h('button', { type: 'button', onClick: download }, 'Download summary')),
      h('p', { className: 'action-feedback', role: 'status' }, feedback),
      h('button', { className: 'dialog-done', type: 'button', onClick: close }, 'Back to editing'));
  }

  function ScopeCalculator() {
    const [pages, setPages] = useState(rates.defaultPages);
    const [pageDraft, setPageDraft] = useState(String(rates.defaultPages));
    const [extraIds, setExtraIds] = useState([...rates.defaultExtraIds]);
    const [status, setStatus] = useState('');
    const inputRef = useRef(null);
    const dialogRef = useRef(null);
    const triggerRef = useRef(null);
    const scope = calculate(pages, extraIds); // Total is always derived, never separate state.
    const error = validatePages(pageDraft);
    useEffect(() => {
      if (!status) return;
      const timer = setTimeout(() => setStatus(''), 4000);
      return () => clearTimeout(timer);
    }, [status]);
    function changePages(value) {
      setPageDraft(value);
      if (!validatePages(value)) setPages(Number(value));
    }
    function reset() {
      setPages(rates.defaultPages); setPageDraft(String(rates.defaultPages));
      setExtraIds([...rates.defaultExtraIds]);
      setStatus(`Scope reset to ${rates.defaultPages} pages, Copywriting polish and Basic SEO setup.`);
    }
    function preview(event) {
      if (error) { inputRef.current.focus(); return; }
      triggerRef.current = event.currentTarget;
      dialogRef.current.showModal();
      dialogRef.current.querySelector('h2').focus();
    }
    return h(React.Fragment, null,
      h('div', { className: 'estimator-grid' },
        h('form', { className: 'scope-form', noValidate: true, onSubmit: event => event.preventDefault(), onReset: event => { event.preventDefault(); reset(); } },
          h('div', { className: 'form-topline' }, h('span', null, '01'), h('span', null, 'Define your scope')),
          h(PageCountControl, { value: pageDraft, error, onChange: changePages, pages, inputRef }),
          h('fieldset', { className: 'addons-fieldset' }, h('legend', null, 'Make it yours', h('span', null, 'Optional extras')),
            h('div', { className: 'addon-list' }, rates.addons.map(extra => h(ExtraOption, { key: extra.id, extra, selected: extraIds.includes(extra.id),
              onToggle: id => setExtraIds(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]) })))),
          h('div', { className: 'form-footer' }, h('p', null, 'Every estimate is a starting point, not a promise.'), h('button', { className: 'reset-button', type: 'reset' }, '↺ Reset'))),
        h(EstimateSummary, { scope, invalid: Boolean(error), onPreview: preview })),
      h('p', { className: 'action-feedback', role: 'status' }, status),
      h(EnquiryPreview, { scope, dialogRef, onClose: () => triggerRef.current?.focus() }));
  }
  ReactDOM.createRoot(document.getElementById('calculator-root')).render(h(ScopeCalculator));
})();
