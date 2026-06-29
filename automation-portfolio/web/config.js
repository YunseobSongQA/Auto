/**
 * config.js — 데이터 계층 (거의 안 바뀜)
 * UI(index.html/styles.css)·로직(main.js)과 분리된 "데이터 주입" 한 곳.
 * 카드/규칙/문구를 여기서만 바꾸면 코드는 안 건드려도 됩니다. (구축기 3번)
 *
 * 계약: 각 카드는 아래 형태를 지킵니다 (구축기 5번).
 *   { id, tool, title, desc, target, repo, demo, badge, status, points[] }
 *   - demo:   데모 영상/GIF 경로(상대). 파일 없으면 main.js 가 플레이스홀더 표시.
 *   - status: 'done' | 'stub'
 */
window.QASS_PORTFOLIO = {
  // 모든 카드가 공유하는 타깃 — "같은 QASS · 다른 도구" 라벨의 근거
  sharedTarget: {
    name: 'QASS',
    url: 'https://qass1.pages.dev/',
    label: '같은 QASS · 다른 도구',
  },

  // 공통 플로우 한 줄 요약 (FLOW_CONTRACT.md §1 과 동일)
  sharedFlow: '로그인 → 방 입장 → 증적 확인 → 검색',

  cards: [
    {
      id: 'playwright',
      tool: 'Playwright',
      title: 'QASS 웹 · 데스크톱 크롬',
      desc: '핵심 사용자 플로우를 헤드리스 크롬으로 자동화하고 실행 과정을 video로 녹화합니다. 4종의 레퍼런스 구현입니다.',
      target: 'QASS 웹',
      repo: '../playwright/',
      demo: 'assets/playwright.webm',
      badge: '레퍼런스',
      status: 'done',
      points: ['헤드리스 실행', 'video 녹화', '결과 계약 출력'],
    },
    {
      id: 'selenium',
      tool: 'Selenium',
      title: 'QASS 웹 · 동일 플로우 비교',
      desc: 'Playwright와 똑같은 플로우 계약을 Selenium WebDriver로 구현해 두 도구의 작성 방식을 비교합니다.',
      target: 'QASS 웹',
      repo: '../selenium/',
      demo: 'assets/selenium.webm',
      badge: 'Playwright 비교',
      status: 'stub',
      points: ['동일 플로우 계약', 'WebDriver 표준', '비교용 골격'],
    },
    {
      id: 'appium',
      tool: 'Appium',
      title: 'QASS 모바일 · 안드로이드 크롬',
      desc: '같은 플로우를 모바일 크롬(안드로이드)에서 실행합니다. 드라이버가 필요해 실행은 PC에서 합니다.',
      target: 'QASS 모바일',
      repo: '../appium/',
      demo: 'assets/appium.webm',
      badge: '모바일',
      status: 'stub',
      points: ['모바일 크롬', 'UiAutomator2', 'PC에서 실행'],
    },
    {
      id: 'api',
      tool: 'API',
      title: 'QASS 백엔드 · Supabase REST',
      desc: 'UI 없이 Supabase REST로 같은 데이터(방·증적)를 읽습니다. 순수 함수로 격리되어 테스트가 쉽습니다.',
      target: 'QASS 백엔드',
      repo: '../api/',
      demo: 'assets/api.webm',
      badge: '읽기 전용',
      status: 'done',
      points: ['REST 직접 호출', '순수 함수 격리', 'mock 불필요'],
    },
  ],
};
