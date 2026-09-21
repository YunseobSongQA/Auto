/**
 * config.js — 데이터 계층 (거의 안 바뀜)
 * UI(index.html/styles.css)·로직(main.js)과 분리된 "데이터 주입" 한 곳.
 * 카드/규칙/문구를 여기서만 바꾸면 코드는 안 건드려도 됩니다. (구축기 3번)
 *
 * 계약: 각 카드는 아래 형태를 지킵니다 (구축기 5번).
 *   { id, tool, title, desc, repo, demo, demoType, demoLabel, badge, status, points[] }
 *   - demoType: 'video' | 'perf' | 'pending'  ← main.js 가 이 값으로 렌더를 분기 (딱 3분기)
 *   - demo:     산출물 경로(상대). 'pending' 이면 null.
 *   - demoLabel: 데모 영역 캡션("영상 아님" 같은 설명).
 *   - poster:   (선택) 영상 로드 전/재생 불가 시 표시할 스크린샷 경로.
 *   - status:   'verified'(검증완료) | 'pending'(PC에서 실행예정)
 *   - statusLabel: (선택) status 기본 문구 대신 쓸 라벨. 색/아이콘은 status 를 따릅니다.
 *   - note:     (선택) { label, text } — 카드 하단 '제언' 블록. 한계/다음 과제를 적습니다.
 *
 * 문구 원칙: desc 는 두 문장 이내, points 는 세 개까지. 카드가 길어지면 읽히지 않습니다.
 */
window.QASS_PORTFOLIO = {
  // 모든 카드가 공유하는 타깃 — 소개 문단의 'QASS 열기' 링크가 여기를 가리킵니다
  sharedTarget: {
    name: 'QASS',
    url: 'https://qass1.pages.dev/',
  },

  // 공통 플로우 한 줄 요약 (FLOW_CONTRACT.md §1 과 동일 · "증적"은 쉬운 말 "캡처"로 표기)
  sharedFlow: '로그인 → 방 입장 → 캡처 확인 → 검색',

  cards: [
    // QASS — 자동화의 대상이자, 이 포트폴리오에서 유일하게 "직접 만들어 운영 중인 서비스".
    // 도구가 아니라 제품이라 맨 앞. 한계(확장 프로그램 = PC 전용)는 note 로 분리해 적는다.
    {
      id: 'qass',
      tool: 'QASS',
      title: 'QA 증적 자동 수집 · 팀 공유 플랫폼',
      desc: 'QA에서 가장 번거로운 증적(테스트 기록) 모으기를 직접 서비스로 만들어 운영 중입니다. 탭만 옮겨도 풀페이지 캡처가 팀 공유 방에 쌓이고, 모인 증적을 맞춤법·UI 장애 기준으로 한 번 훑어 주는 1차 자동 점검이 파일럿으로 들어가 있습니다. 아래 영상은 캡처를 실제로 돌리는 장면이 아니라, 화면 구성이 어떻게 돼 있는지 차례로 둘러본 것입니다.',
      repo: 'https://qass1.pages.dev/',
      repoLabel: '서비스 열기 ↗',
      demo: 'assets/qass.webm',
      demoType: 'video',
      poster: 'assets/qass-run.jpg',
      demoLabel: '화면 구성 둘러보기 · 로그인 → 방 목록 → 방 입장 → 검색 → 1차 자동 점검',
      badge: '직접 만든 서비스',
      status: 'verified',
      statusLabel: '운영 중',
      points: ['자동 풀페이지 캡처', '방 단위 팀 공유', '1차 자동 점검 (파일럿)'],
      note: {
        label: '제언',
        text: '자동 캡처와 1차 자동 점검은 크롬 확장 프로그램 기능이라 지금은 PC(데스크톱 크롬) 전용이고, 모바일에서는 업로드·열람만 됩니다. 모바일 QA까지 덮으려면 앱용을 따로 만들어야 하며, 이를 다음 과제로 보고 있습니다.',
      },
    },
    // Appium — 에뮬레이터(Pixel 8)에서 실제 실행·녹화까지 검증 완료 → 자동화 4종 중 맨 앞.
    {
      id: 'appium',
      tool: 'Appium',
      title: 'QASS 모바일 · 안드로이드 크롬',
      desc: '공통 검사를 스마트폰(안드로이드 크롬)에서 실행합니다. PC의 에뮬레이터(Pixel 8)에서 8스텝을 모두 통과했고, 아래가 그 실행 녹화입니다.',
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/appium',
      demo: 'assets/appium.webm',
      demoType: 'video',
      poster: 'assets/appium-run.png', // 영상 로드 전/재생 불가 시 보이는 실행 스크린샷
      demoLabel: '실제 실행 녹화 · 안드로이드 에뮬레이터(Pixel 8) 크롬 · 8스텝 통과',
      badge: '모바일',
      status: 'verified',
      points: ['pytest 표준 러너', 'UiAutomator2', 'PC에서 실행'],
    },
    // (C) 기존 도구 카드와 동일한 구조. QA 흐름의 앞단(설계) 도구.
    {
      id: 'prd2tc',
      tool: 'PRD2TC',
      title: '기획서(PRD) → 테스트케이스 자동 생성',
      desc: '기획서는 작성자마다 말투와 정리 방식이 달라서, QA가 매번 해석하고 테스트를 짜는 데 시간이 걸립니다. 그래서 표 양식과 테스트케이스 생성 방식은 코드로 고정해 두고 빈칸만 Gemini API로 채우게 만들었습니다. pptx를 넣으면 testcases.xlsx가 나옵니다.',
      repo: 'https://qaprd2tc.pages.dev/',
      repoLabel: '도구 열기 ↗',
      demo: 'assets/prd2tc.webm',
      demoType: 'video',
      demoLabel: '실제 도구 동작 · 기획서(pptx) 입력 → 테스트케이스 표 생성',
      badge: 'PRD → TC',
      status: 'verified',
      statusLabel: '운영 중',
      points: ['pptx 입력 → xlsx 출력', '표 양식·열 규격은 코드로 고정', '빈칸만 Gemini API로 생성'],
      note: {
        label: '제언',
        text: 'TC 초안을 잡는 데 쓰는 것을 권합니다. 결과물을 그대로 쓰기보다, QA가 방향을 한 번 더 검증하는 편이 안전합니다.',
      },
    },
    {
      id: 'playwright',
      tool: 'Playwright',
      title: 'QASS 웹 · 데스크톱 크롬',
      desc: '사람이 하던 검사를 크롬이 화면 없이(헤드리스) 스스로 실행합니다. 자동화 4종의 기준이 되는 구현입니다.',
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
      desc: '위 Playwright와 똑같은 검사를, 업계에서 가장 오래 쓰여 온 Selenium으로 한 번 더 만들었습니다. 같은 일을 두 도구로 짜 보면 차이가 그대로 드러납니다.',
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
      desc: '화면 뒤에서 데이터를 보내 주는 서버가 사용자가 몰려도 빠른지 시험합니다. 요청을 1,000번 보내 응답 속도를 재고, 국제 표준 기준으로 통과/실패를 판정합니다.',
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/api',
      demo: 'assets/api-perf.json',
      demoType: 'perf',
      demoLabel: '성능·부하 테스트 결과 · 영상 아님',
      badge: 'Postman · 부하',
      status: 'verified',
      points: ['Postman·Newman', 'p50/p95/p99 지연', '성공률·처리량'],
    },
  ],
};
