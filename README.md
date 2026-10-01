# QA Automation

[![showcase](https://github.com/YunseobSongQA/Auto/actions/workflows/showcase.yml/badge.svg)](https://github.com/YunseobSongQA/Auto/actions/workflows/showcase.yml)

**품질 관리 중 생기는 문제를 바로 도구로 만듭니다.**
QA를 하며 마주치는 반복 업무를 도구로 만들어 자동화하고, 실무에 활용합니다.

- 소개 사이트: **https://auto-x2o.pages.dev/**
- 송윤섭 · QA Engineer (컴즈) — 前 LG CNS 배포 담당 QA · 現 KB국민은행 여신 파트 QA

## 도구

| 도구 | 하는 일 | 실무 적용 시간 | 바로 가기 |
|---|---|---|---|
| QASS | 테스트 증적을 자동으로 모아 팀과 공유 | 60분 → 5분 (92% 감소) | [서비스](https://qass1.pages.dev/) |
| PRD2TC | 기획서(pptx)로 테스트케이스 초안(xlsx) 만들기 | 60분 → 5분 (92% 감소) | [도구](https://qaprd2tc.pages.dev/) |
| Playwright | 같은 8단계 검사를 PC 크롬에서 자동 실행 (JavaScript) | 60분 → 5분 (92% 감소) | [코드](automation-portfolio/playwright) |
| Selenium | 같은 검사를 Selenium으로 — Playwright와 비교 (Python) | 60분 → 5분 (92% 감소) | [코드](automation-portfolio/selenium) |
| Appium | 같은 검사를 안드로이드 크롬에서 (Python) | 60분 → 5분 (92% 감소) | [코드](automation-portfolio/appium) |
| API | 서버 속도·부하 측정 — 요청 1,000번 (Postman · Newman) | — | [코드](automation-portfolio/api) |

## 폴더

```
automation-portfolio/
  web/              소개 사이트 (HTML · CSS · JavaScript · Cloudflare Pages)
  showcase-tests/   소개 사이트 자동 테스트 (Playwright · GitHub Actions)
  playwright/  selenium/  appium/  api/   같은 검사를 네 도구로 자동화한 코드
```

## 실행

```bash
# 소개 사이트 보기 → http://127.0.0.1:4173 (배포처와 같은 방식으로 영상을 보내 주는 테스트 서버)
node automation-portfolio/showcase-tests/serve.mjs

# 소개 사이트 테스트 (크롬 · 사파리 · 아이폰 화면)
cd automation-portfolio/showcase-tests && npm ci && npx playwright install chromium webkit && npm test
```

자세한 설명은 [automation-portfolio/README.md](automation-portfolio/README.md)에 있습니다.
