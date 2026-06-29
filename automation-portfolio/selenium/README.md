# Selenium — QASS 동일 플로우 (Playwright 비교)

Playwright 레퍼런스와 **똑같은 8 스텝 플로우·똑같은 FlowResult** 를 Selenium WebDriver 로
구현합니다. 같은 QASS 를 같은 순서로 자동화하되 **도구만 다르게** 해서, 두 도구의
작성 방식(대기·선택자·드라이버)을 한눈에 비교하는 게 목적입니다.

플로우/결과 형태는 [`../FLOW_CONTRACT.md`](../FLOW_CONTRACT.md) 가 단일 진실 공급원입니다.

## 상태: 검증완료

Codespaces 헤드리스 환경에서 라이브 QASS 상대로 **8/8 스텝 통과**를 확인했고, 화면을
`web/assets/selenium.webm` 으로 녹화했습니다(`record.sh`). 구현 중 Playwright 와의 실제
차이로 `sendKeys()` 가 프리필 값에 **덧붙는** 문제를 찾아 `clear()` 로 고쳤습니다
(`qass-flow.js` 주석 참고).

## 실행 (Codespaces / 로컬 · Node 18+ · Chrome 필요)

```bash
npm install            # selenium-webdriver (드라이버는 Selenium Manager 가 자동 해결)
npm test               # 헤드리스 크롬으로 플로우 실행 + FlowResult 출력/저장
npm test naver         # 검색어 변경 (기본값: google)
```

> Chrome 이 없으면 설치하세요. Codespaces 라면 `npx @puppeteer/browsers install chrome@stable`
> 또는 시스템 패키지로 설치할 수 있습니다.

## 구조

| 파일 | 역할 |
|------|------|
| `qass-flow.js` | 플로우 구현. `runFlow(driver, opts) -> FlowResult` (Playwright 와 동일 계약) |
| `run.js` | 러너. 드라이버 생성 + 결과 저장 (`HEADED=1`·`CHROME_BIN` 환경변수 지원) |
| `record.sh` | Xvfb 가상 디스플레이 + ffmpeg x11grab 으로 화면 녹화 → `selenium.webm` |

## Playwright 와 다른 점 (비교 포인트)

| | Playwright | Selenium |
|--|------------|----------|
| 대기 | auto-wait (`waitFor`) | 명시적 `until` 조건 |
| 선택자 | `locator(..., { hasText })` | `By.css` / `By.xpath` |
| 입력 | `fill()` — 비우고 입력 | `sendKeys()` — 덧붙임 → `clear()` 필요 |
| video | 설정 한 줄(`video: 'on'`) | 기본 미제공 → Xvfb+ffmpeg 외부 녹화(`record.sh`) |

> 결과(FlowResult)는 형태가 같으므로 두 도구의 출력을 그대로 나란히 비교할 수 있습니다.
