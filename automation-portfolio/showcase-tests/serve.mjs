/**
 * serve.mjs — 테스트용 서버. 배포처(Cloudflare Pages)와 똑같이 동작하게 만든다.
 *  - 정적 파일(ASSETS)은 Range 요청을 무시하고 늘 200 + 파일 전체로 답한다 (실제 Pages 와 같음).
 *  - _routes.json 의 include 경로(/assets/*)만 web/_worker.js 를 거친다.
 * 그래서 이 서버로 돌리는 테스트는 워커의 Range 처리까지 그대로 검증한다.
 *
 * 사용: node serve.mjs [웹 폴더=../web] [포트=4173]
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, process.argv[2] || '../web');
const port = Number(process.argv[3] || 4173);

// _worker.js 는 확장자가 .js 라 Node 가 CommonJS 로 읽을 수 있다 → data: URL 로 ES 모듈로 불러온다.
const src = await fs.readFile(path.join(root, '_worker.js'), 'utf8');
const worker = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default;
const routes = JSON.parse(await fs.readFile(path.join(root, '_routes.json'), 'utf8'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

const ASSETS = {
  async fetch(request) {
    let p = decodeURIComponent(new URL(request.url).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root) || /^_(worker\.js|routes\.json)$/.test(path.basename(file))) {
      return new Response('Not found', { status: 404 });
    }
    try {
      const body = await fs.readFile(file);
      const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': String(body.length) };
      return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  },
};

const toRegExp = pattern => new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
const include = routes.include.map(toRegExp);
const exclude = (routes.exclude || []).map(toRegExp);
const viaWorker = p => include.some(r => r.test(p)) && !exclude.some(r => r.test(p));

http.createServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host}${req.url}`;
    const request = new Request(url, { method: req.method, headers: req.headers });
    const response = viaWorker(new URL(url).pathname) ? await worker.fetch(request, { ASSETS }) : await ASSETS.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (req.method === 'HEAD' || !response.body) return res.end();
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(port, '127.0.0.1', () => console.log(`showcase: http://127.0.0.1:${port}`));
