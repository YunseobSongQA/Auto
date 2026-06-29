/**
 * summarize 순수 함수 단위 테스트 — Newman/네트워크 없이 통계만 검증.
 *   node --test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, evaluate, SLO } from './qass-perf.js';

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

test('evaluate: 모든 기준 충족이면 PASS', () => {
  const r = evaluate({ okRate: 1, failures: 0, latencyMs: { p95: 110, p99: 166 } }, SLO);
  assert.equal(r.verdict, 'PASS');
  assert.ok(r.checks.every((c) => c.pass));
  assert.equal(r.checks.length, 4);
});

test('evaluate: p95 초과면 FAIL (해당 항목만 실패)', () => {
  const r = evaluate({ okRate: 1, failures: 0, latencyMs: { p95: 999, p99: 166 } }, SLO);
  assert.equal(r.verdict, 'FAIL');
  assert.equal(r.checks.find((c) => c.key === 'p95').pass, false);
  assert.equal(r.checks.find((c) => c.key === 'p99').pass, true);
});

test('evaluate: 성공률 미달이면 FAIL', () => {
  const r = evaluate({ okRate: 0.98, failures: 0, latencyMs: { p95: 110, p99: 166 } }, SLO);
  assert.equal(r.verdict, 'FAIL');
  assert.equal(r.checks.find((c) => c.key === 'okRate').pass, false);
});

test('evaluate: 치명 오류 1건이면 FAIL', () => {
  const r = evaluate({ okRate: 1, failures: 1, latencyMs: { p95: 110, p99: 166 } }, SLO);
  assert.equal(r.verdict, 'FAIL');
});
