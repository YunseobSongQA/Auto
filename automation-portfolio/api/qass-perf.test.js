/**
 * summarize 순수 함수 단위 테스트 — Newman/네트워크 없이 통계만 검증.
 *   node --test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, apdex, apdexRating, evaluate, SLO } from './qass-perf.js';

// evaluate 입력 헬퍼 — 통과하는 기본 지표 + 덮어쓰기
const ok = (over = {}) => ({
  okRate: 1, failures: 0,
  latencyMs: { p95: 110, p99: 166 },
  apdex: { score: 0.99, rating: 'Excellent' },
  ...over,
});

test('1..100 의 백분위', () => {
  const s = summarize(Array.from({ length: 100 }, (_, i) => i + 1));
  assert.equal(s.count, 100);
  assert.equal(s.min, 1);
  assert.equal(s.max, 100);
  assert.equal(s.avg, 50.5);
  assert.equal(s.p50, 50); // nearest-rank: ceil(.5*100)=50
  assert.equal(s.p95, 95);
  assert.equal(s.p99, 99);
});

test('정렬 안 된 입력도 정렬해서 계산', () => {
  const s = summarize([30, 10, 20]);
  assert.equal(s.min, 10);
  assert.equal(s.max, 30);
  assert.equal(s.p50, 20);
});

test('NaN/무한대는 걸러냄', () => {
  const s = summarize([10, NaN, 20, Infinity]);
  assert.equal(s.count, 2);
});

test('빈 입력은 count 0', () => {
  assert.deepEqual(summarize([]), { count: 0 });
});

test('apdex: 전부 T 이하면 1.0 (Excellent)', () => {
  const a = apdex([50, 80, 100], 200);
  assert.equal(a.score, 1);
  assert.equal(a.rating, 'Excellent');
  assert.equal(a.satisfied, 3);
});

test('apdex: 만족/허용/불만 가중 계산', () => {
  // T=100: ≤100 만족(2), ≤400 허용(1), >400 불만(1) → (2 + 1/2)/4 = 0.63
  const a = apdex([50, 90, 300, 900], 100);
  assert.equal(a.satisfied, 2);
  assert.equal(a.tolerating, 1);
  assert.equal(a.frustrated, 1);
  assert.equal(a.score, 0.63);
});

test('apdexRating: 표준 등급 밴드', () => {
  assert.equal(apdexRating(0.95), 'Excellent');
  assert.equal(apdexRating(0.88), 'Good');
  assert.equal(apdexRating(0.75), 'Fair');
  assert.equal(apdexRating(0.60), 'Poor');
  assert.equal(apdexRating(0.40), 'Unacceptable');
});

test('evaluate: 모든 기준 충족이면 PASS (5개 항목, 표준 근거 포함)', () => {
  const r = evaluate(ok(), SLO);
  assert.equal(r.verdict, 'PASS');
  assert.ok(r.checks.every((c) => c.pass));
  assert.equal(r.checks.length, 5);
  assert.ok(r.checks.every((c) => typeof c.standard === 'string' && c.standard.length));
});

test('evaluate: Apdex 미달이면 FAIL', () => {
  const r = evaluate(ok({ apdex: { score: 0.80, rating: 'Fair' } }), SLO);
  assert.equal(r.verdict, 'FAIL');
  assert.equal(r.checks.find((c) => c.key === 'apdex').pass, false);
});

test('evaluate: p95 초과면 FAIL (해당 항목만 실패)', () => {
  const r = evaluate(ok({ latencyMs: { p95: 999, p99: 166 } }), SLO);
  assert.equal(r.verdict, 'FAIL');
  assert.equal(r.checks.find((c) => c.key === 'p95').pass, false);
  assert.equal(r.checks.find((c) => c.key === 'p99').pass, true);
});

test('evaluate: 성공률 미달이면 FAIL', () => {
  const r = evaluate(ok({ okRate: 0.98 }), SLO);
  assert.equal(r.verdict, 'FAIL');
  assert.equal(r.checks.find((c) => c.key === 'okRate').pass, false);
});

test('evaluate: 치명 오류 1건이면 FAIL', () => {
  const r = evaluate(ok({ failures: 1 }), SLO);
  assert.equal(r.verdict, 'FAIL');
});
