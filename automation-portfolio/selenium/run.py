"""run.py — Selenium 러너 (Python).
헤드리스 크롬 드라이버를 띄워 run_flow 를 돌리고 FlowResult 를 출력/저장한다.

전제: chrome + selenium(>=4). selenium 4 의 Selenium Manager 가 드라이버를
      자동 해결한다. 로컬/Codespaces 에서 `python run.py` 로 실행.
"""
import json
import os
import sys
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from qass_flow import FLOW_ID, run_flow

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"


def build_driver():
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")

    # 녹화(record.sh)는 Xvfb 가상 디스플레이에서 headed 로 띄워 ffmpeg x11grab 으로 캡처한다.
    # 평소엔 headless. HEADED=1 이면 headed(녹화용), CHROME_BIN 으로 크롬 바이너리 지정 가능.
    if not os.environ.get("HEADED"):
        options.add_argument("--headless=new")
    if os.environ.get("CHROME_BIN"):
        options.binary_location = os.environ["CHROME_BIN"]

    return webdriver.Chrome(options=options)


def main():
    search = sys.argv[1] if len(sys.argv) > 1 else "google"
    driver = build_driver()
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
