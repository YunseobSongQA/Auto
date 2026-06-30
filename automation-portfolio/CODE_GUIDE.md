# 📖 코드 가이드 — 이 파일 하나만 보면 됩니다

> **GitHub에서 코드 내용을 확인하려는 분께:**
> 폴더를 다 열어볼 필요 없이 **이 파일(`CODE_GUIDE.md`) 하나**만 보세요.
> 전체 흐름 → 파일 지도 → **주요 함수 10가지**(코드 포함) → 도구별 차이 순서로 정리했습니다.
> 각 함수에는 원본 파일 링크가 달려 있어, 더 보고 싶을 때만 눌러서 들어가면 됩니다.

이 저장소는 **하나의 대상([QASS](https://qass1.pages.dev/))을 4가지 도구로 자동화**한 QA 포트폴리오입니다.
4개 도구(Playwright · Selenium · API · Appium)가 **같은 사용자 플로우**를 각자 방식으로 실행하고,
**같은 결과 형태(`FlowResult`)**를 출력합니다. → 도구만 다르고 결과는 그대로 비교됩니다.

---

## 1. 한눈에 보는 전체 흐름

```
                 ┌──────────────────────────────────────────────┐
                 │  FLOW_CONTRACT.md  (단일 진실 공급원 / 계약)   │
                 │  · 공통 8스텝 시나리오                          │
                 │  · 결과 형태 FlowResult { tool, status, steps }│
                 └──────────────────────────────────────────────┘
                        │  같은 계약을 4개 도구가 각자 구현
   ┌───────────────┬────┴───────────┬────────────────┬────────────────┐
   ▼               ▼                ▼                ▼
 Playwright      Selenium          API              Appium
 (데스크톱 웹)    (데스크톱 웹)      (백엔드 REST)      (모바일 웹) ※PC 실행
 video 녹화       Xvfb+ffmpeg 녹화   부하·성능 측정     WebdriverIO 러너
   │               │                │                │
   └───────────────┴────────┬───────┴────────────────┘
                            ▼
                  같은 모양의 FlowResult JSON 출력
                            │
                            ▼
              web/  (Vanilla JS 쇼케이스, Cloudflare Pages)
              config.js(데이터) → main.js(렌더) → index.html(틀)
```

**도구 순서**는 Playwright → Selenium → API → **Appium**(맨 뒤)입니다.
Appium 만 실기기(안드로이드)가 필요해 실행이 PC에 의존하므로 의도적으로 마지막에 둡니다.

### 공통 시나리오 (8스텝)
`로그인 → 방 입장 → 증적(캡처) 확인 → 검색` — QASS의 가장 대표적인 사용자 여정입니다.

| # | 스텝 | 하는 일 |
|---|------|---------|
| 1 | `open_landing` | 랜딩(`/`) 진입 |
| 2 | `go_app` | 앱 화면(`/app.html`) 이동 |
| 3 | `login` | 이름 입력 후 로그인 |
| 4 | `rooms_loaded` | 방 목록 로딩 대기 |
| 5 | `open_test_room` | "QASS 테스트 방" 입장 클릭 |
| 6 | `enter_room` | 비밀번호 입력 후 입장 |
| 7 | `captures_loaded` | 캡처 그리드 로딩 대기 |
| 8 | `search` | `google` 로 검색 필터 |

> API 도구는 UI가 없으므로 같은 데이터를 REST로 4스텝(`list_rooms → find_test_room → list_captures → search`)으로 읽습니다.

---

## 2. 파일 지도 — 어디에 뭐가 있나

| 보고 싶은 것 | 파일 | 한 줄 설명 |
|--------------|------|-----------|
| **공통 계약(약속)** | [`FLOW_CONTRACT.md`](./FLOW_CONTRACT.md) | 8스텝 시나리오 + 결과 형태 정의 (모든 도구의 기준) |
| **Playwright (레퍼런스)** | [`playwright/qass-flow.js`](./playwright/qass-flow.js) | 핵심 플로우 구현 — 다른 도구가 따라가는 원본 |
| **Selenium** | [`selenium/qass-flow.js`](./selenium/qass-flow.js) | 같은 8스텝을 WebDriver로 |
| **API 플로우** | [`api/qass-api.js`](./api/qass-api.js) | REST 읽기 + 순수 검색 함수 |
| **API 성능 통계** | [`api/qass-perf.js`](./api/qass-perf.js) | p50/p95/p99·Apdex·SLO 판정 (순수 함수) |
| **API 부하 실행** | [`api/loadtest.js`](./api/loadtest.js) | 가상 사용자 동시 호출 → 수치/그래프 산출 |
| **Appium (맨 뒤)** | [`appium/qass-flow.js`](./appium/qass-flow.js) | 같은 8스텝을 모바일 크롬으로 (실행은 PC) |
| **쇼케이스 데이터** | [`web/config.js`](./web/config.js) | 카드 4개 메타(도구명/설명/링크) — 여기만 고치면 화면 바뀜 |
| **쇼케이스 렌더** | [`web/main.js`](./web/main.js) | config → 화면. 영상/그래프/대기 3가지로 분기 |

> **설계 원칙(관심사 분리):** UI(`index.html`/`styles.css`) · 로직(`main.js`) · 데이터(`config.js`)를
> 한 파일에 섞지 않습니다. 자주 바뀌는 것과 거의 안 바뀌는 것을 분리해 유지보수가 쉽습니다.

---

## 3. 주요 함수 10가지 (공부용 · 코드 포함)

> 자동화 4종에서 **꼭 알아야 할 핵심 함수 10개**를 골랐습니다.
> 각 함수: ① 어디에 있는지 ② 무슨 역할인지 ③ 왜 그렇게 짰는지 순서로 정리했습니다.

### ① `runFlow(page, opts)` — 핵심 플로우 실행기 (레퍼런스)
📍 [`playwright/qass-flow.js`](./playwright/qass-flow.js)

8스텝을 순서대로 실행하고, 도구 공통 출력인 `FlowResult` 하나로 모아 반환합니다.
**나머지 3개 도구는 이 구조를 그대로 복제**합니다 — 같은 스텝 id, 같은 반환 형태.

```js
export async function runFlow(page, opts = {}) {
  const steps = [];
  const startedAt = new Date();

  await step('open_landing', async () => { /* / 로 이동, h1 확인 */ });
  await step('login',        async () => { /* 이름 입력 → 로그인 */ });
  // ... 총 8스텝 ...

  const status = steps.some(s => s.status === 'fail') ? 'fail' : 'pass';
  return { tool: 'playwright', flowId: FLOW_ID, target: TARGET,
           startedAt: startedAt.toISOString(), status, steps };
}
```

### ② `step(id, fn)` — 스텝 래퍼 (4개 도구 공통 패턴)
📍 모든 `qass-flow.js` 안에 동일하게 존재

각 스텝의 **소요시간(ms) 측정 + 통과/실패 기록 + 실패 격리**를 한 곳에서 처리합니다.
던지지(throw) 않고 결과만 수집하므로, 한 스텝이 실패해도 전체가 멈추지 않고
**이후 스텝은 자동으로 `skip`** 처리됩니다. → 리포트에 "어디서 깨졌는지"가 그대로 남습니다.

```js
async function step(id, fn) {
  if (steps.some(s => s.status === 'fail')) {              // 앞이 실패했으면
    steps.push({ id, status: 'skip', ms: 0, note: 'previous step failed' });
    return;                                                // 이후는 skip
  }
  const t0 = Date.now();
  try {
    const note = (await fn()) || '';
    steps.push({ id, status: 'pass', ms: Date.now() - t0, note });
  } catch (err) {
    steps.push({ id, status: 'fail', ms: Date.now() - t0, note: String(err.message || err) });
  }
}
```

> 💡 **왜 4번 복붙했나?** Playwright/Selenium/Appium/API 는 각각 독립 npm 프로젝트라
> 코드를 공유할 수 없습니다. "세 번째에 추출" 원칙보다 **런타임 경계**가 우선이라 의도적으로 복제했습니다.

### ③ `searchCaptures(captures, term)` — 순수 함수 (검색 로직 격리)
📍 [`api/qass-api.js`](./api/qass-api.js)

UI의 `#search` 동작과 **똑같은 규칙**을 DOM·네트워크 없이 입출력만으로 구현했습니다.
순수 함수라 단위 테스트가 쉽고([`qass-api.test.js`](./api/qass-api.test.js)), 화면을 갈아엎어도 이 함수는 안 건드립니다.

```js
export function searchCaptures(captures, term) {
  const q = (term || '').trim().toLowerCase();
  if (!q) return captures.slice();                         // 빈 검색어 → 전체(사본)
  return captures.filter(c =>
    `${c.url || ''} ${c.title || ''}`.toLowerCase().includes(q));
}
```

### ④ `restGet(pathAndQuery)` — 네트워크 계층
📍 [`api/qass-api.js`](./api/qass-api.js)

Supabase REST 호출을 한 곳에 모았습니다. 인증 헤더를 붙이고, 200이 아니면 에러를 던집니다.
"방 목록 읽기"·"캡처 읽기"는 이 함수를 재사용합니다 → 호출 방식이 한 군데로 통일됩니다.

```js
async function restGet(pathAndQuery) {
  const res = await fetch(`${REST}/${pathAndQuery}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${pathAndQuery}`);
  return res.json();
}
```

### ⑤ `summarize(samples)` — 응답속도 통계 (p50/p95/p99)
📍 [`api/qass-perf.js`](./api/qass-perf.js)

지연시간(ms) 배열을 받아 **백분위 통계**를 냅니다. p95 = "100번 중 95번이 이 시간 안에 응답".
평균만 보면 느린 꼬리(tail)가 숨으므로, 현업에선 p95/p99 를 함께 봅니다.

```js
export function summarize(samples) {
  const s = samples.filter(Number.isFinite).sort((a, b) => a - b);
  const at = q => s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)]; // nearest-rank
  return { count: s.length, min: s[0], max: s[s.length - 1],
           p50: at(0.5), p90: at(0.9), p95: at(0.95), p99: at(0.99) };
}
```

### ⑥ `apdex(samples, t)` — 체감 성능 점수 (산업 표준)
📍 [`api/qass-perf.js`](./api/qass-perf.js)

Apdex = 사용자가 **체감하는** 빠름을 0~1로 나타내는 국제 표준 지표입니다.
목표시간 T 이하는 "만족", 4T 이하는 "허용(0.5점)", 그 위는 "불만". → 단순 평균보다 직관적입니다.

```js
export function apdex(samples, t) {
  let sat = 0, tol = 0;
  for (const v of samples) { if (v <= t) sat++; else if (v <= 4 * t) tol++; }
  const score = (sat + tol / 2) / samples.length;          // 0~1
  return { score, rating: apdexRating(score) };            // 0.94↑ = Excellent
}
```

### ⑦ `evaluate(summary, slo)` — SLO 대비 PASS/FAIL 판정
📍 [`api/qass-perf.js`](./api/qass-perf.js)

측정값을 **합격 기준(SLO)**과 비교해 항목별 통과/실패 + 종합 판정을 냅니다.
기준은 임의값이 아니라 **공인 표준**(ISO/IEC 25010·Apdex·SLA 99.9%)에 근거합니다.
"호출 되나?"가 아니라 **"기준 안에서 빠르고 안정적인가?"**를 판정하는 게 핵심입니다.

```js
export function evaluate(summary, slo = SLO) {
  const checks = [
    { name: '체감 성능 점수', actual: summary.apdex.score, op: '≥', threshold: slo.apdexMin,
      pass: summary.apdex.score >= slo.apdexMin },
    { name: '성공률',        actual: summary.okRate, op: '≥', threshold: slo.okRateMin,
      pass: summary.okRate >= slo.okRateMin },
    { name: '응답속도 p95',  actual: summary.latencyMs.p95, op: '≤', threshold: slo.p95MaxMs,
      pass: summary.latencyMs.p95 <= slo.p95MaxMs },
    // ... p99, 오류 수 ...
  ];
  return { verdict: checks.every(c => c.pass) ? 'PASS' : 'FAIL', checks };
}
```

### ⑧ `runVU(iterationCount)` — 가상 사용자 1명 (동시 부하 단위)
📍 [`api/loadtest.js`](./api/loadtest.js)

Postman 컬렉션을 Newman으로 반복 실행하는 "가상 사용자 1명"입니다.
이걸 `Promise.all` 로 N명 **동시 실행**하면 N 동시성 부하가 됩니다 (기본 10명 × 50회 = 1000건).

```js
function runVU(iterationCount) {                            // 가상 사용자 1명
  return new Promise((resolve, reject) => {
    newman.run({ collection: COLLECTION, iterationCount, reporters: [], bail: false },
      (err, summary) => (err ? reject(err) : resolve(summary)));
  });
}
// 10명을 동시에 → 동시성 부하
const runs = await Promise.all(Array.from({ length: vus }, () => runVU(iterationsPerVu)));
```

### ⑨ `buildCard(card, shared)` — 쇼케이스 카드 렌더 (순수 변환)
📍 [`web/main.js`](./web/main.js)

`config.js`의 카드 데이터 하나를 받아 **HTML 문자열로만** 변환합니다(DOM 조작 없음).
순수 변환과 부수효과(`render`)를 나눠, 데이터만 바꾸면 화면이 바뀌도록 했습니다.

```js
function buildCard(card, shared) {
  const points = card.points.map(p => `<li>${esc(p)}</li>`).join('');
  return `<article class="card" data-tool="${esc(card.id)}">
            <h2>${esc(card.title)}</h2>
            <p class="desc">${esc(card.desc)}</p>
            <a class="repo" href="${esc(card.repo)}">GitHub에서 코드 보기 ↗</a>
          </article>`;
}
```

### ⑩ `renderPerf(el, src)` — 부하 결과를 수치·그래프로
📍 [`web/main.js`](./web/main.js)

API 부하 결과(`api-perf.json`)를 읽어 **PASS/FAIL 판정 + 핵심 수치 타일 + 응답속도 막대그래프**로
그립니다 (영상이 아니라 데이터 시각화). "API로 뭘 했는지"가 화면에서 바로 보이게 하는 함수입니다.

```js
function renderPerf(el, src) {
  fetch(src).then(r => r.json()).then(d => {
    const pass = d.verdict === 'PASS';
    // 1) PASS/FAIL 배지  2) 총요청·체감성능·성공률·p95 타일
    // 3) 합격 기준별 통과/실패  4) p50/p95/p99 막대그래프(낮을수록 빠름)
    el.innerHTML = `<div class="perf">${/* 배지 + 타일 + 기준 + 막대 */''}</div>`;
  });
}
```

---

## 4. 도구별 차이 (같은 일을 어떻게 다르게 짜나)

같은 8스텝인데 도구마다 **대기·입력 방식**이 다릅니다. 면접/리뷰에서 자주 묻는 포인트입니다.

| 항목 | Playwright | Selenium | Appium | API |
|------|-----------|----------|--------|-----|
| 대기 | auto-wait (자동) | `driver.wait(until…)` 명시 | `waitForDisplayed` 명시 | 네트워크 응답 대기 |
| 입력 | `fill()` (기존값 비우고 입력) | `clear()` 후 `sendKeys()` 필요 | `setValue()` | 입력 없음(REST) |
| 실행 | 헤드리스 크롬 | Xvfb + ffmpeg 녹화 | 모바일 크롬(실기기, PC) | 브라우저 불필요 |
| 산출 | `video.webm` | `selenium.webm` | `pending`(PC 녹화 예정) | `api-perf.json`(수치·그래프) |

> 💡 **Selenium 함정 사례:** QASS는 테스트 방 비밀번호를 미리 채워두는데, Selenium `sendKeys()`는
> 기존 값에 **덧붙이기** 때문에 `clear()` 없이는 인증이 깨집니다. → [`selenium/qass-flow.js`](./selenium/qass-flow.js) `enter_room` 스텝 주석 참고.

---

## 5. 직접 돌려보기 (요약)

```bash
# 레퍼런스
cd playwright && npm i && npx playwright install chromium && npm test
# API 부하·성능 (브라우저 불필요) → web/assets/api-perf.json
cd api && npm i && npm run loadtest
# Selenium (헤드리스, 또는 ./record.sh 로 녹화)
cd selenium && npm i && npm test
# 쇼케이스 웹
cd web && python3 -m http.server 8080
# Appium (맨 뒤 · 안드로이드 기기 필요 · PC에서)
cd appium && npm i && npm run setup && npm test
```

자세한 실행법은 [`README.md`](./README.md), 계약은 [`FLOW_CONTRACT.md`](./FLOW_CONTRACT.md) 를 보세요.
