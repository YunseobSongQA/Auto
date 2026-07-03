"""run.py — Appium standalone 러너 (Python). ※ 실행은 PC에서.

안드로이드 크롬(모바일 웹)으로 QASS 플로우를 돌린다. Appium-Python-Client 로 Appium
서버에 붙어 세션을 만들고, 크롬 WEBVIEW 컨텍스트에서 run_flow 를 실행한다.

전제 (PC):
  - Appium 서버 실행:  appium  (uiautomator2 드라이버 설치돼 있어야 함)
  - 안드로이드 에뮬레이터/실기기 + 크롬 + 일치하는 chromedriver
자세한 절차는 README.md 참고.
"""
import json
import os
import sys
from pathlib import Path

from appium import webdriver
from appium.options.android import UiAutomator2Options

from qass_flow import FLOW_ID, run_flow

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"


def build_options():
    # 모바일 크롬을 직접 띄우는 capabilities (browserName: 'Chrome' → 크롬 컨텍스트 자동).
    options = UiAutomator2Options()
    options.platform_name = "Android"
    options.automation_name = "UiAutomator2"
    options.device_name = os.environ.get("QASS_DEVICE", "Android Emulator")
    options.set_capability("browserName", "Chrome")
    options.new_command_timeout = 240
    # 기기 크롬과 chromedriver 가 안 맞으면 자동 다운로드 허용.
    options.set_capability("appium:chromedriverAutodownload", True)
    return options


def main():
    search = sys.argv[1] if len(sys.argv) > 1 else "google"
    host = os.environ.get("APPIUM_HOST", "127.0.0.1")
    port = os.environ.get("APPIUM_PORT", "4723")
    driver = webdriver.Remote(f"http://{host}:{port}", options=build_options())
    try:
        result = run_flow(driver, name="QA봇", search=search)
        print("\n=== FlowResult ===\n" + json.dumps(result, ensure_ascii=False, indent=2) + "\n")

        ARTIFACTS.mkdir(parents=True, exist_ok=True)
        (ARTIFACTS / f"{FLOW_ID}.result.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        return 0 if result["status"] == "pass" else 1
    finally:
        driver.quit()


if __name__ == "__main__":
    raise SystemExit(main())
