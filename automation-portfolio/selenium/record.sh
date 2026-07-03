#!/usr/bin/env bash
# record.sh — 헤드리스 환경(Codespaces)에서 Selenium 플로우를 녹화합니다.
#
# Selenium 은 video 녹화가 기본 제공되지 않으므로, 가상 디스플레이(Xvfb)에서
# 크롬을 headed 로 띄우고 그 화면을 ffmpeg x11grab 으로 캡처합니다.
# 산출물: ../web/assets/selenium.webm  (쇼케이스 카드가 가리키는 데모 영상)
#
# 필요: Xvfb, ffmpeg(x11grab), 크롬 바이너리(CHROME_BIN 또는 시스템 크롬)
#
# 사용:  CHROME_BIN=/path/to/chrome ./record.sh
set -euo pipefail
cd "$(dirname "$0")"

DISPLAY_NUM=":99"
SIZE="1280x800"
OUT="../web/assets/selenium.webm"
mkdir -p ../web/assets

# 크롬 바이너리: 인자 없으면 Playwright 가 설치한 chromium 을 재사용.
: "${CHROME_BIN:=$HOME/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome}"
export CHROME_BIN HEADED=1

cleanup() {
  [[ -n "${FF_PID:-}"  ]] && kill "$FF_PID"  2>/dev/null || true
  [[ -n "${XV_PID:-}" ]] && kill "$XV_PID" 2>/dev/null || true
}
trap cleanup EXIT

# 1) 가상 디스플레이
Xvfb "$DISPLAY_NUM" -screen 0 "${SIZE}x24" >/dev/null 2>&1 &
XV_PID=$!
export DISPLAY="$DISPLAY_NUM"
sleep 1

# 2) 화면 녹화 시작 (webm/VP9)
ffmpeg -y -loglevel error -f x11grab -video_size "$SIZE" -framerate 15 \
  -i "$DISPLAY_NUM" -c:v libvpx-vp9 -b:v 1M -pix_fmt yuv420p "$OUT" &
FF_PID=$!
sleep 1

# 3) 플로우 실행 (headed, 가상 디스플레이 안에서)
set +e
python run.py "${1:-google}"
RUN_RC=$?
set -e

# 4) 녹화 정리 (ffmpeg 에 q 보내 안전하게 마무리)
sleep 1
kill -INT "$FF_PID" 2>/dev/null || true
wait "$FF_PID" 2>/dev/null || true
FF_PID=""

# 5) 앞부분 검은 화면(Xvfb·크롬 시작) 제거 — 쇼케이스에 바로 화면이 보이게.
TRIM_SEC=3
if ffmpeg -y -loglevel error -ss "$TRIM_SEC" -i "$OUT" -c:v libvpx-vp9 -b:v 1M -an \
     -pix_fmt yuv420p "${OUT}.trim.webm" 2>/dev/null; then
  mv "${OUT}.trim.webm" "$OUT"
fi

echo "saved: $OUT (run.py rc=$RUN_RC)"
exit "$RUN_RC"
