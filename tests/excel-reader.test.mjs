import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';
import { readResultsWorksheet } from '../lib/readResultsWorksheet.js';
import { detectColumnMappings } from '../lib/columnMapping.js';
import { resultsWorkbook } from './excel-fixtures.mjs';

test('Excel uses the official patched distribution with a locked integrity hash', async () => {
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url)));
  const sheetjs = lock.packages['node_modules/xlsx'];
  assert.equal(XLSX.version, '0.20.3');
  assert.equal(sheetjs.version, '0.20.3');
  assert.equal(sheetjs.resolved, 'file:vendor/xlsx-0.20.3.tgz');
  assert.match(sheetjs.integrity, /^sha512-/);
  assert.ok(Object.entries(lock.packages).filter(([path]) => /(?:^|\/)node_modules\/xlsx$/.test(path)).every(([, entry]) => entry.version === '0.20.3'));
});

for (const format of ['xlsx', 'biff8']) test(`Excel ${format} retains candidate zeroes, Arabic/French text, dates and scores`, async () => {
  const { file } = resultsWorkbook(format);
  const parsed = await readResultsWorksheet(file);
  assert.equal(parsed.sheetName, 'نتائج 2026');
  assert.equal(parsed.rawRows.length, 2);
  assert.equal(parsed.rawRows[0]['Numéro'], '00123');
  assert.equal(parsed.rawRows[1]['Numéro'], '00124');
  assert.equal(parsed.rawRows[0].NOM, 'مترشح تجريبي');
  assert.equal(parsed.rawRows[1].NOM, 'Élève de test');
  assert.equal(parsed.rawRows[0].Moyenne, '14.25');
  assert.equal(parsed.rawRows[0]['Date Naiss'], '2008-07-15');
  assert.deepEqual(Object.values(parsed.rawRows[0]).filter((value) => typeof value === 'string' && value.includes('\u0000')), []);
  const mapping = detectColumnMappings(Object.keys(parsed.rawRows[0]));
  assert.equal(mapping.number, 'Numéro');
  assert.equal(mapping.name, 'NOM');
  assert.equal(mapping.score, 'Moyenne');
});

test('Excel requested worksheet and missing-name fallback preserve existing behavior', async () => {
  const { file } = resultsWorkbook();
  const explicit = await readResultsWorksheet(file, 'Second');
  assert.equal(explicit.sheetName, 'Second');
  assert.equal(explicit.rawRows[0]['Numéro'], '00999');
  assert.equal((await readResultsWorksheet(file, 'Missing')).sheetName, 'نتائج 2026');
});

test('empty worksheets and prototype-shaped column names do not mutate Object.prototype', async () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Empty');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['__proto__', 'constructor', 'Numéro'], ['untrusted', 'untrusted', '00123']]), 'Headers');
  const file = new File([XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })], 'headers.xlsx');
  assert.deepEqual((await readResultsWorksheet(file)).rawRows, []);
  const parsed = await readResultsWorksheet(file, 'Headers');
  assert.equal(parsed.rawRows[0]['Numéro'], '00123');
  assert.equal(Object.getPrototypeOf({}), Object.prototype);
  assert.equal(Object.prototype.untrusted, undefined);
});
