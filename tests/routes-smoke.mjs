import assert from 'node:assert/strict';
const base = process.env.MAURI_TEST_URL || 'http://127.0.0.1:3000';
const get = (path) => fetch(`${base}${path}`, { redirect: 'manual' });
for (const path of ['/', '/about', '/apk', '/lessons', '/calculator', '/toppers', '/statistics', '/privacy', '/terms', '/orientation', '/orientation/match', '/orientation/specialties', '/robots.txt', '/sitemap.xml', '/brand-logo.svg']) {
  assert.equal((await get(path)).status, 200, path);
}
for (const exam of ['bac', 'brevet', 'concours', 'excellence', 'bac-session']) {
  for (const year of ['2025', '2026']) {
    const response = await get(`/results/${exam}/${year}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`https://mauri-results.vercel.app/results/${exam}/${year}`));
    assert.ok(html.includes('النتائج متاحة'));
  }
}
const orientationGuide = await get('/orientation');
const orientationHtml = await orientationGuide.text();
assert.ok(orientationHtml.includes('من اختيار التخصص إلى التوجيه الرسمي'), 'official guidance visible');
assert.ok(orientationHtml.includes('https://etudiants-mesrs.app/'), 'ministry platform linked');
assert.ok(orientationHtml.includes('المنحة الدراسية ليست نتيجة تلقائية'), 'grant eligibility not implied');
assert.equal((await get('/results/bac/1900')).status, 404);
assert.equal((await get('/candidatures')).status, 404);
assert.equal((await get('/api/candidatures')).status, 404);
assert.equal((await get('/Apk')).status, 308);
assert.ok((await get('/Apk')).headers.get('location').endsWith('/apk'));
assert.equal((await get('/api/debug')).status, 401);
for (const [path, method] of [['content','PUT'], ['publish-exam','POST'], ['published-exams','PATCH'], ['result-alerts','PATCH'], ['results-prepare','POST'], ['results-reset','POST'], ['results-upload','POST'], ['upload','POST']]) {
  const response = await fetch(`${base}/api/admin/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.ok([401,503].includes(response.status), `Unauthorized ${path}: ${response.status}`);
}
const coverage = await get('/api/health/coverage');
assert.ok([200, 503].includes(coverage.status));
const coverageReport = await coverage.json();
assert.equal(coverageReport.totalSources, 11);
assert.equal(coverageReport.checks.length, 11);
const catalogue = await get('/api/public-exams');
assert.ok([200, 503].includes(catalogue.status));
if (catalogue.status === 200) assert.ok(!(await catalogue.json()).updateRequired);
const legacyClient = await get('/api/public-exams?client=mobile');
assert.equal((await legacyClient.json()).minimumSupportedVersion, '3.3.0');
for (const q of ['12abc', '1'.repeat(21), '-123', '1e3']) {
  assert.equal((await get(`/api/search?source=bac&q=${q}`)).status, 400);
  assert.equal((await get(`/api/result-number/bac/${q}`)).status, 400);
}
for (const source of ['bac', 'brevet', 'concours', 'bac_session', 'excellence_1as']) {
  const response = await get(`/api/search?source=${source}&q=${encodeURIComponent('٠٠١٢٣٤٥')}`);
  assert.equal(response.status, 307);
  assert.ok(response.headers.get('location').endsWith(`/${source}/12345`));
}
for (const [alias, token] of Object.entries({ bac_2026: 'results_bac_2026', brevet_2026: 'brevet_2026', concours_2026: 'concour_2026', bac_session_2026: 'results_bac_ses_2026', excellence_1as_2026: 'results_concours_exe_2026' })) {
  const response = await get(`/api/search?source=${alias}&q=12345`);
  assert.equal(response.status, 307);
  assert.ok(response.headers.get('location').includes(`/upload--${token}/12345`), alias);
}
const oversizedConcours = await get(`/api/uploaded-concours-search?source=upload:concour_2026&wilaya=a&moughataa=b&centre=c&number=${'1'.repeat(21)}`);
assert.equal(oversizedConcours.status, 400);
const home = await get('/');
assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
assert.equal((await get('/?candidate=12345')).headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
console.log('PASS: updated public pages/assets, 11-source health coverage, invalid routes, diagnostics authorization, numeric validation, 2025/2026 source redirects, private-result indexing headers.');
