# Automation Portfolio — QA 도구 5종 (설계 1 + 자동화 4)

**QA 설계부터 자동화 실행까지 5가지 도구**로 구성한 포트폴리오입니다.
앞단에는 기획서(PRD)에서 테스트케이스를 자동 생성하는 **PRD2TC**(QA 설계 단계)가 있고,
뒷단에는 **하나의 타깃([QASS](https://qass1.pages.dev/))을 4가지 도구로 자동화**한 실행 계층이 있습니다.
같은 사용자 플로우를 Playwright · Selenium · API · Appium 로 각각 구현해
**도구별 접근 방식의 차이**를 비교합니다 (비교표: [`CODE_GUIDE.md`](./CODE_GUIDE.md) §4).

> 핵심 아이디어: **"QA 설계(PRD2TC) → 같은 QASS · 다른 자동화 도구"**.
> 자동화 4종은 모두 [`FLOW_CONTRACT.md`](./FLOW_CONTRACT.md) 의 동일한 플로우/결과 계약을 따릅니다.
> (PRD2TC 는 QASS 를 자동화하는 도구가 아니라 그 앞단의 설계 도구로, 별도로 배포되어 있습니다.)

## 구조

```
automation-portfolio/
  web/          # Vanilla JS 쇼케이스 (Cloudflare Pages 배포 대상 → https://auto-x2o.pages.dev/)
  showcase-tests/  # 쇼케이스 자동 테스트 (Playwright · 크롬·사파리·아이폰 · GitHub Actions)
  # PRD2TC (설계 도구)는 별도 배포 웹앱 → https://qaprd2tc.pages.dev/ (이 저장소에 코드 폴더 없음)
  playwright/   # 레퍼런스 완전 구현 (JS/TS · 헤드리스 + video 녹화)
  selenium/     # 동일 플로우 실제 실행 (Python · Xvfb/ffmpeg 녹화 selenium.webm)
  api/          # Supabase REST 읽기 + Postman/Newman 부하·성능 테스트 (수치·그래프)
  appium/       # 안드로이드 크롬 — Python · pytest (Android Studio 에뮬레이터 Pixel 8 에서 8/8 통과 · 실행은 PC)
  CODE_GUIDE.md     # 한 파일로 보는 코드 가이드 (흐름 + 주요 함수 10가지)
  FLOW_CONTRACT.md  # 단일 진실 공급원: 공통 플로우 + 결과 계약
  README.md
```

> **코드만 빠르게 보려면 → [`CODE_GUIDE.md`](./CODE_GUIDE.md) 한 파일이면 됩니다.**
> 전체 흐름, 어느 파일에 뭐가 있는지, 주요 함수 10가지를 코드와 함께 정리했습니다.

## 도구 매핑

| 도구 | 대상 | 상태 | 비고 |
|------|------|------|------|
| PRD2TC | PRD 문서 (QA 설계 단계) | 배포·운영 | 기획서 → 테스트케이스 자동 생성 · [도구 열기](https://qaprd2tc.pages.dev/) |
| Playwright | QASS 웹 (데스크톱 크롬) | 완전 구현 | JS/TS · 핵심 플로우 + video 녹화 |
| Selenium | QASS 웹 (동일 플로우) | 완전 구현 | Python · 실제 실행 + Xvfb/ffmpeg 녹화 |
| API | QASS 백엔드 (Supabase REST) | 완전 구현 | 읽기 플로우 + Postman/Newman 부하·성능 테스트 |
| Appium | QASS 모바일 크롬 (안드로이드) | 완전 구현 | Python(pytest + Appium-Python-Client) · 에뮬레이터 실행 + 녹화 · 실행은 PC에서 |

## 빠른 실행 (GitHub Codespaces 기준)

```bash
# 1) Playwright 레퍼런스
cd playwright && npm i && npx playwright install chromium && npm test

# 2) API — 읽기 플로우 + Postman/Newman 부하 테스트 (브라우저/드라이버 불필요)
cd api && npm i && npm start              # 기능 읽기 플로우(FlowResult)
#   부하·성능 검증(10 VU×50=1000건, SLO PASS/FAIL) → api-perf.json:  npm run loadtest

# 3) Selenium (Python · 헤드리스 실행, 또는 ./record.sh 로 화면 녹화)
cd selenium && pip install -r requirements.txt && python run.py   # 헤드리스 실행
#   화면 녹화(Xvfb+ffmpeg) → web/assets/selenium.webm:  ./record.sh

# 4) 쇼케이스 웹 (빌드 없이 바로) — 배포처처럼 영상 Range 요청에 답하는 서버라 사파리 재생도 그대로 확인
node showcase-tests/serve.mjs   # http://127.0.0.1:4173
#    쇼케이스 테스트: cd showcase-tests && npm ci && npx playwright install chromium webkit && npm test

# 5) Appium — Python · pytest (실행은 PC, 안드로이드 기기 또는 에뮬레이터 필요)
cd appium && pip install -r requirements.txt && appium driver install uiautomator2 && pytest -s   # 자세히는 appium/README.md
```

## 산출 결과

각 도구는 실행 시 [`FLOW_CONTRACT.md`](./FLOW_CONTRACT.md) §3 의 `FlowResult` JSON 을 출력합니다.
도구가 달라도 출력 형태가 같으므로 결과를 그대로 비교할 수 있습니다.

## 가정 (질문 대신 합리적 가정 — 구축기 7번)

- **API mock 불필요**: QASS 가 클라이언트에 공개 anon 키를 노출하므로, 그 키로
  `rooms`/`captures` 를 실제로 읽을 수 있음을 확인했습니다. 따라서 API 도구는 mock 이 아닌
  **실제 REST 읽기**로 구현했습니다. (쓰기/삭제는 하지 않음 — 읽기 전용 플로우)
- **데모 산출물**: 쇼케이스는 `web/config.js` 의 `demoType` 으로 분기합니다 — QASS·PRD2TC·
  Playwright·Selenium·Appium 은 `video`(mp4 1순위 · webm 폴백), API 는 `perf`(부하 테스트 결과
  `api-perf.json`). 파일이 없으면 플레이스홀더를 보여줍니다.
- **데모 영상 손질**: 슬라이드에 들어가자마자 화면이 보여야 하므로, 녹화 앞부분의 빈 화면·대기
  구간(브라우저가 뜨기 전 검은/흰 화면, 앱 시작 화면 등)은 잘라 냅니다. 같은 구간을 mp4(1순위
  · H.264 · faststart)와 webm 에서 함께 자르고, 첫 프레임을 포스터 `web/assets/<id>-poster.webp`
  로 뽑아 `config.js` 의 `poster` 에 적습니다. 다시 녹화하면 이 손질도 다시 해야 합니다.
  ```bash
  # x-raw.webm = 녹화 원본 (record.sh 등이 만든 파일을 이 이름으로 옮겨 두고 시작)
  ffmpeg -i x-raw.webm -vf "trim=start=<빈 구간 끝(초)>,setpts=PTS-STARTPTS" -an -c:v libx264 -crf 23 \
    -preset slow -pix_fmt yuv420p -profile:v high -movflags +faststart x.mp4
  ffmpeg -i x-raw.webm -vf "trim=start=<같은 값>,setpts=PTS-STARTPTS" -an -c:v libvpx-vp9 -crf 32 -b:v 0 x.webm
  ffmpeg -i x.mp4 -vf "select='eq(n\,0)'" -frames:v 1 -c:v libwebp -quality 80 x-poster.webp
  ```
- **Appium 실행 위치**: 안드로이드 에뮬레이터가 필요해 코드스페이스가 아니라 PC 에서
  `appium/README.md` 절차로 실행·녹화했습니다. 다시 녹화하면 `web/assets/appium.mp4`·`.webm` 과
  포스터만 바꾸면 됩니다.

## 검증 상태 (이 저장소에서 실제로 실행한 결과)

| 도구 | 실행 환경 | 결과 | 데모 산출물 |
|------|-----------|------|-------------|
| PRD2TC | 별도 배포 웹앱 (qaprd2tc.pages.dev) | 라이브 · PRD → TC 자동 생성 | `web/assets/prd2tc.webm` (실제 도구 동작 녹화) |
| Playwright | Codespaces 헤드리스 크롬 | 8/8 스텝 pass | `web/assets/playwright.webm` |
| Selenium | Codespaces Xvfb + ffmpeg (Python) | 8/8 스텝 pass | `web/assets/selenium.webm` |
| API | Postman × Newman · 10 VU 동시부하 (라이브) | 1000건 · Apdex 0.98 · p95 171ms · **PASS** (목표 수치는 직접 정함 · 지표는 ISO/IEC 25010·Apdex) | `web/assets/api-perf.json` |
| Appium | PC(Windows) · Android Studio 에뮬레이터(Pixel 8 / API 34) 크롬 | 8/8 스텝 pass | `web/assets/appium.webm` |

> 표 안에서 Appium 을 맨 뒤에 둔 이유: 실기기(안드로이드)가 필요해 **실행이 PC에 의존**하기 때문입니다.
> 쇼케이스 카드 순서(`web/config.js`)는 QASS(직접 만든 증적 관리 플랫폼 · 자동화의 대상) →
> Appium(모바일 · 실행 검증 완료) → PRD2TC(설계) → Playwright → Selenium → API 입니다.
> QASS 카드의 시연 영상은 [`playwright/qass-demo.mjs`](./playwright/qass-demo.mjs) 로 녹화합니다.
