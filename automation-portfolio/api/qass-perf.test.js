/**
 * summarize 순수 함수 단위 테스트 — Newman/네트워크 없이 통계만 검증.
 *   node --test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from './qass-perf.js';

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
