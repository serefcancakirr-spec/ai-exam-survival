// Stage 24: the "Nasıl kullanılır?" guide opens by itself once for a new student on the home page.
// The earlier browser tests start as new students, so in every new context the app reads the guide as already seen
// (as for a student who closed it once). Nothing is written: localStorage stays exactly as each test expects.
// stage24-test runs without this file to test the guide itself.
const pw = require('playwright');
const launch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...args) => {
  const browser = await launch(...args);
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...opts) => {
    const ctx = await newContext(...opts);
    await ctx.addInitScript(() => {
      try {
        const getItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function (key) {
          const value = getItem.call(this, key);
          return value === null && key === 'ai-exam-survival:guide:v1' && this === window.localStorage ? '{"version":1,"seen":true}' : value;
        };
      } catch {}
    });
    return ctx;
  };
  return browser;
};
