/**
 * config.js — 데이터 계층 (거의 안 바뀜)
 * UI(index.html/styles.css)·로직(main.js)과 분리된 "데이터 주입" 한 곳.
 * 카드/문구/수치를 여기서만 바꾸면 코드는 안 건드려도 됩니다. (구축기 3번)
 *
 * 계약: 각 카드는 아래 형태를 지킵니다 (구축기 5번).
 *   { id, tool, short, title, desc, saving | stat, specs[], repo, demo, demoType, badge, status }
 *   - id:       카드 = 슬라이드 한 장. 슬라이드 주소(#id)로도 쓰이니 바꾸면 기존 링크가 끊깁니다.
 *   - tool:     슬라이드 머리 라벨이자 위치 레일·첫 화면 '요약'의 이름.
 *   - short:    첫 화면 '요약'에 들어갈 한 줄 소개 (짧게).
 *   - badge:    슬라이드 오른쪽 위 분류 (자체 서비스 · 웹 자동화 등).
 *   - saving:   (선택) 실무 적용 시간 { before, after, what }. before/after 는 '2시간'·'5분'·'10초'처럼
 *               숫자+단위(시간·분·초)로 적습니다. 단축률(%)은 main.js 가 초로 바꿔 계산합니다.
 *   - stat:     (선택) saving 대신 보일 핵심 수치 { value, label, sub } — 예: 성공률 100%.
 *   - specs:    [이름, 내용] 줄 목록 — 언어 · 환경 · 대상처럼 사실만 짧게.
 *   - vs:       (선택) 비교표 { title, head: [도구…], rows: [[구분, 값…]…] } — 열이 도구, 행이 장점·단점.
 *   - demoType: 'video' | 'perf' | 'pending'  ← main.js 가 이 값으로 렌더를 분기 (딱 3분기)
 *   - demo:     산출물 경로(상대). 'pending' 이면 null.
 *   - demoLabel: 영상·결과가 아직 없을 때 데모 자리에 보일 안내.
 *   - poster:   (선택) 영상이 뜨기 전에 보일 이미지 경로. 영상의 첫 프레임을 써야 재생이 시작될 때
 *               화면이 튀지 않습니다 (assets/<id>-poster.webp).
 *   - status:   'verified'(검증 완료) | 'pending'(PC에서 실행 예정)
 *   - statusLabel: (선택) status 기본 문구 대신 쓸 라벨. 색/아이콘은 status 를 따릅니다.
 *
 * 문구 원칙: 짧고 담백하게. desc 는 만든 계기(현장에서 겪은 문제 → 그래서 만든 것)를 두세 문장으로,
 *   친근하되 공손한 합니다체로. specs 는 서너 줄. 수치는 숫자로 적고,
 *   어려운 용어 대신 쉬운 말을 쓰되 언어·도구 이름은 그대로 씁니다.
 *   가운뎃점(·)은 낱말을 나열할 때만 붙여 쓰고, 문장 구분에는 쓰지 않습니다.
 */
