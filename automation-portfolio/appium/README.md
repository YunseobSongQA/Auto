# Appium — QASS 모바일 크롬 (안드로이드) 골격

같은 QASS 플로우를 **모바일 크롬(안드로이드)** 에서 실행합니다. Playwright/Selenium 과
**같은 8 스텝·같은 FlowResult** 를 반환하되, 환경만 모바일 웹입니다. QASS 가 반응형이라
DOM 선택자는 데스크톱과 동일하게 재사용합니다.

플로우/결과 형태는 [`../FLOW_CONTRACT.md`](../FLOW_CONTRACT.md) 가 단일 진실 공급원입니다.

## 상태: 골격(stub) — 실행은 PC에서

Appium 은 안드로이드 드라이버(UiAutomator2)와 에뮬레이터/실기기가 필요해 **Codespaces
에서 실행하지 않습니다.** 이번 산출물은 동일 계약 골격까지이며, 아래 절차대로 PC에서
실행하면 됩니다.

## 실행 (PC · Node 18+ · Android SDK 필요)

```bash
# 1) Appium + 드라이버 (전역 1회)
npm i -g appium
appium driver install uiautomator2

# 2) 안드로이드 준비
#    - Android SDK / 에뮬레이터(AVD) 또는 USB 디버깅 켠 실기기
#    - 기기에 Chrome 설치
#    - adb devices 로 기기 인식 확인

# 3) Appium 서버 실행 (별도 터미널)
appium                       # 기본 127.0.0.1:4723

# 4) 이 프로젝트
npm install
npm test                     # 모바일 크롬으로 플로우 실행 + FlowResult 출력/저장
npm test naver               # 검색어 변경 (기본값: google)
```

### 환경변수 (선택)

| 변수 | 기본값 | 용도 |
|------|--------|------|
| `APPIUM_HOST` | `127.0.0.1` | Appium 서버 호스트 |
| `APPIUM_PORT` | `4723` | Appium 서버 포트 |
| `QASS_DEVICE` | `Android Emulator` | `appium:deviceName` |

> 기기 크롬 버전과 chromedriver 가 안 맞으면 `run.js` 의 `chromedriverExecutable` 주석을
> 풀어 경로를 지정하세요.

## 구조

| 파일 | 역할 |
|------|------|
| `qass-flow.js` | 플로우 구현. `runFlow(driver, opts) -> FlowResult` (타 도구와 동일 계약) |
| `run.js` | 러너. webdriverio 로 Appium 세션 생성 + 결과 저장 |
