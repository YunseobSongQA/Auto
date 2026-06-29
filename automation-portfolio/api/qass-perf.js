/**
 * qass-perf.js — 부하 테스트의 순수 통계 계층.
 *
 * "API 자동화로 무엇을 했는가"를 수치로 답하기 위한 지표 계산입니다.
 * 부하 실행(요청 반복)은 Newman(Postman CLI)이 담당하고(loadtest.js),
 * 여기 summarize() 는 그 결과(지연 ms 배열)를 받아 통계만 냅니다.
 * 네트워크/Newman 없이 단위 테스트되는 순수 함수입니다. (구축기 2번)
 */
export const GOAL = 'QASS 백엔드(Supabase REST) 읽기 경로 성능·부하 검증';

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
