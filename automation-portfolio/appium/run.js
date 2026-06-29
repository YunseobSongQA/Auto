/**
 * run.js — Appium 러너 (골격). ※ 실행은 PC에서.
 *
 * 안드로이드 크롬(모바일 웹)으로 QASS 플로우를 돌립니다. webdriverio 로 Appium 서버에
 * 붙어 세션을 만들고, 크롬 WEBVIEW 컨텍스트에서 runFlow 를 실행합니다.
 *
 * 전제 (PC):
 *   - Appium 서버 실행:  appium  (uiautomator2 드라이버 설치돼 있어야 함)
 *   - 안드로이드 에뮬레이터/실기기 + 크롬 + 일치하는 chromedriver
 * 자세한 절차는 README.md 참고.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { remote } from 'webdriverio';
import { runFlow, FLOW_ID } from './qass-flow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.join(__dirname, 'artifacts');

// 모바일 크롬을 직접 띄우는 capabilities (browserName: 'Chrome' → 크롬 컨텍스트 자동).
const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.QASS_DEVICE || 'Android Emulator',
  browserName: 'Chrome',
  // TODO: 기기 크롬 버전에 맞는 chromedriver 경로가 필요하면 아래 주석을 사용하세요.
  // 'appium:chromedriverExecutable': '/path/to/chromedriver',
};

const driver = await remote({
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: Number(process.env.APPIUM_PORT || 4723),
  path: '/',
  logLevel: 'warn',
  capabilities,
});

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
  await driver.deleteSession();
}
