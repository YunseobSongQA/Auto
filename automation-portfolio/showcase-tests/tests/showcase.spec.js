// 소개 사이트 자동 테스트 — 사람이 매번 눈으로 확인하던 것을 그대로 옮겼다.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SLIDES = ['top', 'qass', 'appium', 'prd2tc', 'playwright', 'selenium', 'api', 'plan'];
const VIDEOS = ['qass', 'appium', 'prd2tc', 'playwright', 'selenium'];
// 도구마다 다른 실무 적용 시간 — [기존, 지금, 감소율]. 8단계 자동 검사 셋은 같은 검사라 같은 수치.
const SAVINGS = {
  qass: ['2시간', '1시간', '50%'],
  prd2tc: ['1시간', '5분', '92%'],
  appium: ['1분', '10초', '83%'],
  playwright: ['1분', '10초', '83%'],
  selenium: ['1분', '10초', '83%'],
};

// 위치 레일을 눌러 그 장으로 옮기고, 장이 켜질 때까지 기다린다.
async function goTo(page, id) {
  await page.locator('.rail-dot').nth(SLIDES.indexOf(id)).click();
  await expect(page.locator(`.slide[data-id="${id}"]`)).toHaveClass(/is-on/);
}

// 그 장의 영상이 실제로 돌고 있는가 (멈춤 아님 · 시간이 흐름)
const playing = (page, id) => page.evaluate(id => {
  const v = document.querySelector(`.slide[data-id="${id}"] video`);
  return !!v && !v.paused && v.currentTime > 0.2;
}, id);

test('첫 화면에 제목·소개·경력이 보인다', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('품질 관리 중 생기는 문제를');
  await expect(page.locator('.lede')).toContainText('실무에 활용합니다');
  // 마무리 문장은 소개(송윤섭) 아래에 한 번만 — 위 소개 문단에서 되풀이하지 않는다
  const motto = '반복은 줄이고, 아낀 시간은 목표한 품질에 투자합니다.';
  await expect(page.locator('.bio > p')).toHaveText(motto);
  await expect(page.locator('.lede')).not.toContainText(motto);
  const career = page.locator('.bio-career');
  await expect(career).toContainText('컴즈');
  await expect(career).toContainText('前');
  await expect(career).toContainText('LG CNS 배포 담당 QA');
  await expect(career).toContainText('現');
  await expect(career).toContainText('KB국민은행 여신 파트 QA');
});

test('넓은 화면 첫 화면에 도구별 단축 수치가 바로 보인다', async ({ page, isMobile }) => {
  test.skip(isMobile, '좁은 화면에서는 각 장에서 보여 준다');
  await page.goto('/');
  await expect(page.locator('.intro-index li')).toHaveCount(SLIDES.length - 1);
  for (const [id, [before, after, rate]] of Object.entries(SAVINGS)) {
    await expect(page.locator(`.intro-index a[href="#${id}"] .ix-metric`)).toHaveText(`${before}→${after} ${rate}↓`);
  }
});

test('도구 장마다 그 도구의 실무 적용 시간이 보인다 (2시간 → 1시간 · 1시간 → 5분 · 1분 → 10초)', async ({ page }) => {
  await page.goto('/');
  for (const [id, [before, after, rate]] of Object.entries(SAVINGS)) {
    await goTo(page, id);
    const num = page.locator(`.slide[data-id="${id}"] .saving-num`);
    await expect(num.locator('span')).toHaveText(before);
    await expect(num.locator('b')).toHaveText(after);
    await expect(num.locator('em')).toHaveText(`${rate} 감소`);
  }
});

test('마지막 장은 도구별 현재 효과 · 한계 · 다음 단계 표다', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'plan');
  const table = page.locator('.slide[data-id="plan"] .plan-tbl');
  await expect(table.locator('thead th')).toHaveText(['도구', '현재 효과', '한계', '다음 단계']);
  await expect(table.locator('tbody th b')).toHaveText(['QASS', 'PRD2TC', '자동 검사', 'API']);
  // 효과 칸 첫 줄의 수치는 카드의 실무 적용 시간에서 가져온다 — 카드와 어긋나면 안 된다
  const metrics = table.locator('.plan-metric');
  await expect(metrics.locator('span')).toHaveText(['2시간 → 1시간', '1시간 → 5분', '1분 → 10초']);
  await expect(metrics.locator('em')).toHaveText(['50% 감소', '92% 감소', '83% 감소']);
  await expect(metrics.nth(3)).toHaveText('요청 1,000번 · 성공률 100%');
});