window.QASS_PORTFOLIO = {
  cards: [
    // QASS — 자동화의 대상이자, 이 포트폴리오에서 유일하게 "직접 만들어 운영 중인 서비스".
    // 도구가 아니라 제품이라 맨 앞. 한계(확장 프로그램 = PC 전용)는 마지막 제언 표에 적는다.
    {
      id: 'qass',
      tool: 'QASS',
      short: '증적 수집 자동화',
      title: 'QA 증적 자동 수집 서비스',
      desc: '2026년 7월, SI 프로젝트의 품질 관리를 맡으면서 근무 시간의 절반 이상이 증적에 쓰인다는 걸 알게 됐습니다. '
        + '2~3시간씩 화면을 캡처하고, 놓친 곳을 다시 찾고, 한곳에 모아 정리해 보고하기까지 시간도 사람도 많이 들었죠. '
        + '그래서 테스트만 하면 증적이 자동으로 모이는 서비스를 만들었습니다. '
        + '앞으로는 PC뿐 아니라 모바일 캡처도 지원하고, PPT 보고서까지 만들어 주는 도구로 키워 갈 계획입니다.',
      saving: { before: '2시간', after: '1시간', what: '증적 수집·정리' },
      specs: [
        ['구성', '웹 서비스, 크롬 확장 프로그램'],
        ['공유', '방 단위 팀 공유'],
        ['점검', '맞춤법·UI 장애 1차 점검 (시범 운영)'],
      ],
      repo: 'https://qass1.pages.dev/',
      repoLabel: '서비스 열기 ↗',
      demo: 'assets/qass.webm',
      demoType: 'video',
      poster: 'assets/qass-poster.webp',
      demoLabel: '서비스 화면 시연',
      badge: '자체 서비스',
      status: 'verified',
      statusLabel: '운영 중',
    },
    // Appium — PC(Windows)의 Android Studio 에뮬레이터(Pixel 8 · Android 14)에서 실제 실행·녹화까지
    // 검증 완료 → 자동화 4종 중 맨 앞.
    {
      id: 'appium',
      tool: 'Appium',
      short: '모바일 웹 자동 검사',
      title: 'QASS 모바일 웹 자동 검사',
      desc: '운영 서버의 품질을 관리하다 보면 모바일에서도 같은 리그레션 테스트를 몇 번이고 반복하게 됩니다. '
        + '매번 손으로 하던 이 반복을 Appium에 맡기려고 만들었습니다.',
      saving: { before: '1분', after: '10초', what: '8단계 검사 1회' },
      specs: [
        ['언어', 'Python (pytest)'],
        ['도구', 'Appium, UiAutomator2'],
        ['환경', 'Android Studio 에뮬레이터 (Pixel 8)'],
      ],
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/appium',
      demo: 'assets/appium.webm',
      demoType: 'video',
      poster: 'assets/appium-poster.webp',
      demoLabel: '실행 녹화, Android Studio 에뮬레이터 (Pixel 8)',
      badge: '모바일 자동화',
      status: 'verified',
    },
    // QA 흐름의 앞단(설계) 도구.
    {
      id: 'prd2tc',
      tool: 'PRD2TC',
      short: '기획서 기반 TC 생성',
      title: '기획서 기반 테스트케이스 자동 생성',
      desc: 'SI 프로젝트의 테스트 기간에는 기획서가 자주 바뀝니다. '
        + '그때마다 내용을 따라가며 테스트케이스를 고치느라 적지 않은 시간이 들어, 이를 줄이려고 만들었습니다. '
        + '수정된 기획서를 넣으면 TC 초안이 바로 나와 작성 시간을 크게 줄여 줍니다.',
      saving: { before: '1시간', after: '5분', what: '기획서 1건 TC 초안' },
      specs: [
        ['입력', '기획서 (pptx)'],
        ['출력', '테스트케이스 표 (xlsx)'],
        ['작성', '양식은 코드로 고정, 빈칸은 Gemini AI'],
      ],
      repo: 'https://qaprd2tc.pages.dev/',
      repoLabel: '도구 열기 ↗',
      demo: 'assets/prd2tc.webm',
      demoType: 'video',
      poster: 'assets/prd2tc-poster.webp',
      demoLabel: '도구 시연',
      badge: '테스트 설계',
      status: 'verified',
      statusLabel: '운영 중',
    },
    {
      id: 'playwright',
      tool: 'Playwright',
      short: '웹 자동 검사 (기준 구현)',
      title: 'QASS 웹 자동 검사',
      desc: '운영 서버 리그레션 테스트를 PC에서 할 때마다 같은 확인을 손으로 반복해야 했습니다. '
        + '이 반복을 줄이려고 로그인부터 검색까지 핵심 흐름 8단계를 자동으로 확인하도록 만들었습니다.',
      saving: { before: '1분', after: '10초', what: '8단계 검사 1회' },
      specs: [
        ['언어', 'JavaScript'],
        ['환경', '크롬, 화면 없이 실행'],
        ['코드', '88줄'],
      ],
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/playwright',
      demo: 'assets/playwright.webm',
      demoType: 'video',
      poster: 'assets/playwright-poster.webp',
      demoLabel: '실행 녹화',
      badge: '웹 자동화',
      status: 'verified',
    },
    // Selenium — Playwright 와 같은 8단계를 다시 짜 본 비교 구현. 장단점은 vs 표에 아주 짧게.
    // 코드 줄 수는 흐름 구현 파일에서 빈 줄·주석을 뺀 값 (playwright/qass-flow.js · selenium/qass_flow.py).
    {
      id: 'selenium',
      tool: 'Selenium',
      short: '웹 자동 검사 (비교 구현)',
      title: 'Selenium 구현과 Playwright 비교',
      desc: 'Playwright와 같은 PC 리그레션 테스트를 Selenium으로도 만들었습니다. '
        + '현장에서 많이 쓰는 두 도구를 같은 조건에서 직접 비교해 보고 싶었습니다.',
      saving: { before: '1분', after: '10초', what: '8단계 검사 1회' },
      specs: [
        ['언어', 'Python'],
        ['환경', '크롬'],
        ['코드', '98줄'],
      ],
      vs: {
        title: 'Playwright와 비교',
        head: ['Playwright', 'Selenium'],
        rows: [
          ['장점', '자동 대기·녹화 내장, 88줄', 'W3C 표준, 언어와 브라우저 폭넓음'],
          ['단점', '모바일은 에뮬레이션 중심', '대기·입력 직접 처리, 98줄'],
        ],
      },
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/selenium',
      demo: 'assets/selenium.webm',
      demoType: 'video',
      poster: 'assets/selenium-poster.webp',
      demoLabel: '실행 녹화',
      badge: '웹 자동화',
      status: 'verified',
    },
    // API — QASS 실서비스 백엔드(Supabase REST, snjexfohyklviarxprvm.supabase.co)에 QASS 웹과 같은 공개
    // 읽기 키로 GET 만 보낸다(방 목록 · 테스트 방 캡처 목록). 쓰기·삭제 없음. 판정 기준(목표 수치)은
    // 직접 정한 값이고, 지표 선택만 ISO/IEC 25010·25023·Apdex 를 따랐다. (2026-06-29 측정)
    {
      id: 'api',
      tool: 'API',
      short: '백엔드 부하 테스트',
      title: 'QASS 백엔드 부하 테스트',
      desc: '운영 서버 리그레션 테스트와, SI 프로젝트 중 병목이 생기는 구간의 부하 테스트에 언제든 대비하려고 만들었습니다. '
        + 'QASS 실서비스 백엔드에 조회 요청 1,000건을 보내 속도와 안정성을 확인했습니다.',
      stat: { value: '100%', label: '성공률', sub: '1,000건 중 실패 0건' },
      specs: [
        ['대상', 'QASS 백엔드 (Supabase REST API)'],
        ['요청', '조회(GET) 2종, 총 1,000건, 읽기 전용'],
        ['부하', '가상 사용자 10명 동시'],
        ['도구', 'Postman, Newman'],
      ],
      repo: 'https://github.com/YunseobSongQA/Auto/tree/main/automation-portfolio/api',
      demo: 'assets/api-perf.json',
      demoType: 'perf',
      demoLabel: '부하 테스트 결과',
      badge: '성능 테스트',
      status: 'verified',
    },
  ],

  // 마지막 장 — 도구별 효과 · 한계 · 개선 방향 (제언). 칸마다 짧은 한 줄.
  // 효과 칸의 수치는 from 카드의 saving(단축률) · stat 에서 main.js 가 가져온다 — 수치는 카드만 고친다.
  plan: {
    id: 'plan',
    name: '제언',
    title: '성과와 개선 방향',
    columns: ['효과', '한계', '개선 방향'],
    rows: [
      { name: 'QASS', sub: '증적 수집', from: 'qass', limit: 'PC 크롬 전용', next: '모바일 캡처, PPT 보고서 자동화' },
      { name: 'PRD2TC', sub: 'TC 설계', from: 'prd2tc', limit: '결과 검수 필요', next: '검수 피드백 반영' },
      { name: 'UI 자동화', sub: 'Playwright, Selenium, Appium', from: 'selenium', limit: '핵심 흐름 8단계만', next: 'GitHub Actions 정기 실행' },
      { name: 'API', sub: '부하 테스트', from: 'api', limit: '조회 API 2종만', next: '쓰기 API·부하 확대' },
    ],
    note: '효과 수치는 실무 적용 기준입니다.',
  },
};
