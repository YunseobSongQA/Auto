/**
 * _worker.js — Cloudflare Pages 워커 (이 폴더가 배포 출력 폴더라서 Pages 가 자동으로 씁니다)
 *
 * 왜 필요한가: Cloudflare Pages 의 정적 파일은 Range 요청("이 영상의 0~1바이트만")을 무시하고
 * 늘 200 + 파일 전체로 답합니다. 아이폰 사파리(WebKit)는 영상을 Range 요청으로 받는데,
 * 206(부분 응답)이 오지 않으면 재생이 멈추거나 시작하지 않습니다. 그래서 영상(mp4·webm)의
 * Range 요청만 여기서 206 으로 잘라 주고, 나머지 요청은 정적 파일에 그대로 넘깁니다.
 * 이 워커가 도는 경로는 _routes.json 으로 /assets/* 에만 묶어 둡니다.
 *
 * 테스트: showcase-tests/tests/worker.test.mjs (잘라 주는 규칙), showcase.spec.js (실제 재생)
 */
const MEDIA = /\.(mp4|webm)$/i;

export default {
  async fetch(request, env) {
    if (!MEDIA.test(new URL(request.url).pathname)) return env.ASSETS.fetch(request);
    const range = request.headers.get('Range');
    if (!range || request.method !== 'GET') {
      // Range 없이 온 영상 요청에도 "구간 요청 가능(Accept-Ranges)"과 "전체 길이(Content-Length)"를
      // 알려야 한다. 둘 중 하나라도 없으면 사파리가 영상을 되감을 수 없는 것으로 보고, 다시 들어와
      // 처음으로 되감을 때(seek) 끝나지 않아 멈춘다. 길이를 확실히 남기려고 본문을 받아 다시 싼다.
      const res = await env.ASSETS.fetch(request);
      if (request.method !== 'GET' || res.status !== 200) return withRanges(res); // HEAD·304·404
      const body = await res.arrayBuffer();
      const out = new Headers(res.headers);
      out.set('Accept-Ranges', 'bytes');
      out.set('Content-Length', String(body.byteLength));
      return new Response(body, { status: 200, headers: out });
    }
    try {
      // Range 와 조건부 헤더를 뺀 요청으로 파일 전체를 받아, 원하는 구간만 잘라 준다 (영상은 2MB 안팎).
      // 조건부 헤더(If-None-Match 등)를 남기면 다시 들어온 요청에 304 가 나가는데, 영상 플레이어는
      // Range 요청에 206 을 기다리다 그대로 멈춘다 — 그래서 Range 요청에는 늘 206 으로 답한다.
      const headers = new Headers(request.headers);
      ['Range', 'If-Range', 'If-None-Match', 'If-Modified-Since', 'If-Match', 'If-Unmodified-Since']
        .forEach(h => headers.delete(h));
      const full = await env.ASSETS.fetch(new Request(request.url, { method: 'GET', headers }));
      if (full.status !== 200) return full; // 404 등은 그대로
      const body = await full.arrayBuffer();
      const part = sliceRange(range, body.byteLength);
      if (!part) return new Response(body, { status: 200, headers: full.headers }); // 해석 못 하는 Range → 전체
      if (part.unsatisfiable) {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${body.byteLength}` } });
      }
      const out = new Headers(full.headers);
      out.set('Content-Range', `bytes ${part.start}-${part.end}/${body.byteLength}`);
      out.set('Content-Length', String(part.end - part.start + 1));
      out.set('Accept-Ranges', 'bytes');
      return new Response(body.slice(part.start, part.end + 1), { status: 206, headers: out });
    } catch (e) {
      return env.ASSETS.fetch(request); // 무슨 일이 있어도 영상은 받을 수 있게
    }
  },
};

function withRanges(res) {
  const out = new Response(res.body, res); // 받은 응답의 헤더는 바꿀 수 없어 새 응답으로 옮긴다
  out.headers.set('Accept-Ranges', 'bytes');
  return out;
}

// "bytes=시작-끝" 한 구간만 해석한다. bytes=10- (끝까지), bytes=-500 (끝에서 500바이트)도 받는다.
// 여러 구간(bytes=0-1,5-9)처럼 해석 못 하는 값은 null → 호출한 쪽이 전체를 보낸다.
// (Workers 모듈에서 default 말고 다른 export 는 다른 용도로 읽힐 수 있어 내보내지 않는다)
function sliceRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start, end;
  if (m[1] === '') {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return { unsatisfiable: true };
  return { start, end };
}
