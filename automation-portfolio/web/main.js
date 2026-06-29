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
    const statusClass = card.status === 'done' ? 'st-done' : 'st-stub';
    const statusText = card.status === 'done' ? '구현 완료' : '골격(stub)';
    const points = card.points.map(p => `<li>${esc(p)}</li>`).join('');
    return `
      <article class="card" data-tool="${esc(card.id)}">
        <div class="card-top">
          <span class="tool">${esc(card.tool)}</span>
          <span class="chip">${esc(card.badge)}</span>
        </div>
        <h2>${esc(card.title)}</h2>
        <p class="desc">${esc(card.desc)}</p>

        <div class="demo" data-demo="${esc(card.demo)}">
          <div class="demo-ph">데모 영상 자리<br><small>${esc(card.tool)} 실행 결과</small></div>
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

    grid.querySelectorAll('.demo').forEach(probeDemo);
  }

  // 데모 파일이 실제로 있으면 <video>로 교체, 없으면 플레이스홀더 유지
  function probeDemo(el) {
    const src = el.getAttribute('data-demo');
    if (!src) return;
    fetch(src, { method: 'HEAD' })
      .then(r => {
        if (!r.ok) return;
        el.innerHTML =
          `<video src="${esc(src)}" muted loop autoplay playsinline></video>`;
      })
      .catch(() => { /* 파일 없음 → 플레이스홀더 유지 */ });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', render);
})();
