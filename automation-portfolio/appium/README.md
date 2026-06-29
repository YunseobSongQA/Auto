# Appium — QASS 모바일 크롬 (안드로이드)

같은 QASS 플로우를 **모바일 크롬(안드로이드)** 에서 실행합니다. Playwright/Selenium 과
**같은 8 스텝·같은 FlowResult** 를 반환하되 환경만 모바일 웹입니다. QASS 가 반응형이라
DOM 선택자는 데스크톱과 동일하게 재사용합니다.

플로우/결과 형태는 [`../FLOW_CONTRACT.md`](../FLOW_CONTRACT.md) 가 단일 진실 공급원입니다.

## 실행 방식 두 가지

| 방식 | 파일 | 설명 |
|------|------|------|
| **표준 러너 (권장)** | `wdio.conf.js` + `test/qass.e2e.js` | 현업 표준. WebdriverIO 가 Appium 서버를 자동 기동하고 mocha 스펙으로 검증 |
| standalone (참고) | `run.js` | `webdriverio.remote()` 로 직접 세션을 만드는 가장 단순한 형태 |

둘 다 같은 `qass-flow.js` 의 `runFlow(driver, opts) -> FlowResult` 를 호출합니다.

## 검증 상태

- ✅ **이 저장소(코드스페이스)에서 검증됨**: Appium 서버(3.5.2) 기동 + UiAutomator2 드라이버
  설치 + WebdriverIO 설정/스펙 로드. 즉 **코드·설정은 정상**입니다.
- 🟡 **PC 필요**: 안드로이드 에뮬레이터/실기기만 있으면 그대로 돌아갑니다. 클라우드
  컨테이너는 에뮬레이터(KVM·메모리) 제약이 커서 **실제 실행·녹화는 PC 에서** 합니다.

## PC 실행 (Node 18+ · Android SDK 필요)

```bash
# 1) 의존성 + Appium 드라이버
npm install
npm run setup                 # = appium driver install uiautomator2

# 2) 안드로이드 기기 준비 (둘 중 하나)
#   - Android Studio 로 AVD(에뮬레이터) 생성 후 실행, 또는
#   - USB 디버깅 켠 실기기 연결
adb devices                   # 기기가 'device' 로 보이는지 확인 (+ 기기에 Chrome 설치)

# 3) 실행 — 표준 러너 (Appium 서버 자동 기동)
npm test

#    또는 standalone 방식:
#    npx appium &             # 별도 터미널에서 서버 기동
#    npm run test:standalone
```

성공하면 8 스텝이 모두 통과한 `FlowResult` 가 출력되고 `artifacts/` 에 저장됩니다.
녹화가 필요하면 `adb shell screenrecord` 또는 Android Studio 화면 녹화로 떠서
`web/assets/appium.webm` 에 넣고, `web/config.js` 의 appium 항목을 `pending → video` 로 바꾸면
쇼케이스 카드에 영상이 붙습니다.

## 구조

| 파일 | 역할 |
|------|------|
| `qass-flow.js` | 플로우 구현. `runFlow(driver, opts) -> FlowResult` (타 도구와 동일 계약) |
| `wdio.conf.js` | WebdriverIO 표준 설정 — capabilities, appium 서비스, mocha |
| `test/qass.e2e.js` | mocha 스펙. `runFlow` 호출 + 계약 검증 + 결과 저장 |
| `run.js` | standalone 러너(`remote()`) — 가장 단순한 참고용 |

## 모바일 웹 자동화 메모 (배우기용)

- `browserName: 'Chrome'` 이면 세션이 **모바일 크롬(WEBVIEW)** 컨텍스트로 시작 — 그래서
  웹 선택자(`$('#login-name')` 등)를 바로 씁니다. 네이티브 앱이라면 `driver.getContexts()` →
  `driver.switchContext('WEBVIEW_...')` 로 전환해야 합니다.
- `chromedriver` 는 UiAutomator2 드라이버가 기기 크롬 버전에 맞춰 자동 관리합니다
  (`appium:chromedriverAutodownload: true`).
