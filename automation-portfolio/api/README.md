# API — QASS 백엔드(Supabase REST)

UI 도구(Playwright/Selenium/Appium)가 브라우저로 하는 일을, 여기선 **백엔드를 직접**
다룹니다. 두 가지를 합니다:

1. **기능 읽기 플로우** — `rooms`/`captures` 를 REST 로 읽고 검색(순수 함수)까지. 다른 도구와
   같은 `FlowResult` 계약으로 출력. (`run.js`)
2. **성능·부하 테스트** — **Postman 컬렉션**을 **Newman(CLI)** 으로 반복 호출해 읽기 경로의
   **지연 분포(p50/p95/p99)·성공률·처리량**을 측정. 쇼케이스가 수치+그래프로 보여줍니다. (`loadtest.js`)

> **목표가 바로 보이게**: "API 로 뭘 했나?" = QASS 백엔드 읽기 경로의 응답 속도·안정성을
> 부하를 걸어 검증하고, 결과를 수치와 그래프로 냅니다. (Postman/Newman·k6 와 같은 목적)

플로우/결과 형태는 [`../FLOW_CONTRACT.md`](../FLOW_CONTRACT.md) §2·§3 이 단일 진실 공급원입니다.

## 실행 (Codespaces / 로컬 · Node 18+)

```bash
npm install            # Newman(devDep) 설치 — 기능 플로우 자체는 표준 fetch 라 무의존

# 1) 기능 읽기 플로우 (FlowResult)
npm start              # rooms→captures→search, FlowResult 출력/저장
npm start naver        # 검색어 변경 (기본값: google)

# 2) 성능·부하 테스트 (Postman 컬렉션 × Newman)
npm run loadtest       # 40회 반복(=요청 80건) → web/assets/api-perf.json + 콘솔 수치
node loadtest.js 100   # 반복 횟수 지정
npm run postman        # Newman 으로 컬렉션 1회만 실행(검증용)

# 3) 단위 테스트 (네트워크 불필요)
npm test               # searchCaptures + summarize 순수 함수 테스트
```

Postman GUI 를 쓴다면 `postman/qass.postman_collection.json` 을 import 하면 같은 요청을
바로 보냅니다. (GUI 의 Collection Runner / 부하 테스트와 동일, CLI 버전이 Newman)

## 산출물

- `web/assets/api-perf.json` — 부하 테스트 결과(지연 분포·성공률·처리량·엔드포인트별 시계열)
- `artifacts/qass-core-evidence-flow.result.json` — 기능 플로우 FlowResult

## 구조

| 파일 | 역할 |
|------|------|
| `qass-api.js` | REST 읽기 + 순수 함수 `searchCaptures` + `runFlow(opts) -> FlowResult` |
| `run.js` | 기능 플로우 러너 |
| `postman/qass.postman_collection.json` | Postman 컬렉션(요청 체이닝 + 테스트 스크립트) |
| `loadtest.js` | Newman 으로 컬렉션 반복 실행 → 지연/성공률/처리량 측정 → `api-perf.json` |
| `qass-perf.js` | 순수 통계 함수 `summarize(samples)` (백분위) — Newman/네트워크 무관 |
| `*.test.js` | `searchCaptures`·`summarize` 단위 테스트 |

## 읽기 전용 · 실제 백엔드

QASS 클라이언트(`main.js`)가 공개 **anon 키**를 노출하므로 mock 없이 **실제 REST** 를
읽습니다. 부하 테스트도 **GET 만**, 자기 소유 백엔드 대상으로 적당한 볼륨으로만 겁니다.
**쓰기/삭제는 하지 않습니다.**
