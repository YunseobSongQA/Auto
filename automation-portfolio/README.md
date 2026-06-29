# Automation Portfolio — QASS 자동화 4종

**하나의 타깃([QASS](https://qass1.pages.dev/))을 4가지 도구로 자동화**한 포트폴리오입니다.
같은 사용자 플로우를 Playwright · Selenium · Appium · API 로 각각 구현해
**도구별 접근 방식의 차이**를 한 화면에서 비교합니다.

> 핵심 아이디어: **"같은 QASS · 다른 도구"**.
> 네 도구는 모두 [`FLOW_CONTRACT.md`](./FLOW_CONTRACT.md) 의 동일한 플로우/결과 계약을 따릅니다.

## 구조

```
automation-portfolio/
  web/          # Vanilla JS 쇼케이스 (Cloudflare Pages 배포 대상)
  playwright/   # ✅ 레퍼런스 완전 구현 (헤드리스 + video 녹화)
  selenium/     # ✅ 동일 플로우 실제 실행 + Xvfb/ffmpeg 녹화 (selenium.webm)
  appium/       # 🟡 모바일 크롬 — WebdriverIO 표준 러너 (툴체인 검증됨, 실행은 PC에서)
  api/          # ✅ Supabase REST 읽기 + Postman/Newman 부하·성능 테스트 (수치·그래프)
  FLOW_CONTRACT.md  # 단일 진실 공급원: 공통 플로우 + 결과 계약
  README.md
```

## 도구 매핑

| 도구 | 대상 | 상태 | 비고 |
|------|------|------|------|
| Playwright | QASS 웹 (데스크톱 크롬) | 완전 구현 | 핵심 플로우 + video 녹화 |
| Selenium | QASS 웹 (동일 플로우) | 완전 구현 | 실제 실행 + Xvfb/ffmpeg 녹화 |
| Appium | QASS 모바일 크롬 (안드로이드) | 표준 러너 구현 | WebdriverIO+Appium · 툴체인 검증 · 실행은 PC에서 |
| API | QASS 백엔드 (Supabase REST) | 완전 구현 | 읽기 플로우 + Postman/Newman 부하·성능 테스트 |

## 빠른 실행 (GitHub Codespaces 기준)

```bash
# 1) Playwright 레퍼런스
cd playwright && npm i && npx playwright install chromium && npm test

# 2) API — 읽기 플로우 + Postman/Newman 부하 테스트 (브라우저/드라이버 불필요)
cd api && npm i && npm start              # 기능 읽기 플로우(FlowResult)
#   부하·성능 검증(10 VU×50=1000건, SLO PASS/FAIL) → api-perf.json:  npm run loadtest

# 3) Selenium (헤드리스 실행, 또는 ./record.sh 로 화면 녹화)
cd selenium && npm i && npm test          # 헤드리스 실행
#   화면 녹화(Xvfb+ffmpeg) → web/assets/selenium.webm:  ./record.sh

# 4) Appium — WebdriverIO 표준 러너 (실행은 PC, 안드로이드 기기 필요)
cd appium && npm i && npm run setup && npm test   # 기기 연결 후. 자세히는 appium/README.md

# 5) 쇼케이스 웹 (빌드 없이 바로)
cd web && python3 -m http.server 8080   # http://localhost:8080
```

## 산출 결과

각 도구는 실행 시 [`FLOW_CONTRACT.md`](./FLOW_CONTRACT.md) §3 의 `FlowResult` JSON 을 출력합니다.
도구가 달라도 출력 형태가 같으므로 결과를 그대로 비교할 수 있습니다.

## 가정 (질문 대신 합리적 가정 — 구축기 7번)

- **API mock 불필요**: QASS 가 클라이언트에 공개 anon 키를 노출하므로, 그 키로
  `rooms`/`captures` 를 실제로 읽을 수 있음을 확인했습니다. 따라서 API 도구는 mock 이 아닌
  **실제 REST 읽기**로 구현했습니다. (쓰기/삭제는 하지 않음 — 읽기 전용 플로우)
- **데모 산출물**: 쇼케이스는 `web/config.js` 의 `demoType` 으로 분기합니다 — Playwright/
  Selenium 은 `video`(webm), API 는 `json`(FlowResult), Appium 은 `pending`. 파일이 없으면
  플레이스홀더를 보여줍니다.
- **Appium 미실행**: 안드로이드 에뮬레이터가 필요해 이번 산출물은 동일 계약 골격까지.
  PC 에서 `appium/README.md` 절차로 실행·녹화 후 `web/assets/appium.webm` 을 추가하고
  `config.js` 의 appium 항목만 `pending → video` 로 바꾸면 됩니다.

## 검증 상태 (이 저장소에서 실제로 실행한 결과)

| 도구 | 실행 환경 | 결과 | 데모 산출물 |
|------|-----------|------|-------------|
| Playwright | Codespaces 헤드리스 크롬 | 8/8 스텝 pass | `web/assets/playwright.webm` |
| Selenium | Codespaces Xvfb + ffmpeg | 8/8 스텝 pass | `web/assets/selenium.webm` |
| API | Postman × Newman · 10 VU 동시부하 (라이브) | 1000건 · Apdex 0.99 · p95 144ms · **PASS** (ISO/IEC 25010·Apdex 근거) | `web/assets/api-perf.json` |
| Appium | Appium 서버·드라이버·wdio 설정 (코드스페이스) | 툴체인 OK · 실기기 실행은 PC | `pending` |
