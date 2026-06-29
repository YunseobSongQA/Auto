/**
 * loadtest.js — QASS 백엔드 읽기 API 성능·부하 검증 (Postman 컬렉션 × Newman).
 *
 * 무엇을: rooms·captures 읽기 API 의 응답속도·가용성.
 * 왜:     동시 사용자 부하에서 운영 기준(SLO)을 만족하는지 — "호출 되나" 가 아니라
 *         "기준 안에서 빠르고 안정적인가" 를 통과/실패로 판정.
 * 어떻게: 가상 사용자(VU) N명이 각자 M회 반복을 "동시에" 호출(= N 동시성, 총 N×M×2 요청),
 *         지연 분포(p50/p95/p99)·성공률·처리량을 측정해 SLO 대비 PASS/FAIL.
 *
 *   node loadtest.js [vus] [iterationsPerVu]     # 기본 10 × 50 = 요청 1000건, 동시성 10
 *
 * 산출: web/assets/api-perf.json (판정·기준·수치·엔드포인트별 시계열 → 쇼케이스 그래프)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import newman from 'newman';
import { summarize, apdex, evaluate, SLO, STANDARDS, GOAL } from './qass-perf.js';
import { TARGET } from './qass-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COLLECTION = path.join(__dirname, 'postman', 'qass.postman_collection.json');
const WEB_ASSETS = path.join(__dirname, '..', 'web', 'assets');

const vus = Number(process.argv[2]) || 10;
const iterationsPerVu = Number(process.argv[3]) || 50;
const round1 = (n) => Math.round(n * 10) / 10;

// 가상 사용자 1명 = 컬렉션을 iterationCount 회 반복하는 Newman 실행 1개.
function runVU(iterationCount) {
  return new Promise((resolve, reject) => {
    newman.run(
      { collection: COLLECTION, iterationCount, reporters: [], bail: false },
      (err, summary) => (err ? reject(err) : resolve(summary)),
    );
  });
}

// VU 들을 동시에 실행 → 동시성 부하.
const wall0 = performance.now();
const runs = await Promise.all(Array.from({ length: vus }, () => runVU(iterationsPerVu)));
const wallMs = performance.now() - wall0;

// 모든 실행 결과를 요청 이름별로 집계.
const byName = new Map();
let failures = 0;
let totalReq = 0;
for (const run of runs) {
  failures += run.run.failures.length;
  totalReq += run.run.stats.requests.total;
  for (const ex of run.run.executions) {
    const name = ex.item.name;
    const ms = ex.response ? ex.response.responseTime : NaN;
    const ok = !!ex.response && ex.response.code === 200 && (ex.assertions || []).every((a) => !a.error);
    if (!byName.has(name)) byName.set(name, { series: [], ok: 0, n: 0 });
    const b = byName.get(name);
    b.series.push(round1(ms));
    b.ok += ok ? 1 : 0;
    b.n += 1;
  }
}

const endpoints = [...byName.entries()].map(([name, b]) => ({
  name,
  samples: b.n,
  okRate: round1((b.ok / b.n) * 1000) / 1000,
  throughputRps: round1(b.n / (wallMs / 1000)),
  latencyMs: summarize(b.series),
  series: b.series,
}));

const allSamples = endpoints.flatMap((e) => e.series);
const okCount = endpoints.reduce((a, e) => a + e.okRate * e.samples, 0);
const summary = {
  totalRequests: totalReq,
  okRate: round1((okCount / (totalReq || 1)) * 1000) / 1000,
  failures,
  wallMs: round1(wallMs),
  rps: round1(totalReq / (wallMs / 1000)),
  latencyMs: summarize(allSamples),
  apdex: apdex(allSamples, SLO.apdexT), // Apdex 산업 표준 체감 성능 점수
};

// SLO 대비 판정 (순수 함수).
const { verdict, checks } = evaluate(summary, SLO);

const result = {
  tool: 'api',
  kind: 'load-test',
  verdict,
  goal: GOAL,
  what: 'QASS 백엔드 읽기 API(rooms·captures)의 응답속도·가용성',
  why: '동시 사용자 부하에서 응답속도·안정성이 운영 기준(SLO)을 만족하는지',
  how: `가상 사용자 ${vus}명이 각 ${iterationsPerVu}회 동시 반복 호출(총 ${totalReq}건) → 지연·성공률 측정 → SLO 판정`,
  runner: `Postman 컬렉션 · Newman (가상 사용자 ${vus} × ${iterationsPerVu}회, 동시성 ${vus})`,
  target: `${TARGET} → Supabase REST`,
  startedAt: new Date().toISOString(),
  config: { vus, iterationsPerVu, totalRequests: totalReq, endpoints: endpoints.length },
  standards: STANDARDS, // 판정 근거가 된 공인 표준(쇼케이스가 표시)
  slo: SLO,
  checks,
  summary,
  endpoints,
};

// 콘솔: 판정 + 기준별 통과/실패 (한눈에)
const L = summary.latencyMs;
console.log(`\n=== QASS API 성능·부하 검증 (Postman·Newman) ===`);
console.log(`무엇을: ${result.what}`);
console.log(`왜:     ${result.why}`);
console.log(`어떻게: ${result.how}`);
console.log(`--------------------------------------------------`);
console.log(`총 요청 ${summary.totalRequests} · 성공률 ${(summary.okRate * 100).toFixed(2)}% · 실패 ${summary.failures} · ${summary.rps} req/s · 벽시계 ${summary.wallMs}ms`);
console.log(`지연(ms): avg ${L.avg} · p50 ${L.p50} · p95 ${L.p95} · p99 ${L.p99} · max ${L.max}`);
console.log(`Apdex: ${summary.apdex.score} (${summary.apdex.rating}) · 만족 ${summary.apdex.satisfied}/허용 ${summary.apdex.tolerating}/불만 ${summary.apdex.frustrated}`);
console.log(`근거 표준: ${STANDARDS.map((s) => s.id).join(' · ')}`);
console.log(`기준 판정:`);
for (const c of checks) {
  const fmt = (v) => (c.unit === 'rate' ? (v * 100).toFixed(2) + '%' : c.unit === 'ms' ? v + 'ms' : v);
  console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}: ${fmt(c.actual)} ${c.op} ${fmt(c.threshold)}  — ${c.standard}`);
}
console.log(`==================================================`);
console.log(`종합 판정: ${verdict}`);

fs.mkdirSync(WEB_ASSETS, { recursive: true });
fs.writeFileSync(path.join(WEB_ASSETS, 'api-perf.json'), JSON.stringify(result, null, 2));
console.log(`saved: web/assets/api-perf.json`);

process.exit(verdict === 'PASS' ? 0 : 1);
