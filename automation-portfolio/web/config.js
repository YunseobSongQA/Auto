/**
 * config.js — 데이터 계층 (거의 안 바뀜)
 * UI(index.html/styles.css)·로직(main.js)과 분리된 "데이터 주입" 한 곳.
 * 카드/규칙/문구를 여기서만 바꾸면 코드는 안 건드려도 됩니다. (구축기 3번)
 *
 * 계약: 각 카드는 아래 형태를 지킵니다 (구축기 5번).
 *   { id, tool, title, desc, target, repo, demo, demoType, demoLabel, badge, status, points[] }
 *   - demoType: 'video' | 'perf' | 'pending'  ← main.js 가 이 값으로 렌더를 분기 (딱 3분기)
 *   - demo:     산출물 경로(상대). 'pending' 이면 null.
 *   - demoLabel: 데모 영역 캡션("영상 아님" 같은 설명).
 *   - status:   'verified'(검증완료) | 'pending'(PC에서 실행예정)
 */
window.QASS_PORTFOLIO = {
  // 모든 카드가 공유하는 타깃 — "같은 QASS · 다른 도구" 라벨의 근거
  sharedTarget: {
    name: 'QASS',
    url: 'https://qass1.pages.dev/',
    label: '자동화는 목적이 아니라, 품질을 올리는 수단',
  },

  // 공통 플로우 한 줄 요약 (FLOW_CONTRACT.md §1 과 동일 · "증적"은 쉬운 말 "캡처"로 표기)
  sharedFlow: '로그인 → 방 입장 → 캡처 확인 → 검색',

  cards: [
    // (C) 카드 목록 맨 앞 — 기존 도구 카드와 동일한 구조. QA 흐름의 앞단(설계) 도구.
    {
      id: 'prd2tc',
      tool: 'PRD2TC',
      title: '기획서(PRD) → 테스트케이스 자동 생성',
      desc: '기획서(PRD)를 넣으면 테스트케이스를 자동으로 뽑아 주는 도구입니다. 아래 자동화 도구들보다 앞단인 QA 설계 단계를 담당합니다.',
      target: 'PRD 문서',
      repo: 'https://qaprd2tc.pages.dev/',
      repoLabel: '도구 열기 ↗',
      demo: 'assets/prd2tc.webm',
      demoType: 'video',
      demoLabel: '실제 도구 동작 · PRD 입력 → 테스트케이스 자동 생성',
      badge: 'PRD → TC',
      status: 'verified',
      points: ['기획서 입력', '테스트케이스 자동 생성', 'QA 설계 단계'],
    },
    {
      id: 'playwright',
      tool: 'Playwright',
      title: 'QASS 웹 · 데스크톱 크롬',
      desc: '로그인부터 검색까지, 사람이 하던 검사를 크롬 브라우저가 스스로 실행합니다(화면 없이 도는 \'헤드리스\' 방식). 실행 과정은 아래 영상으로 녹화해 두었고, 자동화 4종 중 기준이 되는 구현입니다.',
      target: 'QASS 웹',
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/playwright',
      demo: 'assets/playwright.webm',
      demoType: 'video',
      demoLabel: '',
      badge: '레퍼런스',
      status: 'verified',
      points: ['헤드리스 실행', 'video 녹화', '결과 계약 출력'],
    },
    {
      id: 'selenium',
      tool: 'Selenium',
      title: 'QASS 웹 · 동일 플로우 비교',
      desc: '위 Playwright와 똑같은 검사를, 업계에서 가장 오래 쓰여 온 도구인 Selenium으로 한 번 더 만들었습니다. 같은 일을 두 도구로 짜 보면 무엇이 다른지 그대로 비교됩니다.',
      target: 'QASS 웹',
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/selenium',
      demo: 'assets/selenium.webm',
      demoType: 'video',
      demoLabel: '',
      badge: 'Playwright 비교',
      status: 'verified',
      points: ['동일 플로우 계약', 'WebDriver 표준', 'Xvfb+ffmpeg 녹화'],
    },
    {
      id: 'api',
      tool: 'API',
      title: 'QASS 서버 · 성능·부하 테스트',
      desc: '화면 뒤에서 데이터를 보내 주는 서버가, 사용자가 한꺼번에 몰려도 빠르고 안정적인지 시험합니다. 요청을 자동으로 1,000번 보내 응답 속도를 재고, 국제 표준 기준으로 통과/실패를 판정합니다.',
      target: 'QASS 백엔드',
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/api',
      demo: 'assets/api-perf.json',
      demoType: 'perf',
      demoLabel: '성능·부하 테스트 결과 · 영상 아님',
      badge: 'Postman · 부하',
      status: 'verified',
      points: ['Postman·Newman', 'p50/p95/p99 지연', '성공률·처리량'],
    },
    // Appium 은 실기기(안드로이드)가 필요해 실행이 PC 의존 → 카드 순서를 맨 뒤로 둡니다.
    {
      id: 'appium',
      tool: 'Appium',
      title: 'QASS 모바일 · 안드로이드 크롬',
      desc: '같은 검사를 이번에는 스마트폰(안드로이드의 크롬)에서 실행합니다. Python(pytest)으로 구현했고, 실제 기기가 있어야 돌릴 수 있어서 실행 영상은 PC에서 준비 중입니다.',
      target: 'QASS 모바일',
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/appium',
      demo: null,
      demoType: 'mockup',
      demoLabel: '예시 프리뷰 · 실제 시연 준비 중',
      badge: '모바일',
      status: 'pending',
      points: ['pytest 표준 러너', 'UiAutomator2', 'PC에서 실행'],
    },
  ],
};
