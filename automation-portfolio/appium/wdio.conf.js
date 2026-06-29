/**
 * wdio.conf.js — WebdriverIO + Appium 표준 테스트 러너 설정.
 *
 * 이게 현업에서 모바일 자동화를 돌리는 가장 보편적인 형태입니다:
 *   - WebdriverIO 가 테스트를 실행하고
 *   - `appium` 서비스가 로컬 Appium 서버를 자동으로 띄웠다 내리고
 *   - UiAutomator2 드라이버가 안드로이드를, browserName: 'Chrome' 이 모바일 크롬을 몹니다.
 *
 * 실행:  npx wdio run ./wdio.conf.js    (= npm test)
 * 전제:  안드로이드 에뮬레이터/실기기 + Chrome.  (코드스페이스 X, PC 에서 — README 참고)
 *
 * 플로우/결과 형태는 ../FLOW_CONTRACT.md 가 단일 진실 공급원입니다.
 */
export const config = {
  runner: 'local',
  specs: ['./test/**/*.e2e.js'],
  maxInstances: 1, // 모바일 디바이스 1대 — 병렬 금지

  // ── 디바이스/앱 능력(capabilities) — W3C 표준, Appium 은 vendor 접두사 `appium:` 사용 ──
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2', // 안드로이드 표준 드라이버
      'appium:deviceName': 'Android Emulator', // adb 에 잡힌 기기면 사실상 무시됨
      // 모바일 "웹" 자동화: 앱 대신 크롬을 띄운다 → 세션이 WEBVIEW(크롬) 컨텍스트로 시작.
      // chromedriver 는 UiAutomator2 드라이버가 기기 크롬 버전에 맞춰 자동 관리.
      browserName: 'Chrome',
      'appium:newCommandTimeout': 240,
      // 기기 크롬과 chromedriver 가 안 맞으면 아래로 자동 다운로드 허용:
      'appium:chromedriverAutodownload': true,
    },
  ],

  // 로컬 Appium 서버를 테스트 시작/종료에 맞춰 자동 기동·종료.
  services: ['appium'],
  // (수동으로 `appium` 을 따로 띄웠다면 위 services 를 빼고 hostname/port 를 지정)

  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 120000 },
  reporters: ['spec'],

  logLevel: 'warn',
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
};
