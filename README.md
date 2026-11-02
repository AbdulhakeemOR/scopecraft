# ScopeCraft

A fictional website scope calculator. Open `index.html` directly, or serve this directory using `python -m http.server 8000` and visit http://localhost:8000. Clipboard access generally requires localhost or HTTPS; download remains available if clipboard permission is denied.

The original static HTML, local fonts, SVG icons and CSS hero artwork are preserved. React 18.3.1 and ReactDOM are pinned locally in `js/vendor` (MIT licensed), so no package installation or build step is required. `js/app.js` uses React's `createElement` rather than JSX.

- `index.html`: original page content and React mount point.
- `css/styles.css`: original visual identity plus accessible calculator and dialog refinements.
- `js/rates.js`: all prices, defaults and page limits; pure validation and calculation helpers.
- `js/app.js`: PageCountControl, ExtraOption, EstimateSummary, EnquiryPreview and ScopeCalculator.

React stores the committed page count and selected extra IDs. A separate draft string lets people edit an empty or invalid number without corrupting the estimate. Only valid whole numbers from 1–12 commit. Invalid input displays an error and blocks preview; steppers act on the last valid count. The breakdown, total and exported text are derived from the same scope. Reset restores three pages, copywriting and SEO together ($660).

The native dialog traps focus and closes with Escape; focus returns to its trigger. Totals update immediately with a brief color change and no live announcements. Reset and copy/download results use polite status messages. Reduced motion disables the color animation. The estimate stays within its desktop grid; mobile uses an ordinary stacked panel without a fixed overlay.

Browser validation uses Python Playwright: `python -m pip install --target .qa-deps playwright`, then `$env:PYTHONPATH='.qa-deps'`, `python tests/browser_check.py`. Tests use installed Microsoft Edge and start their own local HTTP server. No backend, submissions, or persistence are provided.
