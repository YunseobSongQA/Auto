#!/usr/bin/env bash
# record.sh — PC(Mac/Linux)에서 기기 화면을 녹화하며 Appium 테스트를 실행하고
#             ../web/assets/appium.webm 를 만듭니다. (Windows 는 README 의 안드로이드
#             스튜디오 GUI 녹화 방법을 쓰세요 — webm 으로 바로 저장됩니다.)
#
# 필요: adb(안드로이드 SDK), ffmpeg, 그리고 `adb devices` 에 기기 1대.
# 사용:  ./record.sh
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p artifacts ../web/assets
DEVICE_MP4=/sdcard/appium-demo.mp4

echo "▶ 기기 화면 녹화 시작"
adb shell screenrecord --bit-rate 4000000 --time-limit 180 "$DEVICE_MP4" &
REC_PID=$!
sleep 1

echo "▶ Appium 테스트 실행 (pytest)"
python -m pytest -s test_qass.py || echo "(테스트가 실패해도 녹화는 저장합니다)"

echo "▶ 녹화 종료"
adb shell pkill -INT screenrecord 2>/dev/null || true
wait "$REC_PID" 2>/dev/null || true
sleep 2

echo "▶ 영상 내려받기 + webm 변환"
adb pull "$DEVICE_MP4" artifacts/appium-demo.mp4
ffmpeg -y -loglevel error -i artifacts/appium-demo.mp4 \
  -c:v libvpx-vp9 -b:v 1M -an -pix_fmt yuv420p ../web/assets/appium.webm

echo "✓ 저장: web/assets/appium.webm"
echo "  이제 web/config.js 의 appium 카드만 pending→video 로 바꾸면 끝 (README 참고)."
