/**
 * config.js — 데이터 계층 (거의 안 바뀜)
 * UI(index.html/styles.css)·로직(main.js)과 분리된 "데이터 주입" 한 곳.
 * 카드/문구/수치를 여기서만 바꾸면 코드는 안 건드려도 됩니다. (구축기 3번)
 *
 * 계약: 각 카드는 아래 형태를 지킵니다 (구축기 5번).
 *   { id, tool, short, title, desc, saving, repo, demo, demoType, badge, status, points[] }
 *   - id:       카드 = 슬라이드 한 장. 슬라이드 주소(#id)로도 쓰이니 바꾸면 기존 링크가 끊깁니다.
 *   - tool:     슬라이드 머리 라벨이자 위치 레일·첫 화면 '한눈에 보기'의 이름.
 *   - short:    첫 화면 '한눈에 보기'에 들어갈 한 줄 소개 (짧게).
 *   - saving:   (선택) 실무 적용 시간 { before, after, unit, what } — 감소율(%)은 main.js 가 계산.
 *   - highlight: (선택) saving 이 없는 카드가 '한눈에 보기'에 대신 띄울 짧은 수치.
 *   - demoType: 'video' | 'perf' | 'pending'  ← main.js 가 이 값으로 렌더를 분기 (딱 3분기)
 *   - demo:     산출물 경로(상대). 'pending' 이면 null.
 *   - demoLabel: 영상·결과가 아직 없을 때 데모 자리에 보일 안내.
 *   - poster:   (선택) 영상이 뜨기 전에 보일 이미지 경로. 영상의 첫 프레임을 써야 재생이 시작될 때
 *               화면이 튀지 않습니다 (assets/<id>-poster.webp).
 *   - status:   'verified'(검증완료) | 'pending'(PC에서 실행예정)
 *   - statusLabel: (선택) status 기본 문구 대신 쓸 라벨. 색/아이콘은 status 를 따릅니다.
 *   - note:     (선택) { label, text } — 카드 하단 '제언' 블록. 한계/다음 과제를 적습니다.
 *
 * 문구 원칙: 짧고 쉬운 말로. desc 는 한두 문장, points 는 세 개까지.
 *   어려운 용어(러너·계약·헤드리스 같은 말) 대신 쉬운 말을 쓰고, 언어·도구 이름은 그대로 씁니다.
 */
