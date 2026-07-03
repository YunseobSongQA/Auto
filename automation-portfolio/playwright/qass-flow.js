/**
 * qass-flow.js — QASS 공통 플로우의 Playwright 구현.
 *
 * 계약(입출력)은 ../FLOW_CONTRACT.md 가 단일 진실 공급원입니다.
 *   runFlow(page, opts) -> FlowResult
 * 내부 구현은 자유롭게 바꿔도, 이 시그니처와 FlowResult 형태만 지키면
 * 호출부(테스트/리포트)는 영향받지 않습니다. (구축기 5번 · 모듈 경계 고정)
 */

export const FLOW_ID = 'qass-core-evidence-flow';
export const TARGET = 'https://qass1.pages.dev/';
export const TEST_ROOM_NAME = 'QASS 테스트 방';
export const TEST_ROOM_PASSWORD = 'qass1234';

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ name?: string, search?: string }} [opts]
 * @returns {Promise<FlowResult>}
 */
export async function runFlow(page, opts = {}) {
  const name = opts.name || 'QA봇';
  const searchTerm = opts.search || 'google';

  const steps = [];
  const startedAt = new Date();

  // 한 스텝 실행 + 타이밍/통과여부 기록. 던지지 않고 결과만 수집한다.
  async function step(id, fn) {
    // 앞 스텝이 실패하면 이후는 skip (의존 관계)
    if (steps.some(s => s.status === 'fail')) {
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

  await step('open_landing', async () => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('h1', { hasText: '테스트에 돌려드립니다' }).first().waitFor({ timeout: 10_000 });
  });

  await step('go_app', async () => {
    await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#login-screen').waitFor({ state: 'visible', timeout: 10_000 });
  });

  await step('login', async () => {
    await page.fill('#login-name', name);
    await page.click('#btn-login');
    await page.locator('#rooms-screen').waitFor({ state: 'visible', timeout: 10_000 });
  });

  await step('rooms_loaded', async () => {
    await page.locator('.room-card').first().waitFor({ timeout: 15_000 });
    const card = page.locator('.room-card', { hasText: TEST_ROOM_NAME });
    await card.first().waitFor({ timeout: 15_000 });
    const count = await page.locator('.room-card').count();
    return `${count} room card(s)`;
  });

  await step('open_test_room', async () => {
    const card = page.locator('.room-card', { hasText: TEST_ROOM_NAME }).first();
    await card.locator('.room-enter-btn').click();
    // 테스트 방은 (비밀번호 모달) 또는 (무비번 바로 입장) 두 형태 → 둘 중 하나가 보일 때까지 대기.
    await Promise.race([
      page.locator('#enter-room-modal').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {}),
      page.locator('#room-screen').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {}),
    ]);
  });

  await step('enter_room', async () => {
    // 비밀번호 모달이 뜨는 방이면 입력 후 제출, 무비번 방이면 이미 room-screen 이라 바로 통과.
    if (await page.locator('#enter-room-modal').isVisible()) {
      await page.fill('#enter-room-password', TEST_ROOM_PASSWORD);
      await page.fill('#enter-uploader-name', name);
      await page.click('#btn-enter-room-submit');
      await page.locator('#room-screen').waitFor({ state: 'visible', timeout: 10_000 });
      return 'entered via password modal';
    }
    await page.locator('#room-screen').waitFor({ state: 'visible', timeout: 10_000 });
    return 'no-password room · entered directly';
  });

  await step('captures_loaded', async () => {
    // count-label 이 "불러오는 중…" 에서 바뀔 때까지 대기
    await page.waitForFunction(() => {
      const el = document.getElementById('count-label');
      return el && !/불러오는/.test(el.textContent || '');
    }, { timeout: 15_000 });
    return (await page.locator('#count-label').textContent())?.trim() || '';
  });

  await step('search', async () => {
    await page.fill('#search', searchTerm);
    // 입력 반영 확인 (renderFiltered 는 input 이벤트로 동작)
    await page.waitForTimeout(400);
    const val = await page.inputValue('#search');
    if (val !== searchTerm) throw new Error('search input not reflected');
    return `filtered by "${searchTerm}"`;
  });

  const finishedAt = new Date();
  const status = steps.some(s => s.status === 'fail') ? 'fail' : 'pass';

  return {
    tool: 'playwright',
    flowId: FLOW_ID,
    target: TARGET,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    status,
    steps,
  };
}
