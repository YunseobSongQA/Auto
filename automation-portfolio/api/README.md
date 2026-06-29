# API — QASS 백엔드(Supabase REST) 읽기 플로우

UI 도구(Playwright/Selenium/Appium)가 브라우저로 하는 일을, 여기선 **같은 데이터**
(`rooms` · `captures`)를 **Supabase REST 로 직접** 읽어 재현합니다. 브라우저·드라이버가
필요 없어 가장 가볍고, 핵심 로직(검색)이 **순수 함수**라 단위 테스트가 됩니다.

플로우/결과 형태는 [`../FLOW_CONTRACT.md`](../FLOW_CONTRACT.md) §2·§3 이 단일 진실 공급원입니다.

## 실행 (Codespaces / 로컬 · Node 18+)

```bash
npm install            # 의존성 없음 — 표준 fetch 사용
npm start              # REST 읽기 플로우 실행 + FlowResult 출력/저장
npm start naver        # 검색어를 바꿔 실행 (기본값: google)

npm test               # 순수 함수(searchCaptures) 단위 테스트 — 네트워크 불필요
```

## 산출물 (`artifacts/`)

- `qass-core-evidence-flow.result.json` — 결과 계약(FlowResult) JSON

## 구조

| 파일 | 역할 |
|------|------|
| `qass-api.js` | REST 읽기 + 순수 함수 `searchCaptures` + `runFlow(opts) -> FlowResult` |
| `run.js` | 러너. FlowResult 출력·저장 |
| `qass-api.test.js` | `searchCaptures` 단위 테스트 (DOM/네트워크 없음) |

## mock 이 아닌 실제 읽기인 이유

QASS 클라이언트(`main.js`)가 공개 **anon 키**를 노출하므로, 그 키로 `rooms`/`captures` 를
실제로 읽을 수 있습니다. 따라서 mock 없이 **실제 REST 읽기**로 구현했습니다.
**읽기 전용** — 쓰기/삭제는 하지 않습니다.
