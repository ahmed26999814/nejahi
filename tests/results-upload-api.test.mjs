import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, Module } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { readResultsWorksheet } from '../lib/readResultsWorksheet.js';
import { resultsWorkbook } from './excel-fixtures.mjs';

// Compile and exercise the real route handler. Every upstream call is intercepted
// in this isolated test process; no real credentials or database are used.
process.env.ADMIN_SECRET = 'fixture-admin-only';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-server-only';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const filename = fileURLToPath(new URL('../app/api/admin/results-upload/route.ts', import.meta.url));
const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const routeModule = new Module(filename);
routeModule.filename = filename;
routeModule.paths = Module._nodeModulePaths(dirname(filename));
routeModule._compile(compiled, filename);
const { POST } = routeModule.exports;
const send = (body, authorized = true) => POST(new Request('https://example.test/api/admin/results-upload', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorized ? { 'x-admin-secret': 'fixture-admin-only' } : {}) }, body: JSON.stringify(body) }));
const table = 'results_fixture_2026';

for (const format of ['xlsx', 'biff8']) test(`real upload API accepts ${format} rows and preserves data through create/insert/prepare`, async () => {
  const parsed = await readResultsWorksheet(resultsWorkbook(format).file);
  const calls = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(input);
    assert.equal(url.origin, 'https://fixture.supabase.co');
    const body = JSON.parse(options.body);
    calls.push({ path: url.pathname, body });
    if (url.pathname.endsWith('/insert_results_upload_rows')) return Response.json({ inserted: body.p_rows.length });
    if (/\/(create_results_upload_table|prepare_results_table_speed)$/.test(url.pathname)) return Response.json({ ok: true });
    throw new Error('Unexpected upstream call');
  };
  try {
    const response = await send({ table, columns: Object.keys(parsed.rawRows[0]), rows: parsed.rawRows, createTable: true, speedSetup: true, isLastChunk: true, numberColumn: 'Numéro', nameColumn: 'NOM', scoreColumn: 'Moyenne' });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.ok, true);
    assert.equal(result.inserted, 2);
    assert.equal(calls.length, 3);
    assert.ok(calls.every((call) => call.body.p_table_name === table));
    const inserted = calls.find((call) => call.path.endsWith('/insert_results_upload_rows')).body.p_rows;
    assert.equal(inserted[0]['Numéro'], '00123');
    assert.equal(inserted[1]['Numéro'], '00124');
    assert.equal(inserted[0].NOM, 'مترشح تجريبي');
    assert.equal(inserted[1].NOM, 'Élève de test');
    assert.equal(inserted[0].Moyenne, '14.25');
  } finally { globalThis.fetch = previousFetch; }
});

test('upload rejects unauthorized and oversized requests before upstream access', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected upstream write'); };
  try {
    assert.equal((await send({ table, rows: [{ Numéro: '00123' }] }, false)).status, 401);
    assert.equal((await send({ table, rows: Array.from({ length: 2001 }, () => ({ Numéro: '00123' })) })).status, 413);
    assert.equal((await send({ table, rows: [] })).status, 400);
  } finally { globalThis.fetch = originalFetch; }
});

test('upload reports an upstream insert failure without claiming inserted rows', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: 'Fixture insert unavailable' }, { status: 503 });
  try {
    const response = await send({ table, rows: [{ Numéro: '00123', NOM: 'Fixture', Moyenne: '14.25' }], speedSetup: false });
    assert.equal(response.status, 503);
    const data = await response.json();
    assert.equal(data.ok, false);
    assert.equal(data.inserted, 0);
  } finally { globalThis.fetch = originalFetch; }
});
