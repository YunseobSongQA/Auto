'use strict';
/**
 * main.js — 로직/렌더 계층 (가끔 바뀜)
 * config.js(데이터)를 받아 index.html(UI) 위에 그립니다.
 * DOM 조작은 여기 한 곳. 순수 변환(buildCard)과 부수효과(render)를 나눕니다. (구축기 2번)
 */
(function () {
  const cfg = window.QASS_PORTFOLIO;

  // ── 순수 함수: 카드 데이터 → 슬라이드 HTML 문자열 (DOM/네트워크 없음) ─────────
  // 카드 한 장이 릴의 슬라이드 한 장이 됩니다. no 는 화면에 붙는 순번(1부터).
  // rv 는 슬라이드가 켜질 때 차례로 떠오르는 요소, --i 는 그 순서(지연)입니다.
  function buildCard(card, shared, no) {
    const statusClass = card.status === 'verified' ? 'st-done' : 'st-stub';
    const statusText = card.statusLabel || (card.status === 'verified' ? '검증완료' : 'PC에서 실행예정');
    // 알약 칩을 여러 줄로 깔면 카드가 시끄러워진다 → 가운뎃점으로 이은 한 줄.
    const points = card.points.map(p => `<li>${esc(p)}</li>`).join('<li aria-hidden="true">·</li>');
    const repoLabel = card.repoLabel || 'GitHub에서 코드 보기 ↗';
    // note: 선택 필드. 있으면 포인트 아래에 '제언' 블록으로 — 한계/다음 과제를 숨기지 않고 적는다.
    const note = card.note
      ? `<div class="note rv" style="--i:4"><span class="note-tag">${esc(card.note.label || '제언')}</span>` +
        `<p>${esc(card.note.text)}</p></div>`
      : '';
    // 슬라이드에는 id 대신 data-id 를 둔다. id 가 있으면 브라우저가 #주소를 보고 그 요소(릴 맨 위에
    // 겹쳐 있는 슬라이드)로 스스로 스크롤해 버려, 릴이 계산한 자리와 어긋난다.
    return `
      <section class="slide slide--tool" data-id="${esc(card.id)}" data-name="${esc(card.tool)}">
        <article class="card slide-inner" data-tool="${esc(card.id)}">
          <div class="card-top rv" style="--i:0">
            <span class="card-no">${String(no).padStart(2, '0')}</span>
            <span class="tool">${esc(card.tool)}</span>
            <span class="chip">${esc(card.badge)}</span>
          </div>
          <h2 class="rv" style="--i:1">${esc(card.title)}</h2>
          <p class="desc rv" style="--i:2">${esc(card.desc)}</p>

          <div class="demo rv" style="--i:2" data-demo="${esc(card.demo || '')}" data-type="${esc(card.demoType)}" data-label="${esc(card.demoLabel || '')}" data-poster="${esc(card.poster || '')}">
            <div class="demo-ph">${esc(card.demoLabel || '데모 준비 중')}<br><small>${esc(card.tool)} 실행 결과</small></div>
          </div>

          <ul class="points rv" style="--i:3">${points}</ul>
          ${note}

          <div class="card-foot rv" style="--i:5">
            <span class="status ${statusClass}">${icoMark(card.status === 'verified')}${statusText}</span>
            <a class="repo" href="${esc(card.repo)}" target="_blank" rel="noopener">${esc(repoLabel)}</a>
          </div>
        </article>
      </section>`;
  }

  // ── 부수효과: 화면에 반영 ──────────────────────────────────────────────────
  function render() {
    const fill = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    fill('shared-flow', cfg.sharedFlow);
    const link = document.getElementById('target-link');
    if (link) {
      link.href = cfg.sharedTarget.url;
      link.textContent = `${cfg.sharedTarget.name} 열기 ↗`;
    }

    // 첫 장(소개)은 index.html 에 있고, 도구 슬라이드를 그 뒤에 잇는다.
    const reel = document.getElementById('reel');
    reel.insertAdjacentHTML('beforeend',
      cfg.cards.map((c, i) => buildCard(c, cfg.sharedTarget, i + 1)).join(''));
    // '도구 둘러보기'는 카드 순서가 바뀌어도 첫 도구 슬라이드를 가리키게.
    const next = document.querySelector('[data-next]');
    if (next && cfg.cards[0]) next.setAttribute('href', '#' + cfg.cards[0].id);

    reel.querySelectorAll('.demo').forEach(renderDemo);
  }

  // 데모 타입에 따라 분기 (구축기 10번 · 조기 추상화 금지)
  function renderDemo(el) {
    const type = el.getAttribute('data-type');
    const src = el.getAttribute('data-demo');
    if (type === 'video') return renderVideo(el, src);
    if (type === 'perf') return renderPerf(el, src);
    if (type === 'mockup') return renderMockup(el);
    // 'pending' → 플레이스홀더 유지
  }

  // (D) mockup: 실제 실행 영상이 아니라 "예시 프리뷰(데모)"임을 명확히 라벨링하되,
  //     자동 재생으로 플로우 단계가 순서대로 진행되는 동적 프리뷰로 보여준다.
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
         <div class="mk-head"><span class="mk-tag">DEMO · 예시</span><span class="mk-dev">모바일 크롬 · UiAutomator2</span><span class="mk-live" aria-hidden="true"><i></i>자동 재생</span></div>
         <div class="mk-strip">${cells}</div>
         <div class="mk-bar" aria-hidden="true"><span class="mk-bar-fill"></span></div>
         <div class="mk-note">${esc(label)}</div>
       </div>`;

    // 동적 프리뷰: 단계별로 active/done 상태가 순서대로 이동 (자동 재생 · 무한 반복)
    const screens = el.querySelectorAll('.mk-screen');
    const fill = el.querySelector('.mk-bar-fill');
    if (!screens.length) return;
    let i = 0;
    const step = () => {
      screens.forEach((s, idx) => {
        s.classList.toggle('is-active', idx === i);
        s.classList.toggle('is-done', idx < i);
      });
      if (fill) fill.style.width = ((i + 1) / screens.length * 100).toFixed(0) + '%';
      i = (i + 1) % screens.length;
    };
    step();
    setInterval(step, 1100);
  }

  // video: 파일이 있으면 <video>로 교체하고 클릭 없이 자동재생(muted+playsinline+play()).
  // 모바일은 화면 밖이거나 로드 타이밍이 어긋나면 자동재생이 막혀 재생버튼이 뜨므로,
  // canplay·화면 노출(IntersectionObserver)·첫 사용자 제스처마다 play()를 재시도한다.
  // 릴에서는 슬라이드가 모두 같은 자리에 겹쳐 있어 "화면에 보임"으로 가릴 수 없다 → 켜진
  // 슬라이드의 영상만 틀고 나머지는 멈춘다(syncVideos). 그래서 autoplay 속성은 두지 않는다.
  // 코덱: MP4(H.264)를 첫 번째 <source>로 둔다. WebKit(아이폰)은 canPlayType('video/webm')에
  // "재생 가능"이라 답해 놓고 실제로는 VP9 디코딩을 못 해 멈추므로, webm을 앞에 두면
  // mp4 폴백이 영원히 발동하지 않는다. H.264는 전 브라우저 재생 가능 → mp4 우선.
  // webm은 폴백(2순위)으로 유지하고, 그래도 못 틀면 poster(실행 스크린샷)라도 보이게 한다.
  function renderVideo(el, src) {
    if (!src) return;
    fetch(src, { method: 'HEAD' })
      .then(r => {
        if (!r.ok) return;
        const v = document.createElement('video');
        v.muted = true; v.defaultMuted = true; v.loop = true;
        v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        v.setAttribute('loop', '');
        const poster = el.getAttribute('data-poster');
        if (poster) v.poster = poster;
        [['video/mp4', src.replace(/\.webm$/, '.mp4')], ['video/webm', src]].forEach(([type, s]) => {
          const source = document.createElement('source');
          source.src = s; source.type = type;
          v.appendChild(source);
        });
        el.innerHTML = '';
        el.appendChild(v);

        const sync = () => syncVideo(v);
        sync();
        v.addEventListener('canplay', sync, { once: true });
        v.addEventListener('loadeddata', sync, { once: true });

        // 스크롤로 화면에 들어오고 나갈 때마다 재생/정지 (릴이 꺼진 평소 문서에서 쓰임)
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(entries => {
            entries.forEach(e => { v.dataset.inview = e.isIntersecting ? '1' : '0'; });
            sync();
          }, { threshold: 0.25 }).observe(v);
        }
      })
      .catch(() => { /* 파일 없음 → 플레이스홀더 유지 */ });
  }

  // 지금 보여야 할 영상인가 — 릴에서는 켜진 슬라이드 안, 평소에는 화면 안.
  function syncVideo(v) {
    const want = document.documentElement.classList.contains('has-reel')
      ? !!v.closest('.slide.is-on')
      : v.dataset.inview !== '0';
    if (want) { const p = v.play(); if (p) p.catch(() => {}); }
    else if (!v.paused) v.pause();
  }
  function syncVideos() {
    document.querySelectorAll('.demo video').forEach(syncVideo);
  }

  // 자동재생이 끝내 막혔을 때, 사용자의 첫 터치/클릭/스크롤 한 번으로 보여야 할 영상을 재생.
  function initGestureFallback() {
    ['touchstart', 'click', 'scroll'].forEach(ev =>
      document.addEventListener(ev, syncVideos, { once: true, passive: true }));
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
             <details class="pblock"><summary>합격 기준 ${(d.checks || []).length}개 보기</summary>${checks}</details>
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

  // ── 릴: 화면은 고정해 두고, 스크롤 위치로 슬라이드를 바꿔 끼운다 ────────────────
  // 슬라이드는 모두 같은 자리에 sticky 로 겹쳐 두고, 릴 높이만큼 스크롤하는 동안 지금 위치에
  // 맞는 한 장만 켠다(.is-on). 켜고 끄는 연출(흐려짐·떠오름)은 styles.css 가 맡는다.
  // 화면보다 긴 슬라이드(모바일의 도구 카드 등)는 그 장에 머무는 동안 내용만 위로 밀어
  // 끝까지 읽히게 한다 — 안쪽 스크롤 상자를 두지 않아 손가락 스크롤이 꼬이지 않는다.
  // 동작 줄이기(prefers-reduced-motion)를 켠 사용자에게는 같은 마크업을 평범한 세로 문서로 보인다.
  const FLIP = 0.85; // 한 장을 넘기는 데 드는 스크롤 (화면 높이 배수)
  const HOLD = 0.08; // 경계에서 오르내려도 깜빡이지 않도록 더 넘겨야 바뀌는 여유 (화면 높이 배수)

  function initReel() {
    const root = document.documentElement;
    const reel = document.getElementById('reel');
    const rail = document.querySelector('[data-rail]');
    if (!reel) return;
    const slides = [...reel.children].filter(el => el.classList.contains('slide'));
    if (slides.length < 2) return;
    const inners = slides.map(s => s.querySelector('.slide-inner'));
    const ids = slides.map(s => s.dataset.id);
    const shift = slides.map(() => 0); // 슬라이드별로 지금 내용을 밀어 올린 거리(px)
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // 레일 눈금 — 슬라이드마다 하나. 모바일에서는 이름을 숨기므로 aria-label 로도 단다.
    const dots = slides.map((s, i) => {
      const name = s.dataset.name || `${i + 1}번째 화면`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rail-dot';
      b.setAttribute('aria-label', name);
      b.innerHTML = `<i aria-hidden="true"></i><span aria-hidden="true">${esc(name)}</span>`;
      b.addEventListener('click', () => goTo(i));
      if (rail) rail.appendChild(b);
      return b;
    });

    let on = false;  // 릴 모드인가
    let cur = -1;    // 켜진 슬라이드
    let top = 0;     // 문서 기준 릴 시작 위치
    let H = 0;       // 슬라이드(= 화면) 높이
    let marks = [];  // 슬라이드별 { b: 켜지는 지점, a: 내용이 제자리인 지점, o: 넘치는 길이 }
    let frame = 0, again = 0;

    // 스크롤 길이 배치 — 장마다 flip 만큼 넘기고, 넘치는 장은 넘치는 만큼(o) 더 머문다.
    // a(i) = a(i-1) + o(i-1) + flip, 켜지는 지점 b(i) 는 앞 장이 끝난 곳과 a(i) 의 한가운데.
    function measure() {
      H = slides[0].clientHeight || window.innerHeight;
      const cs = getComputedStyle(slides[0]);
      const room = H - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const flip = H * FLIP;
      let a = 0;
      marks = inners.map((el, i) => {
        if (i > 0) a += flip;
        const m = { a, b: i ? a - flip / 2 : -Infinity, o: Math.max(0, Math.ceil(el.offsetHeight - room)) };
        a += m.o;
        return m;
      });
      // 마지막 장도 반 장만큼 머문 뒤 릴이 끝나고 푸터가 올라온다.
      reel.style.height = Math.ceil(a + flip / 2 + H) + 'px';
      top = reel.getBoundingClientRect().top + window.scrollY;
    }

    // 스크롤 위치 → 켤 슬라이드. 경계에서 HOLD 만큼 더 넘겨야 바뀐다.
    function indexAt(p) {
      let g = 0;
      for (let i = 1; i < marks.length; i++) if (p >= marks[i].b) g = i;
      if (cur < 0 || g === cur) return g;
      const hold = H * HOLD;
      if (g > cur) return p >= marks[cur + 1].b + hold ? g : cur;
      return p < marks[cur].b - hold ? g : cur;
    }

    function show(i) {
      if (i === cur) return;
      cur = i;
      slides.forEach((s, k) => {
        s.classList.toggle('is-on', k === i);
        s.classList.toggle('is-past', k < i);
        s.inert = k !== i;
        s.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      });
      dots.forEach((d, k) => {
        d.classList.toggle('is-on', k === i);
        d.setAttribute('aria-current', k === i ? 'true' : 'false');
      });
      syncVideos();
      setHash(i);
    }

    // 지금 장을 주소(#id)에 남긴다. 사파리는 30초에 100번 넘게 부르면 예외를 던지므로 삼킨다.
    function setHash(i) {
      try { history.replaceState(null, '', '#' + ids[i]); } catch (e) { /* 무시 */ }
    }

    function update() {
      frame = 0;
      const p = window.scrollY - top;
      show(indexAt(p));
      marks.forEach((m, k) => {
        const y = Math.round(Math.min(Math.max(p - m.a, 0), m.o));
        if (y === shift[k]) return;
        shift[k] = y;
        inners[k].style.transform = y ? `translate3d(0, ${-y}px, 0)` : '';
      });
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

    // 크기가 바뀌면(창 크기·회전·글꼴 로드·성능표 로드) 다시 재고, 보던 장·읽던 위치를 지킨다.
    function relayout() {
      again = 0;
      if (!on) return;
      const keep = cur >= 0 ? { i: cur, d: window.scrollY - top - marks[cur].a } : null;
      measure();
      if (keep) {
        const m = marks[keep.i], flip = H * FLIP, hold = H * HOLD;
        const max = keep.i === slides.length - 1 ? Infinity : m.o + flip / 2 - hold;
        const y = Math.round(top + m.a + Math.min(Math.max(keep.d, -flip / 2 + hold), max));
        if (Math.abs(y - window.scrollY) > 1) window.scrollTo({ top: y, behavior: 'auto' });
      }
      update();
    }
    const relayoutSoon = () => { if (!again) again = requestAnimationFrame(relayout); };

    // 릴에서는 곧장 옮긴다 — 화면이 고정돼 있어 부드럽게 굴리면 사이 장들이 줄줄이 깜빡일 뿐이고,
    // 장이 바뀌는 연출은 CSS 전환이 맡는다. 평소 문서에서는 CSS 의 scroll-behavior 를 따른다.
    function goTo(i) {
      if (i < 0 || i >= slides.length) return;
      if (on) {
        window.scrollTo({ top: Math.round(top + marks[i].a), behavior: 'auto' });
      } else {
        slides[i].scrollIntoView({ block: 'start' });
        setHash(i);
      }
    }

    // 켜고 끄는 순간에는 전환을 멈춘다 — 안 그러면 겹친 슬라이드가 한꺼번에 비쳤다 사라진다.
    function still(fn) {
      root.classList.add('reel-still');
      fn();
      void reel.offsetHeight; // 바뀐 스타일을 전환 없이 먼저 반영
      root.classList.remove('reel-still');
    }

    function enable() {
      if (on) return;
      // 평범한 문서에서 보던 장을 기억해 릴에서도 그 장에서 시작한다.
      const at = slides.findIndex(s => s.getBoundingClientRect().bottom > window.innerHeight / 3);
      on = true;
      still(() => {
        root.classList.add('has-reel');
        cur = -1;
        measure();
        if (at > 0) window.scrollTo({ top: Math.round(top + marks[at].a), behavior: 'auto' });
        update();
      });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', relayoutSoon);
    }

    function disable() {
      if (!on) return;
      const at = cur;
      on = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', relayoutSoon);
      still(() => {
        root.classList.remove('has-reel');
        reel.style.height = '';
        slides.forEach((s, k) => {
          s.classList.remove('is-on', 'is-past');
          s.inert = false;
          s.removeAttribute('aria-hidden');
          inners[k].style.transform = '';
          shift[k] = 0;
        });
        dots.forEach(d => { d.classList.remove('is-on'); d.removeAttribute('aria-current'); });
        cur = -1;
      });
      if (at > 0) slides[at].scrollIntoView({ block: 'start' });
      syncVideos();
    }

    // 문서 안 #링크(워드마크·'도구 둘러보기')와 주소창의 #주소는 릴이 계산한 자리로 보낸다.
    const indexOfHash = hash => {
      try { return ids.indexOf(decodeURIComponent(hash.slice(1))); } catch (e) { return -1; }
    };
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      const i = a ? indexOfHash(a.getAttribute('href')) : -1;
      if (i < 0) return;
      e.preventDefault();
      goTo(i);
    });
    window.addEventListener('hashchange', () => goTo(indexOfHash(location.hash)));

    // 주소에 #도구 가 붙어 들어오면 전환 없이 그 장에서 바로 시작한다.
    // (릴을 켜는 순간 주소가 #top 으로 바뀌므로, 켜기 전에 먼저 읽어 둔다)
    const start = indexOfHash(location.hash);

    const onMotion = () => (motion.matches ? disable() : enable());
    if (motion.addEventListener) motion.addEventListener('change', onMotion);
    else if (motion.addListener) motion.addListener(onMotion);
    onMotion();

    if (start > 0) {
      if (on) still(() => { goTo(start); update(); });
      else goTo(start);
    }

    // 슬라이드 내용의 높이가 바뀌면 스크롤 배치를 다시 잰다.
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(relayoutSoon);
      inners.forEach(el => ro.observe(el));
    } else {
      window.addEventListener('load', relayoutSoon);
    }
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

  document.addEventListener('DOMContentLoaded', () => {
    render(); initReel(); initTheme(); initViewportToggle(); initGestureFallback();
  });
})();
