/**
 * qass-perf.js — 부하 테스트의 순수 통계 계층.
 *
 * "API 자동화로 무엇을 했는가"를 수치로 답하기 위한 지표 계산입니다.
 * 부하 실행(요청 반복)은 Newman(Postman CLI)이 담당하고(loadtest.js),
 * 여기 summarize() 는 그 결과(지연 ms 배열)를 받아 통계만 냅니다.
 * 네트워크/Newman 없이 단위 테스트되는 순수 함수입니다. (구축기 2번)
 */
export const GOAL = 'QASS 백엔드(Supabase REST) 읽기 경로 성능·부하 검증';

// 운영 합격 기준(SLO). 자주 바뀌는 값이라 데이터로 분리. (구축기 3번)
// 국내 운영 API 의 통상 기준선: 가용성 99.9%, 읽기 p95 ≤ 300ms, p99 ≤ 800ms, 치명오류 0.
export const SLO = {
  okRateMin: 0.999, // 가용성(성공률) ≥ 99.9%
  p95MaxMs: 300, //   p95 응답시간 ≤ 300ms
  p99MaxMs: 800, //   p99 응답시간 ≤ 800ms
  maxFailures: 0, //  치명 오류(assertion/5xx) = 0
};

const round1 = (n) => Math.round(n * 10) / 10;

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
  const checks = [
    {
      key: 'okRate', name: '가용성(성공률)', unit: 'rate',
      actual: summary.okRate, op: '≥', threshold: slo.okRateMin,
      pass: summary.okRate >= slo.okRateMin,
    },
    {
      key: 'p95', name: 'p95 응답시간', unit: 'ms',
      actual: L.p95, op: '≤', threshold: slo.p95MaxMs,
      pass: L.p95 <= slo.p95MaxMs,
    },
    {
      key: 'p99', name: 'p99 응답시간', unit: 'ms',
      actual: L.p99, op: '≤', threshold: slo.p99MaxMs,
      pass: L.p99 <= slo.p99MaxMs,
    },
    {
      key: 'failures', name: '치명 오류', unit: 'count',
      actual: summary.failures, op: '≤', threshold: slo.maxFailures,
      pass: summary.failures <= slo.maxFailures,
    },
  ];
  return { verdict: checks.every((c) => c.pass) ? 'PASS' : 'FAIL', checks };
}
