"""qass_flow.py — QASS 공통 플로우의 Appium(모바일 크롬) 구현 (Python).

계약(입출력)은 ../FLOW_CONTRACT.md 가 단일 진실 공급원입니다.
    run_flow(driver, name, search) -> FlowResult(dict)        (tool: 'appium')

Playwright/Selenium 과 **같은 8 스텝·같은 FlowResult** 를 반환합니다.
차이는 실행 환경뿐 — 안드로이드 크롬(모바일 웹)에서 같은 QASS 를 자동화합니다.

driver 는 Appium-Python-Client 의 세션(appium.webdriver.Remote)입니다. Appium 드라이버는
Selenium WebDriver 를 상속하므로 By/WebDriverWait/WebElement API 를 그대로 씁니다.
browserName:'Chrome' 으로 세션이 모바일 크롬 컨텍스트에서 시작하므로, QASS 가 반응형 웹인
점을 이용해 데스크톱과 "동일한 DOM 선택자"를 그대로 씁니다. (네이티브 앱이라면 컨텍스트를
NATIVE_APP↔WEBVIEW 로 전환해야 하지만, 여기선 순수 모바일 웹이라 불필요합니다.)
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

FLOW_ID = "qass-core-evidence-flow"
TARGET = "https://qass1.pages.dev/"
TEST_ROOM_NAME = "QASS 테스트 방"
TEST_ROOM_PASSWORD = "qass1234"

T = 15  # 공통 대기 한도(초)


def run_flow(driver, name="QA봇", search="google"):
    """8 스텝을 순서대로 실행하고 도구 공통 출력인 FlowResult(dict) 를 반환한다."""
    steps = []
    started_at = datetime.now(timezone.utc)
    wait = WebDriverWait(driver, T)

    # Playwright/Selenium 구현과 동일한 step 래퍼.
    def step(step_id, fn):
        if any(s["status"] == "fail" for s in steps):
            steps.append({"id": step_id, "status": "skip", "ms": 0, "note": "previous step failed"})
            return
        t0 = time.monotonic()
        try:
            note = fn() or ""
            steps.append({"id": step_id, "status": "pass", "ms": round((time.monotonic() - t0) * 1000), "note": note})
        except Exception as err:  # noqa: BLE001 — 결과로 수집(던지지 않음)
            steps.append({"id": step_id, "status": "fail", "ms": round((time.monotonic() - t0) * 1000), "note": str(err)})

    # 선택자(css 또는 xpath)가 화면에 보일 때까지 대기 후 요소를 반환.
    def visible_css(css):
        return wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, css)))

    def visible_xpath(xpath):
        return wait.until(EC.visibility_of_element_located((By.XPATH, xpath)))

    def shown(css):
        # 예외 없이 "지금 화면에 보이는가"만 판정 (요소가 없으면 False).
        els = driver.find_elements(By.CSS_SELECTOR, css)
        return bool(els) and els[0].is_displayed()

    def open_landing():
        driver.get(TARGET)
        visible_xpath("//h1[contains(., '테스트에 돌려드립니다')]")
    step("open_landing", open_landing)

    def go_app():
        driver.get(f"{TARGET}app.html")
        visible_css("#login-screen")
    step("go_app", go_app)

    def login():
        driver.find_element(By.CSS_SELECTOR, "#login-name").send_keys(name)
        driver.find_element(By.CSS_SELECTOR, "#btn-login").click()
        visible_css("#rooms-screen")
    step("login", login)

    def rooms_loaded():
        visible_css(".room-card")
        visible_xpath(f"//*[contains(@class,'room-card')][.//*[contains(., '{TEST_ROOM_NAME}')]]")
        count = len(driver.find_elements(By.CSS_SELECTOR, ".room-card"))
        return f"{count} room card(s)"
    step("rooms_loaded", rooms_loaded)

    def open_test_room():
        card = driver.find_element(
            By.XPATH, f"//*[contains(@class,'room-card')][.//*[contains(., '{TEST_ROOM_NAME}')]]")
        card.find_element(By.CSS_SELECTOR, ".room-enter-btn").click()
        # 테스트 방은 (비밀번호 모달) 또는 (무비번 바로 입장) 두 형태가 있으므로 둘 중 하나를 대기.
        wait.until(lambda _d: shown("#enter-room-modal") or shown("#room-screen"))
    step("open_test_room", open_test_room)

    def enter_room():
        # 비밀번호 모달이 뜨는 방이면 입력 후 제출, 무비번 방이면 이미 room-screen 이라 바로 통과.
        # (모달일 때) QASS 는 프리필 값이 있으므로 send_keys() 가 덧붙지 않도록 clear() 후 입력한다.
        if shown("#enter-room-modal"):
            pw = driver.find_element(By.CSS_SELECTOR, "#enter-room-password")
            uploader = driver.find_element(By.CSS_SELECTOR, "#enter-uploader-name")
            pw.clear()
            pw.send_keys(TEST_ROOM_PASSWORD)
            uploader.clear()
            uploader.send_keys(name)
            driver.find_element(By.CSS_SELECTOR, "#btn-enter-room-submit").click()
            visible_css("#room-screen")
            return "entered via password modal"
        visible_css("#room-screen")
        return "no-password room · entered directly"
    step("enter_room", enter_room)

    def captures_loaded():
        def loaded(d):
            txt = d.find_element(By.CSS_SELECTOR, "#count-label").text
            return bool(txt) and "불러오는" not in txt
        wait.until(loaded)
        return driver.find_element(By.CSS_SELECTOR, "#count-label").text.strip()
    step("captures_loaded", captures_loaded)

    def search_captures():
        box = driver.find_element(By.CSS_SELECTOR, "#search")
        box.send_keys(search)
        val = box.get_attribute("value")
        if val != search:
            raise RuntimeError("search input not reflected")
        return f'filtered by "{search}"'
    step("search", search_captures)

    finished_at = datetime.now(timezone.utc)
    status = "fail" if any(s["status"] == "fail" for s in steps) else "pass"

    return {
        "tool": "appium",
        "flowId": FLOW_ID,
        "target": TARGET,
        "startedAt": started_at.isoformat(),
        "finishedAt": finished_at.isoformat(),
        "durationMs": round((finished_at - started_at).total_seconds() * 1000),
        "status": status,
        "steps": steps,
    }
