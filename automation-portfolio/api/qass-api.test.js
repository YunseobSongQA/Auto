/**
 * 순수 함수 단위 테스트 — 네트워크 없이 searchCaptures 만 검증.
 * 핵심 로직을 격리했기에 가능한 일입니다. (구축기 2번)
 *   node --test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCaptures } from './qass-api.js';

const sample = [
  { url: 'https://www.google.com/search?q=a', title: '구글 검색' },
  { url: 'https://naver.com', title: '네이버' },
  { url: 'https://example.com', title: 'Google Docs 안내' },
];

test('term 으로 url 매칭', () => {
  assert.equal(searchCaptures(sample, 'google').length, 2); // url 1 + title 1
});

test('대소문자 무시', () => {
  assert.equal(searchCaptures(sample, 'GOOGLE').length, 2);
});

test('title 한글 매칭', () => {
  assert.equal(searchCaptures(sample, '네이버').length, 1);
});

test('빈 term 은 전체 반환(원본 불변)', () => {
  const out = searchCaptures(sample, '');
  assert.equal(out.length, sample.length);
  assert.notEqual(out, sample); // 사본
});

test('미스매치는 0건', () => {
  assert.equal(searchCaptures(sample, 'zzzznope').length, 0);
});