test('레일을 누르면 그 장이 켜지고 주소가 바뀐다', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.rail-dot')).toHaveCount(SLIDES.length);
  for (const id of SLIDES.slice(1)) {
    await goTo(page, id);
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  }
});

test('장에 들어가면 그 장의 영상만 재생된다', async ({ page }) => {
  await page.goto('/');
  for (const id of VIDEOS) {
    await goTo(page, id);
    await expect.poll(() => playing(page, id), { timeout: 10_000 }).toBe(true);
    const others = await page.evaluate(id => [...document.querySelectorAll('.demo video')]
      .filter(v => !v.closest(`.slide[data-id="${id}"]`) && !v.paused).length, id);
    expect(others).toBe(0);
  }
});

test('같은 장에 다시 들어오면 처음부터 다시 재생된다', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'qass');
  await expect.poll(() => playing(page, 'qass'), { timeout: 10_000 }).toBe(true);
  await page.waitForTimeout(1500);
  await goTo(page, 'appium');
  await goTo(page, 'qass');
  // 되감기가 끝나고(사파리는 서버의 Range 응답이 있어야 된다) 앞부분부터 다시 돈다
  await expect.poll(() => page.evaluate(() => {
    const v = document.querySelector('.slide[data-id="qass"] video');
    return !v.paused && v.currentTime > 0.1 && v.currentTime < 1.4;
  }), { timeout: 10_000, intervals: [100] }).toBe(true);
});

test('#selenium 주소로 열면 그 장에서 바로 시작한다', async ({ page }) => {
  await page.goto('/#selenium');
  await expect(page.locator('.slide.is-on')).toHaveAttribute('data-id', 'selenium');
});

test('열 때 화면이 밀리지 않는다 (CLS < 0.1)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', '화면 밀림(layout-shift) 측정은 Chromium 만 지원');
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; }))
      .observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1);
});

test('글자 대비가 기준(4.5:1)을 넘는다 — 첫 화면 · 도구 장 · 결과표 · 다크 모드', async ({ page }) => {
  const check = async where => {
    // 장 전환·떠오르는 연출이 모두 끝난 뒤에 잰다 — 도중에 재면 반투명 글자를 재서 실패한다.
    // 정해 둔 시간만 기다리면 느린 기계(CI)에서 연출이 덜 끝나 들쭉날쭉했다.
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'));
    const r = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    const bad = r.violations.flatMap(v => v.nodes.map(n => `${where}: ${n.target.join(' ')}`));
    expect(bad).toEqual([]);
  };
  await page.goto('/');
  await check('첫 화면');
  await goTo(page, 'qass');
  await check('QASS');
  await goTo(page, 'api');
  await expect(page.locator('.slide[data-id="api"] .perf')).toBeVisible();
  await check('API 결과표');
  await page.locator('.theme-toggle').click();
  await goTo(page, 'plan');
  await check('제언 · 다크 모드');
});

test('제언 표 글자가 단어 중간에서 끊기지 않는다', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'plan');
  // 띄어쓰기로 나눈 단어마다, 그려진 글자가 두 줄에 걸쳐 있으면 단어 중간에서 끊긴 것이다
  const broken = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.plan-tbl th, .plan-tbl td').forEach(cell => {
      if (cell.offsetWidth <= 1) return; // 스크린리더용으로 숨긴 칸(좁은 화면의 머리글)은 뺀다
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const m of node.data.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, m.index);
          range.setEnd(node, m.index + m[0].length);
          const lines = new Set([...range.getClientRects()].map(r => Math.round(r.top)));
          if (lines.size > 1) out.push(m[0]);
        }
      }
    });
    return out;
  });
  expect(broken).toEqual([]);
});

test('영상 Range 요청에는 206(부분 응답)으로 답한다 — 아이폰 재생 조건', async ({ request }) => {
  const res = await request.get('/assets/playwright.mp4', { headers: { Range: 'bytes=0-1' } });
  expect(res.status()).toBe(206);
  expect(res.headers()['content-range']).toMatch(/^bytes 0-1\/\d+$/);
  expect((await res.body()).length).toBe(2);
  const full = await request.get('/assets/playwright.mp4');
  expect(full.headers()['accept-ranges']).toBe('bytes');
});

test('콘솔 오류 없이 끝까지 넘길 수 있다', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  for (const id of SLIDES.slice(1)) await goTo(page, id);
  expect(errors).toEqual([]);
});

test.describe('동작 줄이기를 켠 사용자', () => {
  test.use({ reducedMotion: 'reduce' });
  test('고정 화면 없이 평범한 세로 문서로 모든 장이 보인다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/has-reel/);
    for (const id of SLIDES) await expect(page.locator(`.slide[data-id="${id}"]`)).toBeVisible();
  });
});
