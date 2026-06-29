# API — QASS 백엔드(Supabase REST)

UI 도구(Playwright/Selenium/Appium)가 브라우저로 하는 일을, 여기선 **백엔드를 직접**
다룹니다. 두 가지를 합니다:

1. **기능 읽기 플로우** — `rooms`/`captures` 를 REST 로 읽고 검색(순수 함수)까지. 다른 도구와
   같은 `FlowResult` 계약으로 출력. (`run.js`)
2. **성능·부하 검증** — **Postman 컬렉션**을 **Newman** 으로 **가상 사용자(VU) 동시 부하**로
   호출해(기본 10 VU × 50회 = **요청 1000건, 동시성 10**) 지연 분포(p50/p95/p99)·성공률·
   처리량을 측정하고, **운영 기준(SLO) 대비 PASS/FAIL** 을 판정합니다. (`loadtest.js`)

> **무엇을·왜·어떻게·결과가 바로 보이게**:
> - **무엇을**: QASS 백엔드 읽기 API(rooms·captures)의 응답속도·가용성
> - **왜**: 동시 사용자 부하에서 운영 기준(SLO)을 만족하는지 — "호출 되나"가 아니라 "기준 안에서 빠르고 안정적인가"
> - **어떻게**: 가상 사용자 N명이 동시에 반복 호출 → 지연·성공률 측정 → SLO 대비 판정
> - **결과**: 종합 **PASS/FAIL** + 항목별(가용성·p95·p99·치명오류) 통과/실패
>
### 합격 기준은 공인 표준에 근거 (임의값 아님)

판정 기준(`qass-perf.js` 의 `SLO`)은 임의로 정한 숫자가 아니라 아래 표준에 근거합니다:

| 측정 지표 | 기준 | 근거 표준 |
|-----------|------|-----------|
| Apdex(체감 성능) | ≥ 0.94 (Excellent) | **Apdex** 산업 표준 (목표 T=200ms) |
| 가용성(성공률) | ≥ 99.9% | **SLA three nines** · **ISO/IEC 25010** 신뢰성·가용성 |
| p95 / p99 응답시간 | ≤ 300 / 800ms | **ISO/IEC 25010** 성능효율성·시간반응성 (측정 **25023**) |
| 치명 오류 | 0 | **ISO/IEC 25010** 신뢰성·성숙성 |

- **ISO/IEC 25010**: 소프트웨어 제품 품질 모델(성능효율성·신뢰성 등 품질 특성).
- **ISO/IEC 25023**: 그 특성의 정량 측정 방법(응답시간·처리량).
- **Apdex**: 목표 응답시간 T 기준 사용자 체감 성능 점수(0~1). 만족(≤T)+허용(≤4T)/2.
- **SLA 99.9%**: 가용성 three nines — 업계 통용 등급.

> 표준을 **참조**해 평가하는 것이며 ISO **인증**과는 다릅니다(인증은 심사기관 영역).
> 이 구성은 동시성 기반 **베이스라인** 검증으로, 본격 스트레스/소크는 VU·지속시간을 키워 확장합니다.
> (Postman/Newman·k6·JMeter 부하 테스트와 같은 목적.)

플로우/결과 형태는 [`../FLOW_CONTRACT.md`](../FLOW_CONTRACT.md) §2·§3 이 단일 진실 공급원입니다.

## 실행 (Codespaces / 로컬 · Node 18+)

```bash
npm install            # Newman(devDep) 설치 — 기능 플로우 자체는 표준 fetch 라 무의존

# 1) 기능 읽기 플로우 (FlowResult)
npm start              # rooms→captures→search, FlowResult 출력/저장
npm start naver        # 검색어 변경 (기본값: google)

# 2) 성능·부하 검증 (Postman 컬렉션 × Newman, 가상 사용자 동시 부하 + SLO 판정)
npm run loadtest       # 10 VU × 50회 = 요청 1000건 → web/assets/api-perf.json + PASS/FAIL
node loadtest.js 20 50 # 가상 사용자 수 / VU당 반복 횟수 지정 (예: 20×50 = 2000건)
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
| `loadtest.js` | Newman VU 동시 실행 → 지연/성공률/처리량 측정 → SLO 판정 → `api-perf.json` |
| `qass-perf.js` | 순수 함수 `summarize`(백분위) + `evaluate`(SLO 대비 PASS/FAIL) + `SLO` 기준 |
| `*.test.js` | `searchCaptures`·`summarize` 단위 테스트 |

## 읽기 전용 · 실제 백엔드

QASS 클라이언트(`main.js`)가 공개 **anon 키**를 노출하므로 mock 없이 **실제 REST** 를
읽습니다. 부하 테스트도 **GET 만**, 자기 소유 백엔드 대상으로 적당한 볼륨으로만 겁니다.
**쓰기/삭제는 하지 않습니다.**
