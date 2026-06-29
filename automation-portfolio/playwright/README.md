# Playwright — QASS 레퍼런스 구현

QASS 핵심 플로우(`로그인 → 방 입장 → 증적 확인 → 검색`)를 **데스크톱 크롬 · 헤드리스**로
자동화하고 **video 로 녹화**합니다. 4종 자동화의 레퍼런스입니다.

플로우/결과 형태는 [`../FLOW_CONTRACT.md`](../FLOW_CONTRACT.md) 가 단일 진실 공급원입니다.

## 실행 (GitHub Codespaces / 로컬)

```bash
npm install
npx playwright install chromium      # 브라우저 바이너리
# Codespaces 등에서 OS 의존성이 빠졌다면:
npx playwright install-deps chromium

npm test                 # 헤드리스 실행 + video 녹화
npm run report           # HTML 리포트 열기
```

## 산출물 (`artifacts/`)

- `*.webm` — 실행 과정 video 녹화 (쇼케이스 `web/` 가 가리키는 데모 영상)
- `qass-core-evidence-flow.result.json` — 결과 계약(FlowResult) JSON
- 실패 시 스크린샷·trace

녹화 영상을 쇼케이스에 연결하려면:
```bash
cp artifacts/**/video.webm ../web/assets/playwright.webm   # 경로는 실제 산출물에 맞춰 조정
```

## 구조

| 파일 | 역할 |
|------|------|
| `qass-flow.js` | 플로우 구현. `runFlow(page, opts) -> FlowResult` (모듈 경계 고정) |
| `tests/qass.spec.js` | 테스트 러너. 계약 검증 + 결과 저장 |
| `playwright.config.js` | 헤드리스·video·뷰포트 설정 |

## 핵심 플로우 결정 근거 (라이브 DOM inspect)

실제 `app.html` / `main.js` 를 직접 확인해 선택자를 고정했습니다.

- 로그인: `#login-name`, `#btn-login`
- 방 카드: `.room-card` (이름은 `.room-card-name`), 입장 버튼 `.room-enter-btn`
- 입장 모달: `#enter-room-modal` · `#enter-room-password` · `#enter-uploader-name` · `#btn-enter-room-submit`
- 방 내부: `#room-screen` · `#count-label`(로딩 표시) · `#search`(URL/제목 필터)
- 테스트 방/비밀번호: `QASS 테스트 방` / `qass1234` (main.js 의 TEST_ROOM_* 상수와 동일)
