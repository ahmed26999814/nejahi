// Read-only spot checks of published results. Never prints or persists student rows,
// names, candidate numbers, dates of birth, or service credentials.
import { writeFile } from 'node:fs/promises';
const base = process.env.MAURI_LIVE_URL || 'https://mauri-results.vercel.app';
const readJson = async (path) => {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};
const catalogue = await readJson('/api/public-exams');
const report = [];
for (const exam of catalogue.exams) {
  try {
    const analytics = await readJson(`/api/published-exam-analytics?source=${encodeURIComponent(exam.source_key)}`);
    const sample = analytics.topStudents?.[0];
    if (!sample) { report.push({ source: exam.source_key, year: exam.year, status: 'NO_SAMPLE' }); continue; }
    const candidate = String(sample.numero ?? sample.id ?? '');
    const token = exam.source_key.replace(/^upload:/, 'upload--');
    const region = sample.wilaya ?? sample.wl;
    const district = sample.moughataa;
    const centre = sample.center ?? sample.centre;
    const path = exam.search_mode === 'concours' && region && district && centre
      ? ['/api/concours-number', token, region, district, centre, candidate].map((part, index) => index === 0 ? part : encodeURIComponent(part)).join('/')
      : `/api/search?source=${encodeURIComponent(exam.source_key)}&q=${encodeURIComponent(candidate)}`;
    const data = await readJson(path);
    const expected = Number(String(sample.average_score ?? sample.total_score ?? sample.score ?? sample.MOD).replace(',', '.'));
    const matches = (data.rows || []).filter((row) => Math.abs(Number(String(row[exam.score_column] ?? row.TOTAL ?? '').replace(',', '.')) - expected) < .00001);
    report.push({ source: exam.source_key, year: exam.year, status: matches.length ? 'PASS' : 'MISMATCH', scoreMatchesPublishedTopper: matches.length > 0, returnedRows: (data.rows || []).length });
  } catch (error) { report.push({ source: exam.source_key, year: exam.year, status: 'UNVERIFIED', reason: error.name === 'TimeoutError' ? 'timeout' : error.message }); }
}
const version = await readJson('/apk/version.json');
const apk = await fetch(version.fileUrl, { method: 'HEAD', signal: AbortSignal.timeout(12000) });
report.push({ asset: 'APK', version: version.version, status: apk.status, bytesMatchManifest: Number(apk.headers.get('content-length')) === version.sizeBytes, type: apk.headers.get('content-type') });
for (const path of ['/brand-logo.svg', '/logo.png']) {
  const response = await fetch(`${base}${path}`, { method: 'HEAD', signal: AbortSignal.timeout(12000) });
  report.push({ asset: path, status: response.status, type: response.headers.get('content-type') });
}
await writeFile(process.env.MAURI_LIVE_REPORT || '/tmp/mauri-live-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
