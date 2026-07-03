"""test_qass.py — pytest 스펙. 모바일 크롬에서 QASS 공통 플로우를 돌리고
결과 계약(FlowResult)을 검증한다.

현업 Python 모바일 자동화 표준: pytest + Appium-Python-Client. fixture 가 Appium 세션
(UiAutomator2 · 모바일 크롬)을 만들어 테스트에 주입하므로, 그걸 그대로 공통 플로우
run_flow(driver, ...) 에 넘긴다. 같은 계약이라 Playwright/Selenium 스펙과 판박이다.

실행:  pytest -s          (전제: 로컬 Appium 서버 + 안드로이드 기기 — README 참고)
"""
import json
import os
from pathlib import Path

import pytest
from appium import webdriver
from appium.options.android import UiAutomator2Options

from qass_flow import FLOW_ID, run_flow

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"


@pytest.fixture
def driver():
    # W3C 표준 capabilities — Appium 은 vendor 접두사 appium: 를 쓴다.
    options = UiAutomator2Options()
    options.platform_name = "Android"
    options.automation_name = "UiAutomator2"  # 안드로이드 표준 드라이버
    options.device_name = os.environ.get("QASS_DEVICE", "Android Emulator")
    # 모바일 "웹" 자동화: 앱 대신 크롬을 띄운다 → 세션이 WEBVIEW(크롬) 컨텍스트로 시작.
    options.set_capability("browserName", "Chrome")
    options.new_command_timeout = 240
    options.set_capability("appium:chromedriverAutodownload", True)

    host = os.environ.get("APPIUM_HOST", "127.0.0.1")
    port = os.environ.get("APPIUM_PORT", "4723")
    drv = webdriver.Remote(f"http://{host}:{port}", options=options)
    yield drv
    drv.quit()


def test_qass_core_flow(driver):
    result = run_flow(driver, name="QA봇", search="google")

    # 결과 계약을 콘솔/파일로 — 다른 도구 출력과 그대로 비교 가능
    print("\n=== FlowResult ===\n" + json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / f"{FLOW_ID}.result.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    # 계약 형태 검증
    assert result["tool"] == "appium"
    assert result["flowId"] == FLOW_ID
    assert len(result["steps"]) == 8

    # 모든 스텝 통과
    failed = [s for s in result["steps"] if s["status"] != "pass"]
    assert not failed, "실패/스킵 스텝: " + ", ".join(s["id"] for s in failed)
    assert result["status"] == "pass"
