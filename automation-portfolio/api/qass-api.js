/**
 * qass-api.js — QASS 공통 플로우의 API(Supabase REST) 구현.
 *
 * 계약(입출력)은 ../FLOW_CONTRACT.md 가 단일 진실 공급원입니다.
 *   runFlow(opts) -> FlowResult        (tool: 'api')
 *   searchCaptures(captures, term) -> Capture[]   (순수 함수 · DOM/네트워크 없음)
 *
 * UI 도구(Playwright/Selenium/Appium)가 브라우저로 하는 일을,
 * 여기선 같은 데이터(rooms·captures)를 REST 로 직접 읽어 재현합니다.
 * 핵심 로직(검색)은 순수 함수로 격리해 테스트가 쉽습니다. (구축기 2번)
 */

export const FLOW_ID = 'qass-core-evidence-flow';
export const TARGET = 'https://qass1.pages.dev/';
export const TEST_ROOM_NAME = 'QASS 테스트 방';

// 데이터 계층 — QASS 클라이언트가 노출하는 공개 anon 키 (읽기 전용 플로우)
// main.js 의 SUPABASE_URL / SUPABASE_KEY 와 동일.
const SUPABASE_URL = 'https://snjexfohyklviarxprvm.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuamV4Zm9oeWtsdmlhcnhwcnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDgwODgsImV4cCI6MjA5MzI4NDA4OH0' +
  '.jxiiBLM4hyGwoJ7U4RC_M1Laqm0z8T0jHpmU3LlVW3k';
const REST = `${SUPABASE_URL}/rest/v1`;

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

// --- REST 읽기 (네트워크 계층) -------------------------------------------

// 공통 GET: Supabase REST 에 인증 헤더를 붙여 호출하고, 200 이 아니면 던진다.
async function restGet(pathAndQuery) {
  const res = await fetch(`${REST}/${pathAndQuery}`, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${pathAndQuery}`);
  }
  return res.json();
}

/** 방 목록. @returns {Promise<Array>} */
export function listRooms() {
  return restGet('rooms?select=id,room_name,created_by,created_at&order=created_at.asc');
}

/** 특정 방의 캡처(증적) 목록. @returns {Promise<Array>} */
export function listCaptures(roomId) {
  return restGet(
    `captures?select=id,url,title,uploader_name,captured_at,room_id` +
      `&room_id=eq.${encodeURIComponent(roomId)}&order=captured_at.asc`,
  );
}

// --- 핵심 로직 (순수 함수 · 격리) ----------------------------------------

/**
 * 캡처를 url|title 로 필터. UI 도구의 `#search` 동작과 동일한 규칙.
 * DOM·네트워크 없이 입출력만 → 단위 테스트 가능, UI 갈아엎어도 안 건드림.
 * @param {Array<{url?:string,title?:string}>} captures
 * @param {string} term
 */
export function searchCaptures(captures, term) {
  const q = (term || '').trim().toLowerCase();
  if (!q) return captures.slice();
  return captures.filter((c) =>
    `${c.url || ''} ${c.title || ''}`.toLowerCase().includes(q),
  );
}

// --- 플로우 (결과 계약 출력) ---------------------------------------------

/**
 * @param {{ search?: string }} [opts]
 * @returns {Promise<FlowResult>}
 */
export async function runFlow(opts = {}) {
  const searchTerm = opts.search || 'google';

  const steps = [];
  const startedAt = new Date();
  let testRoom = null;
  let captures = [];

  // 앞 스텝이 실패하면 이후는 skip (의존 관계) — Playwright 구현과 동일 패턴.
  async function step(id, fn) {
    if (steps.some((s) => s.status === 'fail')) {
      steps.push({ id, status: 'skip', ms: 0, note: 'previous step failed' });
      return;
    }
    const t0 = Date.now();
    try {
      const note = (await fn()) || '';
      steps.push({ id, status: 'pass', ms: Date.now() - t0, note });
    } catch (err) {
      steps.push({ id, status: 'fail', ms: Date.now() - t0, note: String(err.message || err) });
    }
  }

  let rooms = [];
  await step('list_rooms', async () => {
    rooms = await listRooms();
    if (!Array.isArray(rooms)) throw new Error('rooms is not an array');
    return `${rooms.length} room(s)`;
  });

  await step('find_test_room', async () => {
    testRoom = rooms.find((r) => r.room_name === TEST_ROOM_NAME);
    if (!testRoom) throw new Error(`room "${TEST_ROOM_NAME}" not found`);
    return `room_id=${testRoom.id}`;
  });

  await step('list_captures', async () => {
    captures = await listCaptures(testRoom.id);
    if (!Array.isArray(captures)) throw new Error('captures is not an array');
    return `${captures.length} capture(s)`;
  });

  await step('search', async () => {
    const hit = searchCaptures(captures, searchTerm);
    return `"${searchTerm}" → ${hit.length}/${captures.length} hit(s)`;
  });

  const finishedAt = new Date();
  const status = steps.some((s) => s.status === 'fail') ? 'fail' : 'pass';

  return {
    tool: 'api',
    flowId: FLOW_ID,
    target: TARGET,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    status,
    steps,
  };
}
