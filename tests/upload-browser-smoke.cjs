const { chromium } = require(process.env.MAURI_PLAYWRIGHT_MODULE || 'playwright');
const XLSX = require('xlsx');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.MAURI_TEST_URL || 'http://127.0.0.1:3000';
const total = 1002;
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const report = [];
  try {
    for (const format of ['xlsx', 'biff8']) {
      const context = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      await context.addInitScript(() => sessionStorage.setItem('mauriresults-admin-secret', 'fixture-admin-only'));
      const page = await context.newPage();
      const requests = [];
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/api/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        const reply = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
        if (path.startsWith('/api/admin/') && route.request().method() === 'POST') {
          assert.equal(route.request().headers()['x-admin-secret'], 'fixture-admin-only');
          const body = route.request().postDataJSON();
          requests.push({ path, body });
          if (path === '/api/admin/publish-exam') return reply({ ok: true, published: true, validation: { rows: total, numberLookup: true, lookupRows: total, cacheWarmed: true } });
          return reply({ ok: true, inserted: body.rows?.length || 0 });
        }
        return reply({ controls: {}, rows: [], exams: [], items: [] });
      });
      await page.goto(`${base}/admin/results`);
      await page.getByRole('button', { name: /نشر نتائج جديدة/ }).click();
      const workbook = XLSX.utils.book_new();
      const rows = Array.from({ length: total }, (_, index) => [String(index + 123).padStart(5, '0'), index === 0 ? 'مترشح تجريبي' : 'Élève de test', '14.25', 'Admis']);
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Numéro', 'NOM', 'Moyenne', 'Decision'], ...rows]), 'نتائج 2026');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format });
      await page.locator('input[type=file]').setInputFiles({ name: `bac-2026.${format === 'xlsx' ? 'xlsx' : 'xls'}`, mimeType: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/vnd.ms-excel', buffer });
      await page.getByText('الملف جاهز', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'فحص الملف', exact: true }).click();
      await page.getByText('المعاينة صحيحة', { exact: true }).waitFor();
      assert.equal(requests.length, 0, 'Preview must never write');
      await page.getByRole('checkbox', { name: 'فحص الملف قبل الرفع' }).uncheck();
      await page.getByRole('button', { name: 'رفع ونشر النتائج', exact: true }).click();
      await page.getByText('تم النشر والتحقق بنجاح', { exact: true }).waitFor();
      const chunks = requests.filter((request) => request.path === '/api/admin/results-upload');
      assert.deepEqual(chunks.map((chunk) => chunk.body.rows.length), [1000, 2]);
      assert.equal(chunks[0].body.createTable, true);
      assert.equal(chunks[1].body.createTable, false);
      assert.equal(chunks[0].body.rows[0]['Numéro'], '00123');
      assert.equal(chunks[0].body.rows[0].NOM, 'مترشح تجريبي');
      assert.equal(chunks[0].body.rows[1].NOM, 'Élève de test');
      assert.equal(chunks[0].body.rows[0].Moyenne, '14.25');
      const prepare = requests.find((request) => request.path === '/api/admin/results-prepare');
      assert.equal(prepare.body.numberColumn, 'Numéro');
      assert.equal(prepare.body.nameColumn, 'NOM');
      assert.equal(prepare.body.scoreColumn, 'Moyenne');
      assert.ok(requests.every((request) => (request.body.table || request.body.tableName) === 'results_bac_2026'));
      assert.deepEqual(errors, []);
      report.push({ format, rows: total, chunkSizes: [1000, 2], previewWrites: 0, result: 'PASS', upstream: 'synthetic API fixtures; no database access' });
      await context.close();
    }
    const path = process.env.MAURI_UPLOAD_REPORT || '/tmp/mauri-upload-browser.json';
    fs.writeFileSync(path, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
