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
  .addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage')
  .windowSize({ width: 1280, height: 800 });

// TODO(video): Selenium 은 video 녹화가 기본 제공되지 않습니다.
//   녹화가 필요하면 Selenium Grid + RecordVideo, 또는 ffmpeg 화면 캡처를 붙이세요.
//   쇼케이스 데모 영상은 Playwright 산출물(playwright/artifacts/*.webm)을 재사용합니다.

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
