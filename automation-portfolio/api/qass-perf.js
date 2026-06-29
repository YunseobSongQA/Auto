/**
 * qass-perf.js — 부하 테스트의 순수 통계 계층.
 *
 * "API 자동화로 무엇을 했는가"를 수치로 답하기 위한 지표 계산입니다.
 * 부하 실행(요청 반복)은 Newman(Postman CLI)이 담당하고(loadtest.js),
 * 여기 summarize() 는 그 결과(지연 ms 배열)를 받아 통계만 냅니다.
 * 네트워크/Newman 없이 단위 테스트되는 순수 함수입니다. (구축기 2번)
 */
export const GOAL = 'QASS 백엔드(Supabase REST) 읽기 경로 성능·부하 검증';

// 합격 기준(SLO) — 임의값이 아니라 공인 표준에 근거. 자주 바뀌어 데이터로 분리. (구축기 3번)
//  · ISO/IEC 25010 성능효율성(시간반응성)·신뢰성(가용성) 품질 특성
//  · ISO/IEC 25023 품질 정량 측정 방법(응답시간·처리량)
//  · Apdex 산업 표준(목표 T 기준 체감 성능 0~1, 0.94↑ = Excellent)
//  · SLA 가용성 등급 99.9%(three nines)
export const SLO = {
  apdexT: 200, //     Apdex 목표 응답시간 T(ms) — T 이하 "만족", 4T 이하 "허용"
  apdexMin: 0.94, //  Apdex ≥ 0.94 (Apdex 표준의 Excellent 등급)
  okRateMin: 0.999, // 가용성 ≥ 99.9% (SLA three nines)
  p95MaxMs: 300, //   p95 응답시간 ≤ 300ms (ISO/IEC 25010 시간반응성)
  p99MaxMs: 800, //   p99 응답시간 ≤ 800ms
  maxFailures: 0, //  치명 오류 = 0 (ISO/IEC 25010 신뢰성·성숙성)
};

// 결과에 함께 싣는 근거 표준(쇼케이스가 그대로 표시 → 객관적 근거 노출).
export const STANDARDS = [
  { id: 'ISO/IEC 25010', desc: '소프트웨어 제품 품질 모델 — 성능효율성(시간반응성·수용력)·신뢰성(가용성)' },
  { id: 'ISO/IEC 25023', desc: '품질 정량 측정 — 응답시간·처리량 측정 방법' },
  { id: 'Apdex', desc: '애플리케이션 성능 지수 — 목표 T 기준 사용자 체감 성능(0~1)' },
  { id: 'SLA 99.9%', desc: '가용성 three nines — 업계 통용 가용성 등급' },
];

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Apdex (Application Performance Index) — 산업 표준 체감 성능 점수.
 * 만족(≤T) + 허용(≤4T)/2 를 전체로 나눈 0~1 값. 순수 함수.
 * @param {number[]} samples ms
 * @param {number} t 목표 응답시간(ms)
 */
export function apdex(samples, t) {
  const s = samples.filter((x) => Number.isFinite(x));
  if (!s.length) return { score: 0, t, satisfied: 0, tolerating: 0, frustrated: 0, rating: 'N/A' };
  let sat = 0, tol = 0;
  for (const v of s) {
    if (v <= t) sat++;
    else if (v <= 4 * t) tol++;
  }
  const frustrated = s.length - sat - tol;
  const score = round2((sat + tol / 2) / s.length);
  return { score, t, satisfied: sat, tolerating: tol, frustrated, rating: apdexRating(score) };
}

// Apdex 표준 등급 밴드.
export function apdexRating(x) {
  return x >= 0.94 ? 'Excellent' : x >= 0.85 ? 'Good' : x >= 0.7 ? 'Fair' : x >= 0.5 ? 'Poor' : 'Unacceptable';
}

/**
 * 지연 샘플(ms) 배열 → 통계(min/avg/p50/p90/p95/p99/max).
 * @param {number[]} samples
 */
export function summarize(samples) {
  const s = samples.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return { count: 0 };
  // nearest-rank 백분위 (q 분위의 1-based 순위)
  const at = (q) => s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))];
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    count: s.length,
    min: round1(s[0]),
    max: round1(s[s.length - 1]),
    avg: round1(sum / s.length),
    p50: round1(at(0.5)),
    p90: round1(at(0.9)),
    p95: round1(at(0.95)),
    p99: round1(at(0.99)),
  };
}

/**
 * 측정 지표를 SLO 기준과 비교해 항목별 통과/실패 + 종합 판정을 낸다.
 * 무엇을·왜·어떻게의 "결과(통과/실패)"를 한눈에 보여주는 순수 함수.
 * @param {{ okRate:number, failures:number, latencyMs:{p95:number,p99:number} }} summary
 * @param {typeof SLO} slo
 * @returns {{ verdict: 'PASS'|'FAIL', checks: Array }}
 */
export function evaluate(summary, slo = SLO) {
  const L = summary.latencyMs || {};
  const ax = summary.apdex || {};
  const checks = [
    {
      key: 'apdex', name: '체감 성능 점수', unit: 'score',
      actual: ax.score, op: '≥', threshold: slo.apdexMin,
      pass: ax.score >= slo.apdexMin,
      plain: '실제 사용자가 느끼는 빠름 정도 (1에 가까울수록 좋음)',
      standard: 'Apdex 국제 표준',
    },
    {
      key: 'okRate', name: '성공률', unit: 'rate',
      actual: summary.okRate, op: '≥', threshold: slo.okRateMin,
      pass: summary.okRate >= slo.okRateMin,
      plain: '요청이 실패 없이 성공한 비율',
      standard: 'SLA 99.9% · ISO/IEC 25010',
    },
    {
      key: 'p95', name: '응답속도 (상위 95%)', unit: 'ms',
      actual: L.p95, op: '≤', threshold: slo.p95MaxMs,
      pass: L.p95 <= slo.p95MaxMs,
      plain: '100번 중 95번이 이 시간 안에 응답',
      standard: 'ISO/IEC 25010·25023',
    },
    {
      key: 'p99', name: '응답속도 (상위 99%)', unit: 'ms',
      actual: L.p99, op: '≤', threshold: slo.p99MaxMs,
      pass: L.p99 <= slo.p99MaxMs,
      plain: '100번 중 99번이 이 시간 안에 응답 (느린 쪽 포함)',
      standard: 'ISO/IEC 25010·25023',
    },
    {
      key: 'failures', name: '오류 수', unit: 'count',
      actual: summary.failures, op: '≤', threshold: slo.maxFailures,
      pass: summary.failures <= slo.maxFailures,
      plain: '서버 오류·검증 실패 건수',
      standard: 'ISO/IEC 25010',
    },
  ];
  return { verdict: checks.every((c) => c.pass) ? 'PASS' : 'FAIL', checks };
}
