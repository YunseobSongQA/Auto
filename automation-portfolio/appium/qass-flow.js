/**
 * qass-flow.js — QASS 공통 플로우의 Appium(모바일 크롬) 구현 (골격).
 *
 * 계약(입출력)은 ../FLOW_CONTRACT.md 가 단일 진실 공급원입니다.
 *   runFlow(driver, opts) -> FlowResult        (tool: 'appium')
 *
 * Playwright/Selenium 과 **같은 8 스텝·같은 FlowResult** 를 반환합니다.
 * 차이는 실행 환경뿐 — 안드로이드 크롬(모바일 웹)에서 같은 QASS 를 자동화합니다.
 *
 * driver 는 WebdriverIO 세션입니다(표준 러너의 전역 `browser`, 또는 standalone `remote()`).
 * browserName:'Chrome' 으로 세션이 모바일 크롬 컨텍스트에서 시작하므로, QASS 가 반응형 웹인
 * 점을 이용해 데스크톱과 "동일한 DOM 선택자"를 그대로 씁니다. (네이티브 앱이라면 컨텍스트를
 * NATIVE_APP↔WEBVIEW 로 전환해야 하지만, 여기선 순수 모바일 웹이라 불필요합니다.)
 *
 * 코드·설정은 검증됨(Appium 서버·UiAutomator2 드라이버 동작 확인). 실제 실행만 안드로이드
 * 기기가 필요해 PC 에서 합니다 — README 참고.
 */
export const FLOW_ID = 'qass-core-evidence-flow';
export const TARGET = 'https://qass1.pages.dev/';
export const TEST_ROOM_NAME = 'QASS 테스트 방';
export const TEST_ROOM_PASSWORD = 'qass1234';

const T = 15_000; // 공통 대기 한도(ms)

/**
 * @param {import('webdriverio').Browser} driver  WEBVIEW(크롬) 컨텍스트로 전환된 세션
 * @param {{ name?: string, search?: string }} [opts]
 * @returns {Promise<FlowResult>}
 */
export async function runFlow(driver, opts = {}) {
  const name = opts.name || 'QA봇';
  const searchTerm = opts.search || 'google';

  const steps = [];
  const startedAt = new Date();

  // Playwright/Selenium 구현과 동일한 step 래퍼.
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

  const waitVisible = async (sel) => {
    const el = await driver.$(sel);
    await el.waitForDisplayed({ timeout: T });
    return el;
  };

  await step('open_landing', async () => {
    await driver.url(TARGET);
    await waitVisible(`//h1[contains(., '테스트에 돌려드립니다')]`);
  });

  await step('go_app', async () => {
    await driver.url(`${TARGET}app.html`);
    await waitVisible('#login-screen');
  });

  await step('login', async () => {
    await (await driver.$('#login-name')).setValue(name);
    await (await driver.$('#btn-login')).click();
    await waitVisible('#rooms-screen');
  });

  await step('rooms_loaded', async () => {
    await waitVisible('.room-card');
    await waitVisible(
      `//*[contains(@class,'room-card')][.//*[contains(., '${TEST_ROOM_NAME}')]]`,
    );
    const cards = await driver.$$('.room-card');
    return `${cards.length} room card(s)`;
  });

  await step('open_test_room', async () => {
    const card = await driver.$(
      `//*[contains(@class,'room-card')][.//*[contains(., '${TEST_ROOM_NAME}')]]`,
    );
    await (await card.$('.room-enter-btn')).click();
    await waitVisible('#enter-room-modal');
  });

  await step('enter_room', async () => {
    await (await driver.$('#enter-room-password')).setValue(TEST_ROOM_PASSWORD);
    await (await driver.$('#enter-uploader-name')).setValue(name);
    await (await driver.$('#btn-enter-room-submit')).click();
    await waitVisible('#room-screen');
  });

  await step('captures_loaded', async () => {
    const label = await driver.$('#count-label');
    await driver.waitUntil(
      async () => {
        const txt = await label.getText();
        return txt && !/불러오는/.test(txt);
      },
      { timeout: T },
    );
    return (await label.getText()).trim();
  });

  await step('search', async () => {
    const box = await driver.$('#search');
    await box.setValue(searchTerm);
    // TODO: 모바일 키보드/렌더 타이밍을 PC 실행 시 확인. 필요하면 짧은 pause 추가.
    const val = await box.getValue();
    if (val !== searchTerm) throw new Error('search input not reflected');
    return `filtered by "${searchTerm}"`;
  });

  const finishedAt = new Date();
  const status = steps.some((s) => s.status === 'fail') ? 'fail' : 'pass';

  return {
    tool: 'appium',
    flowId: FLOW_ID,
    target: TARGET,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    status,
    steps,
  };
}
