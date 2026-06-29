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
          <span class="target">🎯 ${esc(card.target)}</span>
          <span class="status ${statusClass}">${statusText}</span>
          <a class="repo" href="${esc(card.repo)}">코드 보기 →</a>
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

  // 데모 타입에 따라 딱 3가지로 분기 (구축기 10번 · 조기 추상화 금지)
  function renderDemo(el) {
    const type = el.getAttribute('data-type');
    const src = el.getAttribute('data-demo');
    if (type === 'video') return renderVideo(el, src);
    if (type === 'perf') return renderPerf(el, src);
    // 'pending' → 플레이스홀더 유지
  }

  // video: 파일이 실제로 있으면 <video>로 교체, 없으면 플레이스홀더 유지
  function renderVideo(el, src) {
    if (!src) return;
    fetch(src, { method: 'HEAD' })
      .then(r => {
        if (!r.ok) return;
        el.innerHTML =
          `<video src="${esc(src)}" muted loop autoplay playsinline></video>`;
      })
      .catch(() => { /* 파일 없음 → 플레이스홀더 유지 */ });
  }

  // perf: 부하 테스트 결과(api-perf.json)를 수치 타일 + 그래프로 (영상 아님)
  function renderPerf(el, src) {
    if (!src) return;
    const label = el.getAttribute('data-label') || '성능·부하 테스트';
    fetch(src)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        el.classList.add('is-perf');
        const s = d.summary, L = s.latencyMs;
        const pass = d.verdict === 'PASS';

        // 종합 판정 배지 + 무엇을/왜/어떻게
        const verdict =
          `<div class="pverdict ${pass ? 'is-pass' : 'is-fail'}">` +
          `<span class="pv-badge">${pass ? '✓ PASS' : '✗ FAIL'}</span>` +
          `<span class="pv-sub">공인 표준 기준 종합 판정</span></div>`;

        // 판정 근거가 된 공인 표준 (객관성 노출)
        const standards = (d.standards || []).length
          ? `<div class="pstd"><span class="pstd-h">근거 표준</span>` +
            d.standards.map(st => `<span class="pstd-chip" title="${esc(st.desc)}">${esc(st.id)}</span>`).join('') +
            `</div>`
          : '';
        const www = (d.what || d.why || d.how)
          ? `<dl class="pwww">` +
            (d.what ? `<dt>무엇을</dt><dd>${esc(d.what)}</dd>` : '') +
            (d.why ? `<dt>왜</dt><dd>${esc(d.why)}</dd>` : '') +
            (d.how ? `<dt>어떻게</dt><dd>${esc(d.how)}</dd>` : '') +
            `</dl>`
          : '';

        // 기준별 통과/실패 (actual vs threshold) + 표준 출처
        const fmt = (v, unit) => unit === 'rate' ? (v * 100).toFixed(2) + '%' : unit === 'ms' ? v + 'ms' : String(v);
        const checks = (d.checks || []).map(c =>
          `<div class="pchk ${c.pass ? 'ok' : 'no'}">` +
          `<div class="pchk-row"><span class="pchk-m">${c.pass ? '✓' : '✗'}</span>` +
          `<span class="pchk-n">${esc(c.name)}</span>` +
          `<span class="pchk-v">${esc(fmt(c.actual, c.unit))} <i>${esc(c.op)} ${esc(fmt(c.threshold, c.unit))}</i></span></div>` +
          (c.standard ? `<div class="pchk-std">근거: ${esc(c.standard)}</div>` : '') +
          `</div>`).join('');

        const ax = s.apdex || {};
        const tiles = [
          ['총 요청', s.totalRequests],
          ['Apdex', (ax.score != null ? ax.score : '-') + (ax.rating ? ' ' + ax.rating : '')],
          ['성공률', (s.okRate * 100).toFixed(2) + '%'],
          ['p95 지연', L.p95 + 'ms'],
          ['처리량', s.rps + ' req/s'],
        ].map(([k, v]) => `<div class="ptile"><b>${esc(String(v))}</b><span>${esc(k)}</span></div>`).join('');

        // 지연 분포 막대 (수치+그래프)
        const pcts = [['p50', L.p50], ['p90', L.p90], ['p95', L.p95], ['p99', L.p99], ['max', L.max]];
        const pmax = Math.max(...pcts.map(p => p[1])) || 1;
        const bars = pcts.map(([k, v]) =>
          `<div class="pbar"><span class="pbar-k">${k}</span>` +
          `<span class="pbar-track"><span class="pbar-fill" style="width:${(v / pmax * 100).toFixed(1)}%"></span></span>` +
          `<span class="pbar-v">${v}ms</span></div>`).join('');

        // 엔드포인트별 지연 추이 스파크라인
        const eps = d.endpoints.map(ep =>
          `<div class="pep"><div class="pep-top"><code>${esc(ep.name)}</code>` +
          `<span>p50 ${ep.latencyMs.p50} · p95 ${ep.latencyMs.p95}ms</span></div>${sparkline(ep.series)}</div>`).join('');

        el.innerHTML =
          `<div class="perf">
             <div class="perf-cap">${esc(label)}<span class="perf-run">${esc(d.runner)}</span></div>
             ${verdict}
             ${standards}
             ${www}
             <div class="pblock"><div class="pblock-h">검증 기준 (SLO) · 항목별 판정</div>${checks}</div>
             <div class="ptiles">${tiles}</div>
             <div class="pblock"><div class="pblock-h">지연 분포 (ms)</div>${bars}</div>
             <div class="pblock"><div class="pblock-h">엔드포인트별 지연 추이</div>${eps}</div>
           </div>`;
      })
      .catch(() => { /* 파일 없음 → 플레이스홀더 유지 */ });
  }

  // 작은 라인 그래프(SVG). series(ms 배열)를 viewBox 0..100 × 0..28 로 정규화.
  function sparkline(series) {
    if (!series || series.length < 2) return '';
    const w = 100, h = 28, max = Math.max(...series), min = Math.min(...series), span = (max - min) || 1;
    const pts = series.map((v, i) =>
      `${(i / (series.length - 1) * w).toFixed(1)},${(h - (v - min) / span * (h - 2) - 1).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">` +
      `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', render);
})();