window.QASS_PORTFOLIO = {
  cards: [
    // QASS — 자동화의 대상이자, 이 포트폴리오에서 유일하게 "직접 만들어 운영 중인 서비스".
    // 도구가 아니라 제품이라 맨 앞. 한계(확장 프로그램 = PC 전용)는 note 로 분리해 적는다.
    {
      id: 'qass',
      tool: 'QASS',
      short: '증적 자동 수집 · 팀 공유',
      title: 'QA 증적 자동 수집 · 팀 공유 서비스',
      desc: '탭만 옮겨도 화면 전체가 캡처되어 팀 공유 방에 쌓입니다. 영상은 서비스 화면을 차례로 둘러본 모습입니다.',
      saving: { before: 60, after: 5, unit: '분', what: '증적 수집·정리' },
      repo: 'https://qass1.pages.dev/',
      repoLabel: '서비스 열기 ↗',
      demo: 'assets/qass.webm',
      demoType: 'video',
      poster: 'assets/qass-poster.webp',
      demoLabel: '서비스 화면 둘러보기',
      badge: '직접 만든 서비스',
      status: 'verified',
      statusLabel: '운영 중',
      points: ['페이지 전체 자동 캡처', '방 단위 팀 공유', '1차 자동 점검 (시범 운영)'],
      note: {
        label: '제언',
        text: '크롬 확장 프로그램이라 지금은 PC에서만 캡처됩니다. 모바일용은 다음 과제입니다.',
      },
    },
    // Appium — 가상 폰(Pixel 8)에서 실제 실행·녹화까지 검증 완료 → 자동화 4종 중 맨 앞.
    {
      id: 'appium',
      tool: 'Appium',
      short: '안드로이드 폰 자동 검사',
      title: 'QASS 모바일 · 안드로이드 크롬',
      desc: '같은 8단계 검사를 안드로이드 폰의 크롬에서 자동으로 돌립니다. 가상 폰 Pixel\u00a08에서 8단계를 모두 통과했습니다.',
      saving: { before: 60, after: 5, unit: '분', what: '8단계 검사 1회' },
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/appium',
      demo: 'assets/appium.webm',
      demoType: 'video',
      poster: 'assets/appium-poster.webp',
      demoLabel: '실제 실행 녹화 · 가상 폰(Pixel\u00a08)',
      badge: '모바일',
      status: 'verified',
      points: ['Python · Appium', '안드로이드 크롬 자동 조작', 'PC에서 실행'],
    },
    // QA 흐름의 앞단(설계) 도구.
    {
      id: 'prd2tc',
      tool: 'PRD2TC',
      short: '기획서 → 테스트케이스 초안',
      title: '기획서(PRD) → 테스트케이스 자동 생성',
      desc: '기획서(pptx)를 넣으면 테스트케이스 표(xlsx)가 나옵니다. 표 양식은 코드로 고정하고, 빈칸만 Gemini AI가 채웁니다.',
      saving: { before: 60, after: 5, unit: '분', what: '기획서 1건 TC 초안' },
      repo: 'https://qaprd2tc.pages.dev/',
      repoLabel: '도구 열기 ↗',
      demo: 'assets/prd2tc.webm',
      demoType: 'video',
      poster: 'assets/prd2tc-poster.webp',
      demoLabel: '실제 도구 동작 녹화',
      badge: 'PRD → TC',
      status: 'verified',
      statusLabel: '운영 중',
      points: ['pptx 넣으면 xlsx로', '표 양식은 코드로 고정', 'Gemini AI가 빈칸 작성'],
      note: {
        label: '제언',
        text: '초안용입니다. 결과는 QA가 한 번 더 확인하는 것을 권합니다.',
      },
    },
    {
      id: 'playwright',
      tool: 'Playwright',
      short: '웹 자동 검사 (기준 코드)',
      title: 'QASS 웹 · 데스크톱 크롬',
      desc: '사람이 하던 8단계 검사를 크롬이 화면 없이 스스로 실행합니다. 네 가지 자동화의 기준이 되는 코드입니다.',
      saving: { before: 60, after: 5, unit: '분', what: '8단계 검사 1회' },
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/playwright',
      demo: 'assets/playwright.webm',
      demoType: 'video',
      poster: 'assets/playwright-poster.webp',
      demoLabel: '실제 실행 녹화',
      badge: '기준 코드',
      status: 'verified',
      points: ['JavaScript · Playwright', '화면 없이 자동 실행', '실행 장면 녹화'],
    },
    {
      id: 'selenium',
      tool: 'Selenium',
      short: '웹 자동 검사 (비교용)',
      title: 'QASS 웹 · 같은 검사 비교',
      desc: 'Playwright와 똑같은 검사를 Selenium으로 한 번 더 만들어, 두 도구의 차이를 비교했습니다.',
      saving: { before: 60, after: 5, unit: '분', what: '8단계 검사 1회' },
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/selenium',
      demo: 'assets/selenium.webm',
      demoType: 'video',
      poster: 'assets/selenium-poster.webp',
      demoLabel: '실제 실행 녹화',
      badge: 'Playwright와 비교',
      status: 'verified',
      points: ['Python · Selenium', 'Playwright와 같은 8단계', '실행 화면 녹화'],
    },
    // API — 판정 기준(목표 수치)은 직접 정한 값이다. 지표 선택만 ISO/IEC 25010·25023·Apdex 를 따랐다.
    {
      id: 'api',
      tool: 'API',
      short: '서버 속도 · 부하 측정',
      highlight: '요청 1,000번 측정',
      title: 'QASS 서버 · 속도·부하 테스트',
      desc: '사용자가 몰려도 서버가 빠른지 요청 1,000번을 보내 확인합니다. 미리 정한 목표 수치로 통과 여부를 판정합니다.',
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/api',
      demo: 'assets/api-perf.json',
      demoType: 'perf',
      demoLabel: '속도·부하 테스트 결과',
      badge: 'Postman · 부하',
      status: 'verified',
      points: ['Postman · Newman', '가상 사용자 10명 동시', '응답 속도·성공률 측정'],
    },
  ],

  // 마지막 장 — 같은 8단계 검사를 네 도구로 짠 결과 비교 (FLOW_CONTRACT.md · CODE_GUIDE.md §4 요약)
  // 코드 줄 수는 각 흐름 구현 파일에서 빈 줄·주석을 뺀 값입니다.
  compare: {
    id: 'compare',
    name: '비교',
    badge: '4종 비교',
    title: '같은 검사, 네 가지 도구',
    desc: 'QASS의 같은 8단계를 네 도구로 각각 자동화하고, 짜는 방식을 비교했습니다.',
    steps: ['첫 화면 열기', '앱 화면으로 이동', '이름으로 로그인', '방 목록 확인',
      '테스트 방 고르기', '방 입장', '캡처 목록 확인', "'google' 검색"],
    tools: ['Playwright', 'Selenium', 'Appium', 'API'],
    rows: [
      ['언어', 'JavaScript', 'Python', 'Python', 'JavaScript'],
      ['실행 환경', 'PC 크롬 · 화면 없이', 'PC 크롬', '안드로이드 크롬', '브라우저 없이 서버로'],
      ['기다리기', '알아서 기다림', '직접 지정', '직접 지정', '응답 올 때까지'],
      ['글자 입력', '지우고 입력을 한 번에', '지운 뒤 입력', '지운 뒤 입력', '입력 없음'],
      ['코드 줄\u00a0수', '88줄', '98줄', '98줄', '88줄'], // \u00a0: 좁은 화면에서 '줄 수'가 떨어지지 않게
      ['결과', '8단계 통과', '8단계 통과', '8단계 통과', '4단계·부하 통과'],
    ],
    lessons: [
      'Selenium·Appium은 입력칸을 먼저 비워야 했습니다. 미리 채워진 값 뒤에 글자가 이어 붙어 방 입장이 실패했습니다.',
      'Playwright는 누르고 입력하기 전에 알아서 기다려 주지만, Selenium은 기다릴 곳마다 직접 지정해야 했습니다.',
    ],
  },
};
