// Run against a production build with synthetic student rows only.
// npm install --prefix /tmp/mauri-browser playwright@1.58.2
// MAURI_PLAYWRIGHT_MODULE=/tmp/mauri-browser/node_modules/playwright node tests/browser-smoke.cjs
const { chromium } = require(process.env.MAURI_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { exams } = require('./fixtures/public-exams.json');
const base = process.env.MAURI_TEST_URL || 'http://127.0.0.1:3000';
const artifacts = process.env.MAURI_ARTIFACTS || '/tmp/mauri-browser-artifacts';
fs.mkdirSync(artifacts, { recursive: true });
const reports = [];

function rowFor(exam) {
  return {
    [exam.number_column]: '12345', [exam.name_column]: 'مترشح تجريبي',
    [exam.score_column]: exam.search_mode === 'concours' ? '152.50' : '14.25',
    ...(exam.decision_column ? { [exam.decision_column]: 'Admis' } : {}),
    ...(exam.track_column ? { [exam.track_column]: 'SN' } : {}),
    [exam.wilaya_column]: 'آدرار', [exam.moughataa_column || 'MOUGHATAA_AR']: 'أطار',
    [exam.centre_column]: 'مركز تجريبي',
    // The legacy concours view also returns the printed exam number and total.
    ...(exam.source_key === 'concours' ? { 'Numéro_C1AS': '12345', TOTAL: '152.50', total_num: 152.5 } : {}),
    rank: 7,
  };
}

async function fixtureRoutes(page, catalogueFailure = false) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (path === '/api/public-exams') return reply(catalogueFailure ? { error: 'Unavailable' } : { exams }, catalogueFailure ? 503 : 200);
    if (path === '/api/concours-locations') return reply({ locations: [{ wilaya: 'آدرار', moughataas: [{ name: 'أطار', centres: ['مركز تجريبي'] }] }] });
    if (path === '/api/uploaded-concours-locations') return reply({ options: [url.searchParams.get('level') === 'wilaya' ? 'آدرار' : url.searchParams.get('level') === 'moughataa' ? 'أطار' : 'مركز تجريبي'] });
    if (/\/api\/(result-shard|centre-shard|result-number|concours-number)\//.test(path)) {
      const token = decodeURIComponent(path.split('/')[3]);
      const source = token.replace(/^upload--/, 'upload:');
      const exam = exams.find((item) => item.source_key === source);
      assert.ok(exam, `Unexpected result source ${source}`);
      const row = rowFor(exam);
      return reply(path.includes('-shard/') ? { candidates: { '12345': [row] } } : { rows: [row] });
    }
    if (path === '/api/public-data' || path === '/api/content') return reply([]);
    if (path === '/api/site-controls') return reply({ controls: {} });
    return reply({ count: 1, online: 1, visitors: 1, downloads: 1, rows: [] });
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      window.__mauriLabMetrics = { cls: 0, lcp: 0 };
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__mauriLabMetrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__mauriLabMetrics.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await fixtureRoutes(page);
    for (const exam of exams) {
      console.log(`Checking ${exam.source_key}`);
      await page.goto(base);
      const form = page.locator('.home-finder-form');
      await form.waitFor();
      await form.locator('select').nth(0).selectOption(exam.year);
      const id = (await form.locator('select').nth(1).locator('option').evaluateAll((options, title) => options.find((option) => option.textContent === title)?.value, exam.title_ar));
      assert.ok(id, `Missing ${exam.source_key} in year ${exam.year}`);
      await form.locator('select').nth(1).selectOption(id);
      if (exam.search_mode === 'concours') {
        await form.locator('button[type=submit]').click();
        const search = page.locator('form.search-card');
        await search.locator('select').nth(0).selectOption('آدرار');
        await search.locator('select').nth(1).selectOption('أطار');
        await search.locator('select').nth(2).selectOption('مركز تجريبي');
        await search.locator('input').fill('١٢٣٤٥');
        await search.locator('button[type=submit]').click();
      } else {
        await form.locator('input').fill('١٢٣٤٥');
        assert.equal(await form.locator('input').inputValue(), '12345');
        await form.locator('button[type=submit]').click();
      }
      await page.locator('.result-student-name').waitFor();
      assert.equal(await page.locator('.result-student-name').textContent(), 'مترشح تجريبي');
      assert.ok((await page.locator('.result-score').textContent()).includes(exam.search_mode === 'concours' ? '152.50' : '14.25'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      reports.push({ source: exam.source_key, year: exam.year, result: 'PASS', data: 'synthetic fixture' });
    }
    await page.goto(base);
    await page.locator('.home-finder-form').waitFor();
    await page.waitForTimeout(1200);
    reports.push({ scenario: 'Mobile startup lab sample, synthetic API fixtures, reduced motion', metrics: await page.evaluate(() => window.__mauriLabMetrics), fieldCoreWebVitals: false });
    await page.screenshot({ path: `${artifacts}/mobile-ar-light.png`, fullPage: true });
    await page.getByRole('button', { name: 'Passer au français' }).click();
    await page.waitForFunction(() => document.documentElement.lang === 'fr' && document.documentElement.dir === 'ltr');
    assert.ok((await page.locator('.home-finder').textContent()).includes('Votre résultat'));
    await page.getByRole('button', { name: 'Changer le thème' }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
    await page.screenshot({ path: `${artifacts}/mobile-fr-dark.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const desktopPage = await desktop.newPage();
    await fixtureRoutes(desktopPage);
    await desktopPage.goto(base);
    await desktopPage.locator('.home-finder-form').waitFor();
    await desktopPage.screenshot({ path: `${artifacts}/desktop-ar-light.png`, fullPage: true });
    assert.equal(await desktopPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const failurePage = await context.newPage();
    await fixtureRoutes(failurePage, true);
    await failurePage.goto(base);
    await failurePage.locator('.home-catalog-status[role=alert]').waitFor();
    assert.equal(await failurePage.locator('.results-year-card[href]').count(), 0);
    assert.equal(await failurePage.locator('.results-alerts-notice').count(), 0);
    assert.deepEqual(errors, []);
    reports.push({ scenario: 'Arabic, French, dark mode, Android viewport, desktop, catalogue failure', result: 'PASS', pageErrors: errors });
    fs.writeFileSync(`${artifacts}/browser-report.json`, JSON.stringify(reports, null, 2));
    console.log(JSON.stringify(reports, null, 2));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
