import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCandidateNumber } from '../lib/candidateNumber.js';
import { isAuthorizedAdmin } from '../lib/adminAuthorization.js';
import { GET as debug } from '../app/api/debug/route.js';
import { mergeYearCards } from '../components/home/yearCards.js';

test('candidate lookup supports Arabic and Persian digits and preserves integer precision', () => {
  assert.equal(normalizeCandidateNumber(' ٠٠١٢٣٤٥ '), '12345');
  assert.equal(normalizeCandidateNumber('۰۰۱۲۳۴۵'), '12345');
  assert.equal(normalizeCandidateNumber('99999999999999999999'), '99999999999999999999');
  assert.equal(normalizeCandidateNumber('0'), '0');
});

test('malformed or oversized numbers cannot resolve to a different student', () => {
  for (const value of ['', null, '1'.repeat(21), '12x34', '12/34', '1.23', '-123', '1e3', '12 34']) {
    assert.equal(normalizeCandidateNumber(value), '', String(value));
  }
});

test('admin authorization fails closed and accepts only the configured secret', () => {
  const request = (value) => new Request('https://example.test/api/debug', { headers: value ? { 'x-admin-secret': value } : {} });
  assert.equal(isAuthorizedAdmin(request(), 'test-secret'), false);
  assert.equal(isAuthorizedAdmin(request('wrong'), 'test-secret'), false);
  assert.equal(isAuthorizedAdmin(request('test-secret'), ''), false);
  assert.equal(isAuthorizedAdmin(request('test-secret'), 'test-secret'), true);
});

test('unauthenticated diagnostics never request student data', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error('Unexpected network request'); };
  try {
    const response = await debug(new Request('https://example.test/api/debug'));
    assert.equal(response.status, 401);
    assert.equal(requests, 0);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'Unauthorized' });
  } finally { globalThis.fetch = originalFetch; }
});

test('year navigation never claims availability before a successful catalogue response', () => {
  assert.ok(mergeYearCards([]).every((card) => !card.available));
  const cards = mergeYearCards([{ id: 'year-2025', available: true }]);
  assert.equal(cards.find((card) => card.id === 'year-2025').available, true);
  assert.equal(cards.find((card) => card.id === 'year-2026').available, false);
});

test('French competition names remain readable when CMS French titles contain Arabic', async () => {
  const { frenchExamTitle } = await import('../lib/examLabels.js');
  assert.equal(frenchExamTitle({ title_fr: 'باكالوريا 2026', table_name: 'results_bac_2026', year: '2026' }), 'Baccalauréat 2026');
  assert.equal(frenchExamTitle({ title_fr: 'نتائج كونكور 2026', table_name: 'concour_2026', year: '2026' }), 'Concours 2026');
  assert.equal(frenchExamTitle({ title_fr: 'Résultats BEPC 2025', year: '2025' }), 'Résultats BEPC 2025');
});
