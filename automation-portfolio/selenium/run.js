/**
 * run.js — Selenium 러너 (골격).
 * 헤드리스 크롬 드라이버를 띄워 runFlow 를 돌리고 FlowResult 를 출력/저장합니다.
 *
 * 전제: chrome/chromedriver 설치 (selenium-webdriver 4 는 Selenium Manager 가
 *       드라이버를 자동 해결합니다). 로컬/Codespaces 에서 `npm test` 로 실행.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { runFlow, FLOW_ID } from './qass-flow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.join(__dirname, 'artifacts');

const options = new chrome.Options()
  .addArguments('--no-sandbox', '--disable-dev-shm-usage')
  .windowSize({ width: 1280, height: 800 });

// 녹화(record.sh)는 Xvfb 가상 디스플레이에서 headed 로 띄워 ffmpeg x11grab 으로 캡처합니다.
// 평소엔 headless. HEADED=1 이면 headed(녹화용), CHROME_BIN 으로 크롬 바이너리 지정 가능.
if (!process.env.HEADED) options.addArguments('--headless=new');
if (process.env.CHROME_BIN) options.setChromeBinaryPath(process.env.CHROME_BIN);

const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

try {
  const result = await runFlow(driver, { name: 'QA봇', search: process.argv[2] || 'google' });
  console.log('\n=== FlowResult ===\n' + JSON.stringify(result, null, 2) + '\n');

  fs.mkdirSync(ARTIFACTS, { recursive: true });
  fs.writeFileSync(
    path.join(ARTIFACTS, `${FLOW_ID}.result.json`),
    JSON.stringify(result, null, 2),
  );
  process.exitCode = result.status === 'pass' ? 0 : 1;
} finally {
  await driver.quit();
}
