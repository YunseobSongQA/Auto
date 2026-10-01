/**
 * qass-demo.mjs — QASS(증적 관리 플랫폼) 제품 시연 영상 녹화기.
 *
 * 이 파일은 "플로우 계약 구현"(qass-flow.js)이 아니라, 쇼케이스(web/)의
 * QASS 카드에 붙일 제품 시연 영상을 만드는 녹화 스크립트입니다.
 * 실제 배포된 QASS(https://qass1.pages.dev)를 데스크톱 크롬으로 돌아다니며
 * 랜딩 → 로그인 → 방 목록 → 방 → 검색 → 1차 자동 점검까지 순서대로 보여 줍니다.
 *
 * 실행:  node qass-demo.mjs
 * 산출물: ../web/assets/qass.webm  (포스터는 README 의 ffmpeg 명령으로 영상 첫 프레임에서 뽑음)
 *         mp4 변환은 README 의 ffmpeg 명령 참고 (모바일 재생용 1순위 소스).
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'web', 'assets');
const TMP_DIR = path.join(__dirname, 'artifacts', 'demo-video');
const BASE = 'https://qass1.pages.dev';
const VIEWPORT = { width: 1280, height: 800 };

// 화면 아래쪽 자막 — 지금 무엇을 보여 주는 중인지 한 줄로 설명한다.
// 페이지 이동 때마다 DOM 이 날아가므로 say() 안에서 매번 다시 심는다.
const CAPTION_CSS = `
  #qass-demo-cap{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;
    padding:14px 22px;background:rgba(15,23,42,.92);color:#fff;
    font:600 19px/1.45 'Pretendard','Malgun Gothic',system-ui,sans-serif;
    letter-spacing:-.01em;display:flex;align-items:center;gap:12px;
    border-top:2px solid #6366f1}
  #qass-demo-cap b{background:#6366f1;color:#fff;border-radius:6px;
    padding:3px 9px;font-size:14px;font-weight:700;flex:none}`;

async function say(page, step, text) {
  await page.evaluate(([step, text, css]) => {
    let el = document.getElementById('qass-demo-cap');
    if (!el) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      el = document.createElement('div');
      el.id = 'qass-demo-cap';
      document.body.appendChild(el);
    }
    el.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = step;
    const span = document.createElement('span');
    span.textContent = text;
    el.append(b, span);
  }, [step, text, CAPTION_CSS]);
}

// 부드러운 스크롤 — 뚝뚝 끊기지 않게 프레임 단위로 조금씩 내린다.
async function smoothScroll(page, toY, ms = 1400) {
  await page.evaluate(([toY, ms]) => new Promise(res => {
    const from = window.scrollY, dist = toY - from, t0 = performance.now();
    (function tick(t) {
      const k = Math.min(1, (t - t0) / ms);
      window.scrollTo(0, from + dist * (k < .5 ? 2 * k * k : 1 - 2 * (1 - k) ** 2));
      k < 1 ? requestAnimationFrame(tick) : res();
    })(t0);
  }), [toY, ms]);
}

const wait = (page, ms) => page.waitForTimeout(ms);

async function main() {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    locale: 'ko-KR',
    recordVideo: { dir: TMP_DIR, size: VIEWPORT },
  });
  const page = await ctx.newPage();

  // 1. 랜딩 — QASS 가 어떤 도구인지
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await say(page, '1', 'QASS — QA 증적(테스트 기록)을 자동으로 모아 주는 팀 공유 플랫폼');
  await wait(page, 3200);
  await smoothScroll(page, 900, 1600);
  await say(page, '1', '자동 풀페이지 캡처 · 방 단위 팀 공유 · 맞춤법/UI 장애 1차 자동 점검');
  await wait(page, 3400);
  await smoothScroll(page, 1750, 1500);
  await wait(page, 2600);

  // 2. 로그인 — 회원가입 없이 이름만
  await page.goto(`${BASE}/app.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-screen').waitFor({ state: 'visible' });
  await say(page, '2', '회원가입 없이 이름만 입력하면 바로 사용합니다');
  await wait(page, 1600);
  await page.click('#login-name');
  await page.type('#login-name', 'QA데모', { delay: 190 });
  await wait(page, 900);
  await page.click('#btn-login');

  // 3. 방 목록 — 프로젝트/회차별 공유 공간
  await page.locator('#rooms-screen').waitFor({ state: 'visible' });
  await say(page, '3', '방(Room) 목록 — 프로젝트나 테스트 회차별로 팀원과 공유합니다');
  await page.locator('.room-card').first().waitFor({ timeout: 20_000 });
  await wait(page, 3200);

  // 4. 1차 자동 점검 탭 — 무엇을 잡아내는지
  await page.locator('#rooms-screen button.main-tab', { hasText: '1차 자동 점검' }).click();
  await say(page, '4', '1차 자동 점검 — 캡처에서 맞춤법·띄어쓰기·UI 장애를 자동 검출');
  await wait(page, 4200);
  await page.locator('#inspect-screen button.main-tab', { hasText: '증적 캡처' }).click();
  await wait(page, 1400);

  // 5. 방 입장 — 팀 증적이 한곳에
  await say(page, '5', '테스트 방에 입장하면 팀원 전원의 증적이 한 공간에 모여 있습니다');
  const card = page.locator('.room-card', { hasText: 'QASS 테스트 방' }).first();
  await card.locator('.room-enter-btn').click();
  await wait(page, 1200);
  if (await page.locator('#enter-room-modal').isVisible()) {
    await page.fill('#enter-room-password', 'qass1234');
    await page.fill('#enter-uploader-name', 'QA데모');
    await page.click('#btn-enter-room-submit');
  }
  await page.locator('#room-screen').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const el = document.getElementById('count-label');
    return el && !/불러오는/.test(el.textContent || '');
  }, { timeout: 20_000 });
  await say(page, '5', '업로더 이름과 캡처 시각이 자동으로 기록됩니다');
  await wait(page, 3000);
  await smoothScroll(page, 700, 1500);
  await wait(page, 2400);
  await smoothScroll(page, 0, 1200);

  // 6. 검색 — URL·제목으로 바로 찾기
  await say(page, '6', 'URL·페이지 제목으로 검색해 필요한 증적만 바로 골라냅니다');
  await page.click('#search');
  await page.type('#search', 'google', { delay: 190 });
  await wait(page, 3200);
  await page.fill('#search', '');
  await wait(page, 1200);

  // 7. 장애 보기 — 원본 위에 오버레이로 검출 위치 표시
  await say(page, '7', '검출된 오류는 원본을 훼손하지 않는 오버레이로 위치까지 표시됩니다');
  await page.locator('button:has-text("장애 보기")').first().click();
  await wait(page, 4500);
  await say(page, '7', '맞춤법 · 띄어쓰기 · 텍스트 잘림을 종류별로 분류해 보여 줍니다');
  await wait(page, 3800);

  await say(page, '✓', '테스트만 하면 증적은 따라옵니다 — qass1.pages.dev');
  await wait(page, 3000);

  await ctx.close();
  await browser.close();

  // Playwright 가 임의 해시 이름으로 저장한 webm → web/assets/qass.webm 로 이동
  const rec = fs.readdirSync(TMP_DIR).find(f => f.endsWith('.webm'));
  if (!rec) throw new Error('녹화 파일을 찾지 못했습니다: ' + TMP_DIR);
  const dest = path.join(OUT_DIR, 'qass.webm');
  fs.copyFileSync(path.join(TMP_DIR, rec), dest);
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log('완료:', dest, (fs.statSync(dest).size / 1024 / 1024).toFixed(2) + 'MB');
}

main().catch(err => { console.error(err); process.exit(1); });
