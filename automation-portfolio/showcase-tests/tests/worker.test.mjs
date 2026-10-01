// web/_worker.js 단위 테스트 (Node 내장 테스트 러너 · 브라우저 불필요)
// 배포처(Cloudflare Pages)는 Range 를 무시하고 늘 200 + 전체를 준다 → 가짜 ASSETS 도 그렇게 만든다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const src = await fs.readFile(new URL('../../web/_worker.js', import.meta.url), 'utf8');
const worker = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default;

const BODY = new Uint8Array(1000).map((_, i) => i % 256); // 1,000바이트짜리 가짜 영상
const seen = [];
const env = {
  ASSETS: {
    async fetch(req) {
      seen.push(req);
      if (req.headers.get('If-None-Match')) return new Response(null, { status: 304 });
      const path = new URL(req.url).pathname;
      if (path.endsWith('missing.mp4')) return new Response('nope', { status: 404 });
      return new Response(BODY, { status: 200, headers: { 'Content-Type': path.endsWith('.mp4') ? 'video/mp4' : 'image/png' } });
    },
  },
};
const get = (path, headers = {}, method = 'GET') => worker.fetch(new Request('https://x.dev' + path, { method, headers }), env);

test('bytes=0-1 → 206, 2바이트, Content-Range', async () => {
  const r = await get('/assets/a.mp4', { Range: 'bytes=0-1' });
  assert.equal(r.status, 206);
  assert.equal(r.headers.get('Content-Range'), 'bytes 0-1/1000');
  assert.equal(r.headers.get('Content-Length'), '2');
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [0, 1]);
});

test('끝까지(bytes=900-)·끝에서 N(bytes=-10) 구간', async () => {
  const a = await get('/assets/a.mp4', { Range: 'bytes=900-' });
  assert.equal(a.headers.get('Content-Range'), 'bytes 900-999/1000');
  const b = await get('/assets/a.mp4', { Range: 'bytes=-10' });
  assert.equal(b.headers.get('Content-Range'), 'bytes 990-999/1000');
  assert.equal((await b.arrayBuffer()).byteLength, 10);
});

test('파일보다 큰 시작점 → 416', async () => {
  const r = await get('/assets/a.mp4', { Range: 'bytes=5000-' });
  assert.equal(r.status, 416);
  assert.equal(r.headers.get('Content-Range'), 'bytes */1000');
});

test('여러 구간처럼 해석 못 하는 Range → 200 전체', async () => {
  const r = await get('/assets/a.mp4', { Range: 'bytes=0-1,5-9' });
  assert.equal(r.status, 200);
  assert.equal((await r.arrayBuffer()).byteLength, 1000);
});

test('조건부 헤더가 붙어도 Range 요청에는 304 가 아니라 206', async () => {
  const r = await get('/assets/a.mp4', { Range: 'bytes=0-1', 'If-None-Match': '"x"' });
  assert.equal(r.status, 206);
  assert.equal(seen.at(-1).headers.get('If-None-Match'), null); // 정적 파일에는 조건 없이 물었다
});

test('Range 없는 영상 요청에도 Accept-Ranges·Content-Length 를 붙인다 (되감기 조건)', async () => {
  const r = await get('/assets/a.mp4');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(r.headers.get('Content-Length'), '1000');
});

test('영상이 아닌 파일·없는 파일은 그대로 넘긴다', async () => {
  const png = await get('/assets/og.png', { Range: 'bytes=0-1' });
  assert.equal(png.status, 200);
  assert.equal(png.headers.get('Content-Range'), null);
  const missing = await get('/assets/missing.mp4', { Range: 'bytes=0-1' });
  assert.equal(missing.status, 404);
});
