/**
 * loadtest.js — Postman 컬렉션을 Newman 으로 반복 실행해 QASS 백엔드 읽기 경로의
 * 성능·부하를 측정합니다. (Postman GUI 의 Collection Runner / 부하 테스트와 같은 목적,
 * CLI 라 Codespaces·CI 에서 헤드리스로 돌아갑니다.)
 *
 *   node loadtest.js [iterations]      # 기본 40회 반복(= 요청 80건)
 *
 * 산출: web/assets/api-perf.json (요청별 지연 분포·성공률·처리량 → 쇼케이스가 그래프로)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import newman from 'newman';
import { summarize, GOAL } from './qass-perf.js';
import { TARGET } from './qass-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COLLECTION = path.join(__dirname, 'postman', 'qass.postman_collection.json');
const WEB_ASSETS = path.join(__dirname, '..', 'web', 'assets');

const iterations = Number(process.argv[2]) || 40;
const round1 = (n) => Math.round(n * 10) / 10;

// Newman 을 프라미스로 감싸 실행 요약(run summary)을 받는다.
function runNewman(iterationCount) {
  return new Promise((resolve, reject) => {
    newman.run(
      { collection: COLLECTION, iterationCount, reporters: [], bail: false },
      (err, summary) => (err ? reject(err) : resolve(summary)),
    );
  });
}

const wall0 = performance.now();
const summary = await runNewman(iterations);
const wallMs = performance.now() - wall0;

// 요청 이름별로 응답시간(ms)·성공여부를 모은다.
const byName = new Map();
for (const ex of summary.run.executions) {
  const name = ex.item.name;
  const ms = ex.response ? ex.response.responseTime : NaN;
  const ok = !!ex.response && ex.response.code === 200 && (ex.assertions || []).every((a) => !a.error);
  if (!byName.has(name)) byName.set(name, { series: [], ok: 0, n: 0 });
  const b = byName.get(name);
  b.series.push(round1(ms));
  b.ok += ok ? 1 : 0;
  b.n += 1;
}

const endpoints = [...byName.entries()].map(([name, b]) => ({
  name,
  samples: b.n,
  okRate: round1((b.ok / b.n) * 100) / 100,
  throughputRps: round1(b.n / (wallMs / 1000)),
  latencyMs: summarize(b.series),
  series: b.series,
}));

const totalReq = summary.run.stats.requests.total;
const allSamples = endpoints.flatMap((e) => e.series);
const okAll = endpoints.reduce((a, e) => a + e.okRate * e.samples, 0) / (totalReq || 1);

const result = {
  tool: 'api',
  kind: 'load-test',
  runner: `Postman 컬렉션 · Newman (반복 ${iterations}회, 순차)`,
  goal: GOAL,
  target: `${TARGET} → Supabase REST`,
  startedAt: new Date().toISOString(),
  config: { iterations, endpoints: endpoints.length },
  summary: {
    totalRequests: totalReq,
    okRate: round1(okAll * 100) / 100,
    failures: summary.run.failures.length,
    wallMs: round1(wallMs),
    rps: round1(totalReq / (wallMs / 1000)),
    latencyMs: summarize(allSamples),
  },
  endpoints,
};

// 콘솔 요약 (수치)
const s = result.summary;
console.log(`\n=== QASS API 부하 테스트 (Postman·Newman) ===`);
console.log(`목표: ${result.goal}`);
console.log(`러너: ${result.runner}`);
console.log(`총 요청 ${s.totalRequests} · 성공률 ${(s.okRate * 100).toFixed(0)}% · 실패 ${s.failures} · ${s.rps} req/s · 벽시계 ${s.wallMs}ms`);
console.log(`전체 지연(ms): avg ${s.latencyMs.avg} · p50 ${s.latencyMs.p50} · p95 ${s.latencyMs.p95} · p99 ${s.latencyMs.p99}`);
for (const ep of endpoints) {
  const l = ep.latencyMs;
  console.log(`  ${ep.name}: p50 ${l.p50} · p95 ${l.p95} · max ${l.max} ms · ${ep.throughputRps} req/s · ok ${(ep.okRate * 100).toFixed(0)}%`);
}

fs.mkdirSync(WEB_ASSETS, { recursive: true });
fs.writeFileSync(path.join(WEB_ASSETS, 'api-perf.json'), JSON.stringify(result, null, 2));
console.log(`\nsaved: web/assets/api-perf.json`);

process.exit(s.failures === 0 ? 0 : 1);
