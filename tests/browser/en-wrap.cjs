// Runs the earlier (English) browser tests unchanged: every new browser context starts with English chosen,
// exactly as a student who pressed EN once. Nothing else is altered.
const pw = require('playwright');
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...args) => {
  const browser = await launch(...args);
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...opts) => {
    const ctx = await newContext(...opts);
    await ctx.addInitScript(() => {
      try { if (!localStorage.getItem('ai-exam-survival:language:v1')) localStorage.setItem('ai-exam-survival:language:v1', 'en'); } catch {}
    });
    return ctx;
  };
  return browser;
};
