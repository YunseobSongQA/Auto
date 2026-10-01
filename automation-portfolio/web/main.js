'use strict';
/**
 * main.js — 로직/렌더 계층 (가끔 바뀜)
 * config.js(데이터)를 받아 index.html(UI) 위에 그립니다.
 * DOM 조작은 여기 한 곳. 순수 변환(buildCard)과 부수효과(render)를 나눕니다. (구축기 2번)
 */
(function () {
  const cfg = window.QASS_PORTFOLIO;

  // ── 순수 함수: 데이터 → HTML 문자열 (DOM/네트워크 없음) ───────────────────────
  const pad = n => String(n).padStart(2, '0');

  // 실무 적용 시간: config 에는 '2시간' · '5분' · '10초'처럼 적고, 단축률은 여기서 초로 바꿔 계산한다.
  const SEC = { 시간: 3600, 분: 60, 초: 1 };
  function toSec(t) {
    const m = /^(\d+(?:\.\d+)?)(시간|분|초)$/.exec(String(t).trim());
    return m ? Number(m[1]) * SEC[m[2]] : NaN;
  }
  // 단축률(%) — 시간을 읽지 못하면 null 이고, 그때는 단축률 없이 그린다.
  function savingRate(s) {
    const before = toSec(s.before), after = toSec(s.after);
    return before > 0 && after >= 0 ? Math.round((before - after) / before * 100) : null;
  }

  // 카드 제목 아래 핵심 수치 — 단축 시간(saving: 2시간 → 1시간, 50% 단축) 또는 다른 수치(stat: 성공률 100%).
  function buildKpi(card, i) {
    let num, what, label;
    if (card.saving) {
      const s = card.saving, rate = savingRate(s);
      num = `<span>${esc(s.before)}</span><i>→</i><b>${esc(s.after)}</b>` + (rate == null ? '' : `<em>${rate}% 단축</em>`);
      what = `${s.what} 기준`;
      label = `${s.what}: 기존 ${s.before}, 적용 후 ${s.after}` + (rate == null ? '' : `, ${rate}% 단축`);
    } else if (card.stat) {
      const t = card.stat;
      num = `<span>${esc(t.label)}</span><b>${esc(t.value)}</b>`;
      what = t.sub;
      label = `${t.label} ${t.value}, ${t.sub}`;
    } else {
      return '';
    }
    return `
          <div class="saving rv" style="--i:${i}" role="group" aria-label="${esc(label)}">
            <p class="saving-num" aria-hidden="true">${num}</p>
            <p class="saving-what" aria-hidden="true">${esc(what)}</p>
          </div>`;
  }

  // 사양 — [이름, 내용] 줄(언어 · 환경 · 대상 등). 사실만 짧게.
  function buildSpecs(specs, i) {
    if (!specs || !specs.length) return '';
    const rows = specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    return `
          <dl class="specs rv" style="--i:${i}">${rows}</dl>`;
  }

  // 비교표 — 열은 도구, 행은 장점·단점. 첫 열(구분)은 위 사양 목록의 이름 칸과 폭을 맞춘다.
  function buildVs(vs, i) {
    if (!vs) return '';
    const head = `<tr><th scope="col"><span class="sr">구분</span></th>` +
      vs.head.map(h => `<th scope="col">${esc(h)}</th>`).join('') + '</tr>';
    const body = vs.rows.map(([name, ...cells]) =>
      `<tr><th scope="row">${esc(name)}</th>${cells.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    return `
          <div class="vs rv" style="--i:${i}">
            <p class="vs-title">${esc(vs.title)}</p>
            <table class="vs-tbl"><thead>${head}</thead><tbody>${body}</tbody></table>
          </div>`;
  }

  // 카드 한 장이 릴의 슬라이드 한 장이 됩니다. no 는 화면에 붙는 순번(1부터).
  // rv 는 슬라이드가 켜질 때 차례로 떠오르는 요소, --i 는 그 순서(지연)입니다.
  function buildCard(card, no) {
    const statusClass = card.status === 'verified' ? 'st-done' : 'st-stub';
    const statusText = card.statusLabel || (card.status === 'verified' ? '검증 완료' : 'PC에서 실행 예정');
    const repoLabel = card.repoLabel || 'GitHub에서 코드 보기 ↗';
    // 슬라이드에는 id 대신 data-id 를 둔다. id 가 있으면 브라우저가 #주소를 보고 그 요소(릴 맨 위에
    // 겹쳐 있는 슬라이드)로 스스로 스크롤해 버려, 릴이 계산한 자리와 어긋난다.
    return `
      <section class="slide slide--tool" data-id="${esc(card.id)}" data-name="${esc(card.tool)}">
        <article class="card slide-inner" data-tool="${esc(card.id)}">
          <div class="card-top rv" style="--i:0">
            <span class="card-no">${pad(no)}</span>
            <span class="tool">${esc(card.tool)}</span>
            <span class="chip">${esc(card.badge)}</span>
          </div>
          <h2 class="rv" style="--i:1">${esc(card.title)}</h2>
          ${buildKpi(card, 2)}
          <p class="desc rv" style="--i:3">${esc(card.desc)}</p>

          <!-- 데모는 차례 연출(rv)에서 뺀다 — 장이 켜지는 순간 영상이 바로 보이도록 -->
          <div class="demo" data-demo="${esc(card.demo || '')}" data-type="${esc(card.demoType)}" data-label="${esc(card.demoLabel || '')}" data-poster="${esc(card.poster || '')}">
            <div class="demo-ph">${esc(card.demoLabel || '데모 준비 중')}<br><small>${esc(card.tool)} 실행 결과</small></div>
          </div>
          ${buildSpecs(card.specs, 4)}${buildVs(card.vs, 5)}

          <div class="card-foot rv" style="--i:6">
            <span class="status ${statusClass}">${icoMark(card.status === 'verified')}${statusText}</span>
            <a class="repo" href="${esc(card.repo)}" target="_blank" rel="noopener">${esc(repoLabel)}</a>
          </div>
        </article>
      </section>`;
  }

  // 첫 화면 '요약' — 도구마다 한 줄(이름 · 한 줄 소개 · 핵심 수치), 누르면 그 장으로.
  function buildIndex(cards, plan) {
    const rows = cards.map((c, i) => indexRow(c.id, i + 1, c.tool, c.short || '', indexMetric(c)));
    if (plan) rows.push(indexRow(plan.id, cards.length + 1, plan.name, plan.title, ''));
    return rows.join('');
  }
  // 단축 시간은 "2시간 → 1시간 · 50% 단축", 다른 수치는 "성공률 · 100%"
  function indexMetric(c) {
    if (c.saving) {
      const rate = savingRate(c.saving);
      return `<span class="ix-time">${esc(c.saving.before)} → ${esc(c.saving.after)}</span>` +
        (rate == null ? '' : `<b>${rate}% 단축</b>`);
    }
    if (c.stat) return `<span class="ix-time">${esc(c.stat.label)}</span><b>${esc(c.stat.value)}</b>`;
    return '';
  }
  function indexRow(id, no, name, short, metricHtml) {
    return `<li><a href="#${esc(id)}"><span class="ix-no">${pad(no)}</span>` +
      `<span class="ix-tool">${esc(name)}</span><span class="ix-short">${esc(short)}</span>` +
      `<span class="ix-metric">${metricHtml}</span></a></li>`;
  }

  // 마지막 장 — 도구별 효과 · 한계 · 개선 방향 (제언). 칸마다 짧은 한 줄.
  // 효과 칸의 수치는 from 카드의 saving(단축률) · stat 에서 가져온다 — 수치는 카드 한 곳에서만 고친다.
  function buildPlan(p, no, cards) {
    const effect = row => {
      const c = cards.find(x => x.id === row.from);
      if (c && c.saving) {
        const rate = savingRate(c.saving);
        return (rate == null ? '' : `<p class="plan-metric"><b>${rate}%</b> 단축</p>`) +
          `<p class="plan-sub">${esc(c.saving.before)} → ${esc(c.saving.after)}</p>`;
      }
      if (c && c.stat) {
        return `<p class="plan-metric">${esc(c.stat.label)} <b>${esc(c.stat.value)}</b></p>` +
          `<p class="plan-sub">${esc(c.stat.sub)}</p>`;
      }
      return '';
    };
    // role 은 좁은 화면용 — styles.css 가 표를 칸 대신 도구별 묶음으로 쌓아도 스크린리더가 표로 읽게 한다.
    // data-label 은 그 묶음에서 칸 이름(효과 등)을 값 앞에 붙이는 데 쓴다.
    const [cEffect, cLimit, cNext] = p.columns;
    const head = `<tr role="row"><th scope="col" role="columnheader"><span class="sr">도구</span></th>` +
      p.columns.map(c => `<th scope="col" role="columnheader">${esc(c)}</th>`).join('') + '</tr>';
    const body = p.rows.map(r => `
                <tr role="row">
                  <th scope="row" role="rowheader"><b>${esc(r.name)}</b><span>${esc(r.sub)}</span></th>
                  <td role="cell" data-label="${esc(cEffect)}">${effect(r)}</td>
                  <td role="cell" data-label="${esc(cLimit)}"><p>${esc(r.limit)}</p></td>
                  <td role="cell" data-label="${esc(cNext)}"><p>${esc(r.next)}</p></td>
                </tr>`).join('');
    return `
      <section class="slide slide--plan" data-id="${esc(p.id)}" data-name="${esc(p.name)}">
        <div class="plan slide-inner">
          <div class="card-top rv" style="--i:0">
            <span class="card-no">${pad(no)}</span>
            <span class="tool">${esc(p.name)}</span>
            ${p.badge ? `<span class="chip">${esc(p.badge)}</span>` : ''}
          </div>
          <h2 class="rv" style="--i:1">${esc(p.title)}</h2>
          ${p.desc ? `<p class="desc rv" style="--i:2">${esc(p.desc)}</p>` : ''}
          <div class="plan-box rv" style="--i:3">
            <table class="plan-tbl" role="table">
              <thead role="rowgroup">${head}</thead>
              <tbody role="rowgroup">${body}
              </tbody>
            </table>
          </div>
          ${p.note ? `<p class="plan-note rv" style="--i:4">${esc(p.note)}</p>` : ''}
        </div>
      </section>`;
  }

  // ── 부수효과: 화면에 반영 ──────────────────────────────────────────────────
  function render() {
    // 첫 장(소개)은 index.html 에 있고, 도구 슬라이드와 제언 장을 그 뒤에 잇는다.
    const reel = document.getElementById('reel');
    reel.insertAdjacentHTML('beforeend',
      cfg.cards.map((c, i) => buildCard(c, i + 1)).join('') +
      (cfg.plan ? buildPlan(cfg.plan, cfg.cards.length + 1, cfg.cards) : ''));
    // '도구 둘러보기'는 카드 순서가 바뀌어도 첫 도구 슬라이드를 가리키게.
    const next = document.querySelector('[data-next]');
    if (next && cfg.cards[0]) next.setAttribute('href', '#' + cfg.cards[0].id);
    const index = document.querySelector('[data-index]');
    if (index) index.innerHTML = buildIndex(cfg.cards, cfg.plan);

    reel.querySelectorAll('.demo').forEach(renderDemo);
  }

  // 데모 타입에 따라 분기 (구축기 10번 · 조기 추상화 금지)
  function renderDemo(el) {
    const type = el.getAttribute('data-type');
    const src = el.getAttribute('data-demo');
    if (type === 'video') return renderVideo(el, src);
    if (type === 'perf') return renderPerf(el, src);
    // 'pending' → 플레이스홀더 유지
  }

  // video: <video> 를 렌더 즉시 만든다 — 파일 확인(HEAD)을 한 번 더 기다리지 않는다. 파일이 없으면
  // 마지막 <source> 의 error 로 알아채 플레이스홀더로 되돌린다.
  // 포스터는 영상의 첫 프레임(config.js poster) — 데이터가 오기 전에도 같은 화면이 바로 보이고,
  // 재생이 시작되면 그 화면에서 그대로 이어진다.
  // 재생 규칙: 릴에서는 켜진 슬라이드의 영상만, 평소 문서에서는 화면에 보이는 영상만 튼다(syncVideo).
  // 슬라이드가 모두 같은 자리에 겹쳐 있어 "화면에 보임"으로는 가릴 수 없어 autoplay 속성은 두지 않는다.
  // 코덱: MP4(H.264)를 첫 번째 <source>로 둔다. WebKit(아이폰)은 canPlayType('video/webm')에
  // "재생 가능"이라 답해 놓고 실제로는 VP9 디코딩을 못 해 멈추므로, webm을 앞에 두면
  // mp4 폴백이 영원히 발동하지 않는다. H.264는 전 브라우저 재생 가능 → mp4 우선.
  // webm은 폴백(2순위)으로 유지한다.
  function renderVideo(el, src) {
    if (!src) return;
    const placeholder = el.innerHTML;
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true;
    v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.setAttribute('loop', '');
    const poster = el.getAttribute('data-poster');
    if (poster) v.poster = poster;
    const sources = [['video/mp4', src.replace(/\.webm$/, '.mp4')], ['video/webm', src]].map(([type, s]) => {
      const source = document.createElement('source');
      source.src = s; source.type = type;
      v.appendChild(source);
      return source;
    });
    // 마지막 소스까지 실패 = 틀 수 있는 파일이 없음 → 플레이스홀더로
    sources[sources.length - 1].addEventListener('error', () => {
      el.classList.remove('is-blocked');
      el.innerHTML = placeholder;
    });
    el.innerHTML = '';
    el.appendChild(v);

    // 데이터가 늦게 와도 받는 즉시 다시 맞춘다 (once 아님 — 끊겼다 이어져도 다시 시도)
    const sync = () => syncVideo(v);
    v.addEventListener('loadeddata', sync);
    v.addEventListener('canplay', sync);
    v.addEventListener('playing', () => { unlocked.add(v); el.classList.remove('is-blocked'); });

    // 평소 문서(릴 꺼짐)에서는 화면에 들어오고 나갈 때마다 재생/정지. 첫 재생 판단도 여기서 —
    // 렌더 직후엔 릴이 아직 안 켜져 있어 바로 sync 하면 모든 영상이 한꺼번에 틀어졌다 멈춘다.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        entries.forEach(e => { v.dataset.inview = e.isIntersecting ? '1' : '0'; });
        sync();
      }, { threshold: 0.25 }).observe(v);
    }
  }

  // 지금 보여야 할 영상인가 — 릴에서는 켜진 슬라이드 안, 평소에는 화면 안.
  function wantsPlay(v) {
    return document.documentElement.classList.contains('has-reel')
      ? !!v.closest('.slide.is-on')
      : v.dataset.inview !== '0';
  }

  // 보여야 하면 틀고, 아니면 멈춘다. 브라우저가 재생을 막으면(NotAllowedError — 아이폰 저전력
  // 모드 등) 데모 위에 재생 버튼을 띄워 한 번 눌러 달라고 알린다(.is-blocked).
  // 사파리는 숨겨진 동안 받은 play() 를 "재생 중(paused=false)"이라 해 놓고 시간이 멈춘 채로
  // 두기도 한다(보인 뒤에도 안 풀림). 재생 위치가 0.2초 넘게 그대로면 멈췄다 다시 틀어 깨운다.
  // seen: 영상별로 지금 위치를 처음 본 시각 — 위치가 바뀌면 새로 적는다.
  const seen = new WeakMap();
  // 한 번이라도 실제로 재생된 영상 — 잠금 해제(initVideoUnlock)를 다시 할 필요가 없다.
  const unlocked = new WeakSet();
  function syncVideo(v) {
    if (!wantsPlay(v)) { if (!v.paused) v.pause(); return; }
    const now = performance.now();
    if (!v.paused) {
      const last = seen.get(v);
      if (!last || v.currentTime !== last.t) { seen.set(v, { t: v.currentTime, at: now }); return; }
      if (v.readyState < 3 || now - last.at < 200) return; // 데이터를 기다리는 중이거나 아직 이르다
      v.pause();
    }
    seen.delete(v);
    const box = v.closest('.demo');
    const p = v.play();
    if (p) p.catch(err => { if (err && err.name === 'NotAllowedError' && box) box.classList.add('is-blocked'); });
  }
  function syncVideos() {
    document.querySelectorAll('.demo video').forEach(syncVideo);
  }

  // 슬라이드가 막 켜졌을 때: play() 는 그 장이 실제로 화면에 그려진 뒤(두 프레임 뒤)에 부르고,
  // 시간을 두고 몇 번 더 맞춘다(멈춘 채 남은 재생도 이때 깨운다). 사파리는 아직 숨겨진
  // (visibility:hidden) 영상의 재생을 받아 놓고 멈춰 두기도 해서, 보인 뒤에 다시 봐야 확실하다.
  let retries = [];
  function playSoon() {
    retries.forEach(clearTimeout);
    requestAnimationFrame(() => requestAnimationFrame(syncVideos));
    retries = [120, 260, 500, 900, 2000, 3500].map(ms => setTimeout(syncVideos, ms));
  }

  // 장이 바뀔 때: 떠난 장의 영상은 바로 멈추고, 들어온 장의 영상은 처음부터 다시 튼다.
  // 이미 처음 위치면 되감지 않는다 — 재생 직전에 쓸데없는 seek 이 끼면 사파리가 멈추기도 한다.
  function enterVideos(slide) {
    document.querySelectorAll('.demo video').forEach(v => {
      if (!slide.contains(v)) { if (!v.paused) v.pause(); return; }
      seen.delete(v);
      if (v.currentTime > 0.05) { try { v.currentTime = 0; } catch (e) { /* 아직 데이터 없음 */ } }
    });
    playSoon();
  }

  // 아이폰은 사용자가 한 번 건드리기 전까지 영상을 미리 받지 않고, 저전력 모드에서는 재생까지
  // 막는다. 제스처 안에서 play() 를 한 번 받은 영상은 이 제한이 풀리므로, 탭(click)·키 입력 때
  // 아직 안 풀린 숨은 영상을 한 번씩 틀었다가 곧 멈춰 둔다(잠금 해제). 그 뒤로는 장을 넘길 때
  // 바로 재생된다. 재생에 성공한 영상만 풀린 것으로 치므로, 제스처로 인정되지 않는 입력
  // (Shift 같은 키)이 먼저 와도 다음 입력에서 다시 시도한다.
  // pointerup·touchend 는 쓰지 않는다 — 레일을 누른 탭에서 click 보다 먼저 와, 화면을 옮기기도
  // 전에 곧 켜질 장의 영상까지 숨긴 채로 틀어 버린다(사파리는 그 재생을 멈춘 채로 붙잡는다).
  function initVideoUnlock() {
    const onGesture = () => {
      // 레일을 누른 탭이면 스크롤은 이미 옮겨졌다 — 켤 장부터 맞춰 두고 판단한다
      const before = document.querySelector('.slide.is-on');
      syncReel();
      const moved = document.querySelector('.slide.is-on') !== before;
      document.querySelectorAll('.demo video').forEach(v => {
        if (unlocked.has(v) || wantsPlay(v) || !v.paused) return;
        const p = v.play();
        if (!p) return;
        // 멈추는 건 두 프레임 뒤 — 해제용으로 막 튼 영상을 같은 순간 멈추면 사파리가 그 영상을
        // 멈춘 채로 붙잡아, 나중에 그 장에 들어가도 바로 돌지 않는다.
        p.then(() => {
          unlocked.add(v);
          requestAnimationFrame(() => requestAnimationFrame(() => syncVideo(v)));
        }, () => { /* 제스처로 인정되지 않음 → 다음 입력에서 다시 */ });
      });
      // 장이 그대로면 지금 보여야 할 영상을 이 제스처로 튼다(막힌 재생 풀기). 장이 막 바뀌었으면
      // 그 장이 화면에 그려진 뒤 enterVideos 가 튼다 — 숨김이 덜 풀린 채 틀면 사파리가 멈춘다.
      if (!moved) document.querySelectorAll('.demo video').forEach(v => { if (wantsPlay(v)) syncVideo(v); });
    };
    ['click', 'keydown'].forEach(ev => document.addEventListener(ev, onGesture, { passive: true }));
    // 다른 탭에 다녀오면 멈춰 있던 영상을 다시 맞춘다
    document.addEventListener('visibilitychange', () => { if (!document.hidden) playSoon(); });
  }

  // perf: 부하 테스트 결과(api-perf.json)를 간결한 판정 + 핵심 수치 + 그래프로 (영상 아님).
  function renderPerf(el, src) {
    if (!src) return;
    fetch(src)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        el.classList.add('is-perf');
        const s = d.summary, L = s.latencyMs, ax = s.apdex || {};
        const pass = d.verdict === 'PASS';
        const nChecks = (d.checks || []).length, nPass = (d.checks || []).filter(c => c.pass).length;

        // 합격선(p95 300ms 이하 등)은 직접 정한 목표 수치다. 표준(ISO/IEC 25010·Apdex)은 "무엇을 잴지"
        // 고르는 데 썼을 뿐 합격선을 정해 주지 않으므로, "국제 표준 기준 통과"라고 쓰지 않는다.
        const verdict =
          `<div class="pverdict ${pass ? 'is-pass' : 'is-fail'}">` +
          `<span class="pv-badge">${pass ? 'PASS' : 'FAIL'}</span>` +
          `<span class="pv-sub">${pass ? `목표 기준 ${nChecks}개 모두 충족` : `목표 기준 ${nChecks - nPass}개 미달`}</span></div>`;

        // 수치는 짧게: 1,000 · 100% · 171ms · 0.98 (소수점 아래 0 은 떼어 낸다)
        const pct = v => +(v * 100).toFixed(1) + '%';
        const tiles = [
          ['요청 수', s.totalRequests.toLocaleString('en-US')],
          ['성공률', pct(s.okRate)],
          ['95% 응답', L.p95 + 'ms'],
          ['Apdex 점수', ax.score != null ? ax.score : '-'],
        ].map(([k, v]) => `<div class="ptile"><b>${esc(String(v))}</b><span>${esc(k)}</span></div>`).join('');

        // 기준별 통과/실패 (한 줄, 깔끔한 아이콘)
        const fmt = (v, unit) => unit === 'rate' ? pct(v) : unit === 'ms' ? v + 'ms' : String(v);
        const checks = (d.checks || []).map(c =>
          `<div class="pchk ${c.pass ? 'ok' : 'no'}">${icoMark(c.pass)}` +
          `<span class="pchk-n">${esc(c.name)}</span>` +
          `<span class="pchk-v">${esc(fmt(c.actual, c.unit))} <i>${esc(c.op)} ${esc(fmt(c.threshold, c.unit))}</i></span></div>`).join('');

        // 응답 시간 분포 막대 — 요청의 50%·95%·99%가 이 시간 안에 응답 (p50/p95/p99 를 쉬운 말로)
        const pcts = [['50%', L.p50], ['95%', L.p95], ['99%', L.p99]];
        const pmax = Math.max(...pcts.map(p => p[1])) || 1;
        const bars = pcts.map(([k, v]) =>
          `<div class="pbar"><span class="pbar-k">${k}</span>` +
          `<span class="pbar-track"><span class="pbar-fill" style="width:${(v / pmax * 100).toFixed(1)}%"></span></span>` +
          `<span class="pbar-v">${v}ms</span></div>`).join('');

        el.innerHTML =
          `<div class="perf">
             ${verdict}
             <div class="ptiles">${tiles}</div>
             <details class="pblock"><summary>판정 기준 ${nChecks}개</summary>${checks}</details>
             <div class="pblock"><div class="pblock-h">요청 비율별 응답 시간 (ms)</div>${bars}</div>
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
  // 지금 스크롤 위치로 켤 장을 곧바로 맞춘다 — 다음 프레임을 기다리지 않아야 할 때(탭 처리) 쓴다.
  // initReel 이 채운다.
  let syncReel = () => {};

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
      enterVideos(slides[i]);
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
    syncReel = () => { if (on) update(); };

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
    render(); initReel(); initTheme(); initViewportToggle(); initVideoUnlock();
  });
})();
