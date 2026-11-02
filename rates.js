window.SCOPE_RATES = Object.freeze({
  currency: 'USD', locale: 'en-US', page: 150,
  minPages: 1, maxPages: 12,
  defaultPages: 3, defaultExtraIds: ['copywriting', 'seo'],
  addons: [
    { id: 'copywriting', label: 'Copywriting polish', description: 'A little more clarity in every word', icon: 'copywriting', price: 120 },
    { id: 'illustrations', label: 'Custom illustration set', description: "A visual touch that's yours alone", icon: 'illustrations', price: 200 },
    { id: 'contactForm', label: 'Contact form preview', description: 'A simple route for hello', icon: 'contact-form', price: 80 },
    { id: 'seo', label: 'Basic SEO setup', description: 'A thoughtful foundation for search', icon: 'seo', price: 90 }
  ]
});

// Pure helpers shared by the calculator, preview, and exported summary.
window.ScopeModel = {
  validatePages(value) {
    const rates = window.SCOPE_RATES;
    if (String(value).trim() === '' || !Number.isInteger(Number(value))) {
      return `Enter a whole number from ${rates.minPages} to ${rates.maxPages}.`;
    }
    return Number(value) < rates.minPages || Number(value) > rates.maxPages
      ? `Choose between ${rates.minPages} and ${rates.maxPages} pages.` : '';
  },
  calculate(pages, selectedIds) {
    const rates = window.SCOPE_RATES;
    const extras = rates.addons.filter(extra => selectedIds.includes(extra.id));
    const pageSubtotal = pages * rates.page;
    return { pages, extras, pageSubtotal, total: pageSubtotal + extras.reduce((sum, extra) => sum + extra.price, 0) };
  }
};
