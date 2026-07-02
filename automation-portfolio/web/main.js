'use strict';
/**
 * main.js — 로직/렌더 계층 (가끔 바뀜)
 * config.js(데이터)를 받아 index.html(UI) 위에 그립니다.
 * DOM 조작은 여기 한 곳. 순수 변환(buildCard)과 부수효과(render)를 나눕니다. (구축기 2번)
 */
(function () {
  const cfg = window.QASS_PORTFOLIO;

  // ── 순수 함수: 카드 데이터 → HTML 문자열 (DOM/네트워크 없음) ────────────────
  function buildCard(card, shared) {
    const statusClass = card.status === 'verified' ? 'st-done' : 'st-stub';
    const statusText = card.status === 'verified' ? '검증완료' : 'PC에서 실행예정';
    const points = card.points.map(p => `<li>${esc(p)}</li>`).join('');
    const repoLabel = card.repoLabel || 'GitHub에서 코드 보기 ↗';
    return `
      <article class="card" data-tool="${esc(card.id)}">
        <div class="card-top">
          <span class="tool">${esc(card.tool)}</span>
          <span class="chip">${esc(card.badge)}</span>
        </div>
        <h2>${esc(card.title)}</h2>
        <p class="desc">${esc(card.desc)}</p>

        <div class="demo" data-demo="${esc(card.demo || '')}" data-type="${esc(card.demoType)}" data-label="${esc(card.demoLabel || '')}">
          <div class="demo-ph">${esc(card.demoLabel || '데모 준비 중')}<br><small>${esc(card.tool)} 실행 결과</small></div>
        </div>

        <ul class="points">${points}</ul>

        <div class="card-foot">
          <span class="target"><svg class="ticon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.6" fill="currentColor"/></svg>${esc(card.target)}</span>
          <span class="status ${statusClass}">${statusText}</span>
          <a class="repo" href="${esc(card.repo)}" target="_blank" rel="noopener">${esc(repoLabel)}</a>
        </div>
      </article>`;
  }

  // ── 부수효과: 화면에 반영 ──────────────────────────────────────────────────
  function render() {
    document.getElementById('shared-label').textContent = cfg.sharedTarget.label;
    document.getElementById('shared-flow').textContent = cfg.sharedFlow;
    const link = document.getElementById('target-link');
    link.href = cfg.sharedTarget.url;
    link.textContent = `${cfg.sharedTarget.name} 열기 ↗`;

    const grid = document.getElementById('cards');
    grid.innerHTML = cfg.cards.map(c => buildCard(c, cfg.sharedTarget)).join('');

    grid.querySelectorAll('.demo').forEach(renderDemo);
  }

  // 데모 타입에 따라 분기 (구축기 10번 · 조기 추상화 금지)
  function renderDemo(el) {
    const type = el.getAttribute('data-type');
    const src = el.getAttribute('data-demo');
    if (type === 'video') return renderVideo(el, src);
    if (type === 'perf') return renderPerf(el, src);
    if (type === 'mockup') return renderMockup(el);
    if (type === 'prd') return renderPrd(el);
    // 'pending' → 플레이스홀더 유지
  }

  // (C) prd: 라이브 도구(PRD2TC)의 "PRD → 테스트케이스" 변환을 대표 예시 출력으로 보여줌.
  //     아래 행은 도구 사용 방식을 설명하기 위한 샘플(예시)이며, 실제 실행 결과가 아니다.
  function renderPrd(el) {
    const label = el.getAttribute('data-label') || '예시 출력';
    const rows = [
      ['TC-001', '로그인 성공 — 올바른 계정/비밀번호'],
      ['TC-002', '로그인 실패 — 비밀번호 오류 메시지'],
      ['TC-003', '방 입장 — 권한 있는 사용자'],
      ['TC-004', '증적 검색 — 키워드 필터 결과'],
    ];
    const tcs = rows
      .map(([id, t]) => `<div class="pd-tc"><span class="pd-id">${esc(id)}</span><span class="pd-t">${esc(t)}</span></div>`)
      .join('');
    el.classList.add('is-prd');
    el.innerHTML =
      `<div class="prd">
         <div class="pd-flow">
           <div class="pd-doc"><span class="pd-doc-h">PRD</span><span class="pd-line"></span><span class="pd-line"></span><span class="pd-line short"></span></div>
           <span class="pd-arrow" aria-hidden="true">→</span>
           <div class="pd-list">${tcs}</div>
         </div>
         <div class="pd-note">${esc(label)}</div>
       </div>`;
  }

  // (D) mockup: 실제 실행 영상이 아니라 "예시 프리뷰(데모)"임을 명확히 라벨링해 보여줌.
  //     공통 플로우(sharedFlow)를 모바일 화면 흐름의 예시 스트립으로 그린다.
  function renderMockup(el) {
    const label = el.getAttribute('data-label') || '예시 프리뷰 · 실제 시연 준비 중';
    const steps = (cfg.sharedFlow || '').split('→').map(s => s.trim()).filter(Boolean);
    const check =
      '<svg class="mk-ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const cells = steps
      .map((s, i) =>
        `<div class="mk-screen"><span class="mk-idx">${i + 1}</span><span class="mk-txt">${esc(s)}</span>${check}</div>`)
      .join('<span class="mk-arrow" aria-hidden="true">→</span>');
    el.classList.add('is-mockup');
    el.innerHTML =
      `<div class="mockup">
         <div class="mk-head"><span class="mk-tag">DEMO · 예시</span><span class="mk-dev">모바일 크롬 · UiAutomator2</span></div>
         <div class="mk-strip">${cells}</div>
         <div class="mk-note">${esc(label)}</div>
       </div>`;
  }

  // video: 파일이 있으면 <video>로 교체하고 클릭 없이 자동재생(muted+playsinline+play()).
  function renderVideo(el, src) {
    if (!src) return;
    fetch(src, { method: 'HEAD' })
      .then(r => {
        if (!r.ok) return;
        const v = document.createElement('video');
        v.muted = true; v.defaultMuted = true; v.loop = true;
        v.autoplay = true; v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        v.src = src;
        el.innerHTML = '';
        el.appendChild(v);
        const play = () => { const p = v.play(); if (p) p.catch(() => {}); };
        play();
        v.addEventListener('canplay', play, { once: true });
      })
      .catch(() => { /* 파일 없음 → 플레이스홀더 유지 */ });
  }

  // perf: 부하 테스트 결과(api-perf.json)를 간결한 판정 + 핵심 수치 + 그래프로 (영상 아님).
  function renderPerf(el, src) {
    if (!src) return;
    const label = el.getAttribute('data-label') || '성능·부하 테스트';
    fetch(src)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        el.classList.add('is-perf');
        const s = d.summary, L = s.latencyMs, ax = s.apdex || {};
        const pass = d.verdict === 'PASS';

        const verdict =
          `<div class="pverdict ${pass ? 'is-pass' : 'is-fail'}">` +
          `<span class="pv-badge">${pass ? 'PASS' : 'FAIL'}</span>` +
          `<span class="pv-sub">국제 표준(ISO/IEC 25010 · Apdex) 기준 ${pass ? '통과' : '미달'}</span></div>`;

        const tiles = [
          ['총 요청', s.totalRequests],
          ['체감 성능', (ax.score != null ? ax.score : '-') + (ax.rating ? ' ' + ax.rating : '')],
          ['성공률', (s.okRate * 100).toFixed(1) + '%'],
          ['응답 p95', L.p95 + 'ms'],
        ].map(([k, v]) => `<div class="ptile"><b>${esc(String(v))}</b><span>${esc(k)}</span></div>`).join('');

        // 기준별 통과/실패 (한 줄, 깔끔한 아이콘)
        const fmt = (v, unit) => unit === 'rate' ? (v * 100).toFixed(1) + '%' : unit === 'ms' ? v + 'ms' : String(v);
        const checks = (d.checks || []).map(c =>
          `<div class="pchk ${c.pass ? 'ok' : 'no'}">${icoMark(c.pass)}` +
          `<span class="pchk-n">${esc(c.name)}</span>` +
          `<span class="pchk-v">${esc(fmt(c.actual, c.unit))} <i>${esc(c.op)} ${esc(fmt(c.threshold, c.unit))}</i></span></div>`).join('');

        // 응답속도 분포 막대 (p50/p95/p99)
        const pcts = [['p50', L.p50], ['p95', L.p95], ['p99', L.p99]];
        const pmax = Math.max(...pcts.map(p => p[1])) || 1;
        const bars = pcts.map(([k, v]) =>
          `<div class="pbar"><span class="pbar-k">${k}</span>` +
          `<span class="pbar-track"><span class="pbar-fill" style="width:${(v / pmax * 100).toFixed(1)}%"></span></span>` +
          `<span class="pbar-v">${v}ms</span></div>`).join('');

        el.innerHTML =
          `<div class="perf">
             ${verdict}
             <div class="ptiles">${tiles}</div>
             <div class="pblock"><div class="pblock-h">합격 기준</div>${checks}</div>
             <div class="pblock"><div class="pblock-h">응답속도 분포 (ms · 낮을수록 빠름)</div>${bars}</div>
           </div>`;
      })
      .catch(() => { /* 파일 없음 → 플레이스홀더 유지 */ });
  }

  // 깔끔한 통과/실패 아이콘 (이모지 대신 인라인 SVG).
  function icoMark(pass) {
    return pass
      ? '<svg class="pico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg class="pico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  // HTML 이스케이프: config.js 의 문자열을 innerHTML 에 넣기 전 XSS/깨짐 방지.
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // 라이트/다크 테마 토글 (QASS 방식: data-theme + localStorage, 기본 라이트)
  function initTheme() {
    const KEY = 'portfolio-theme';
    const root = document.documentElement;
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const cur = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    btn.setAttribute('aria-pressed', cur() === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', () => {
      const next = cur() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
      try { localStorage.setItem(KEY, next); } catch (e) { /* 무시 */ }
    });
  }

  // (A) PC/모바일 강제 전환 토글 — 모바일에서 데스크탑 레이아웃을 미리 검증하기 위한 버튼.
  // 켜면 viewport content 를 width=1200 으로 바꿔 데스크탑 미디어쿼리를 발동시키고,
  // 끄면 원래 content(width=device-width …)로 정확히 원복한다. viewport 태그의 content 만 교체.
  function initViewportToggle() {
    const btn = document.getElementById('viewport-toggle');
    const meta = document.querySelector('meta[name="viewport"]');
    if (!btn || !meta) return;
    const MOBILE = meta.getAttribute('content'); // 원본 보존 (기본 width=device-width)
    const DESKTOP = 'width=1200';
    const label = btn.querySelector('.vt-label');
    let on = false;
    btn.addEventListener('click', () => {
      on = !on;
      meta.setAttribute('content', on ? DESKTOP : MOBILE);
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (label) label.textContent = on ? '모바일로 되돌리기' : 'PC 화면으로 보기';
    });
  }

  document.addEventListener('DOMContentLoaded', () => { render(); initTheme(); initViewportToggle(); });
})();
