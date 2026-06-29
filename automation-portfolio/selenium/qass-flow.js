/**
 * qass-flow.js — QASS 공통 플로우의 Selenium WebDriver 구현 (골격).
 *
 * 계약(입출력)은 ../FLOW_CONTRACT.md 가 단일 진실 공급원입니다.
 *   runFlow(driver, opts) -> FlowResult        (tool: 'selenium')
 *
 * Playwright 구현(../playwright/qass-flow.js)과 **같은 8 스텝·같은 FlowResult** 를
 * 반환합니다. 다른 건 도구뿐 — "같은 QASS · 다른 도구" 비교의 핵심입니다.
 *
 * 상태: 골격(stub). 선택자/플로우는 Playwright 구현에서 검증된 것을 그대로 옮겼습니다.
 *       로컬에서 chromedriver 로 한 번 돌려 타이밍만 맞추면 완성됩니다. (TODO 참고)
 */
import { By, until } from 'selenium-webdriver';

export const FLOW_ID = 'qass-core-evidence-flow';
export const TARGET = 'https://qass1.pages.dev/';
export const TEST_ROOM_NAME = 'QASS 테스트 방';
export const TEST_ROOM_PASSWORD = 'qass1234';

const T = 15_000; // 공통 대기 한도(ms)

/**
 * @param {import('selenium-webdriver').WebDriver} driver
 * @param {{ name?: string, search?: string }} [opts]
 * @returns {Promise<FlowResult>}
 */
export async function runFlow(driver, opts = {}) {
  const name = opts.name || 'QA봇';
  const searchTerm = opts.search || 'google';

  const steps = [];
  const startedAt = new Date();

  // Playwright 구현과 동일한 step 래퍼: 던지지 않고 결과만 수집, 앞이 실패하면 skip.
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

  const visible = (css) => driver.wait(until.elementIsVisible(driver.findElement(By.css(css))), T);

  await step('open_landing', async () => {
    await driver.get(TARGET);
    await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(., '테스트에 돌려드립니다')]")),
      T,
    );
  });

  await step('go_app', async () => {
    await driver.get(`${TARGET}app.html`);
    await visible('#login-screen');
  });

  await step('login', async () => {
    await driver.findElement(By.css('#login-name')).sendKeys(name);
    await driver.findElement(By.css('#btn-login')).click();
    await visible('#rooms-screen');
  });

  await step('rooms_loaded', async () => {
    await driver.wait(until.elementLocated(By.css('.room-card')), T);
    await driver.wait(
      until.elementLocated(
        By.xpath(`//*[contains(@class,'room-card')][.//*[contains(., '${TEST_ROOM_NAME}')]]`),
      ),
      T,
    );
    const count = (await driver.findElements(By.css('.room-card'))).length;
    return `${count} room card(s)`;
  });

  await step('open_test_room', async () => {
    // TEST_ROOM_NAME 을 포함하는 카드의 입장 버튼을 클릭.
    const card = await driver.findElement(
      By.xpath(`//*[contains(@class,'room-card')][.//*[contains(., '${TEST_ROOM_NAME}')]]`),
    );
    await card.findElement(By.css('.room-enter-btn')).click();
    await visible('#enter-room-modal');
  });

  await step('enter_room', async () => {
    await driver.findElement(By.css('#enter-room-password')).sendKeys(TEST_ROOM_PASSWORD);
    await driver.findElement(By.css('#enter-uploader-name')).sendKeys(name);
    await driver.findElement(By.css('#btn-enter-room-submit')).click();
    await visible('#room-screen');
  });

  await step('captures_loaded', async () => {
    // count-label 이 "불러오는 중…" 에서 바뀔 때까지 대기.
    await driver.wait(async () => {
      const txt = await driver.findElement(By.css('#count-label')).getText();
      return txt && !/불러오는/.test(txt);
    }, T);
    return (await driver.findElement(By.css('#count-label')).getText()).trim();
  });

  await step('search', async () => {
    const box = await driver.findElement(By.css('#search'));
    await box.sendKeys(searchTerm);
    // TODO: 로컬 실행 시 필터 렌더 타이밍 확인. 필요하면 짧은 sleep 또는 grid 변화 대기 추가.
    const val = await box.getAttribute('value');
    if (val !== searchTerm) throw new Error('search input not reflected');
    return `filtered by "${searchTerm}"`;
  });

  const finishedAt = new Date();
  const status = steps.some((s) => s.status === 'fail') ? 'fail' : 'pass';

  return {
    tool: 'selenium',
    flowId: FLOW_ID,
    target: TARGET,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    status,
    steps,
  };
}
