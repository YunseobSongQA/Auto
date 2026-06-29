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
    if (type === 'json') return renderJson(el, src);
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

  // json: FlowResult 를 fetch 해 "실제 응답 구조"를 코드블록으로 표시 (영상 아님)
  function renderJson(el, src) {
    if (!src) return;
    const label = el.getAttribute('data-label') || '실제 응답 구조';
    fetch(src)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => {
        el.classList.add('is-json');
        const meta = `${esc(data.tool)} · ${esc(data.status)} · ${data.steps.length} steps`;
        el.innerHTML =
          `<div class="json-demo">
             <div class="json-cap">${esc(label)}<span class="json-meta">${meta}</span></div>
             <pre><code>${esc(JSON.stringify(data, null, 2))}</code></pre>
           </div>`;
      })
      .catch(() => { /* 파일 없음 → 플레이스홀더 유지 */ });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', render);
})();
