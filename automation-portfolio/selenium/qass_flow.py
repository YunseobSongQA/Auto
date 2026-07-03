"""qass_flow.py — QASS 공통 플로우의 Selenium WebDriver 구현 (Python).

계약(입출력)은 ../FLOW_CONTRACT.md 가 단일 진실 공급원입니다.
    run_flow(driver, name, search) -> FlowResult(dict)        (tool: 'selenium')

Playwright 레퍼런스 구현(../playwright/qass-flow.js)과 **같은 8 스텝·같은 FlowResult**
를 반환합니다. 다른 건 도구뿐 — "같은 QASS · 다른 도구" 비교의 핵심입니다.
선택자/플로우는 Playwright 구현에서 검증된 것을 그대로 옮겼습니다.
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

    # Playwright 구현과 동일한 step 래퍼: 예외를 던지지 않고 결과만 수집,
    # 앞 스텝이 실패하면 이후는 skip 처리한다.
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

    # Playwright 차이 ②: Playwright 는 액션마다 가시성/안정성을 auto-wait 하지만,
    #   Selenium 은 기본이 즉시 실행이라 모든 대기를 WebDriverWait(...).until 로 명시해야 한다.
    def visible(css):
        return wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, css)))

    def open_landing():
        driver.get(TARGET)
        wait.until(EC.presence_of_element_located(
            (By.XPATH, "//h1[contains(., '테스트에 돌려드립니다')]")))
    step("open_landing", open_landing)

    def go_app():
        driver.get(f"{TARGET}app.html")
        visible("#login-screen")
    step("go_app", go_app)

    def login():
        driver.find_element(By.CSS_SELECTOR, "#login-name").send_keys(name)
        driver.find_element(By.CSS_SELECTOR, "#btn-login").click()
        visible("#rooms-screen")
    step("login", login)

    def rooms_loaded():
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".room-card")))
        wait.until(EC.presence_of_element_located(
            (By.XPATH, f"//*[contains(@class,'room-card')][.//*[contains(., '{TEST_ROOM_NAME}')]]")))
        count = len(driver.find_elements(By.CSS_SELECTOR, ".room-card"))
        return f"{count} room card(s)"
    step("rooms_loaded", rooms_loaded)

    def open_test_room():
        # TEST_ROOM_NAME 을 포함하는 카드의 입장 버튼을 클릭.
        card = driver.find_element(
            By.XPATH, f"//*[contains(@class,'room-card')][.//*[contains(., '{TEST_ROOM_NAME}')]]")
        card.find_element(By.CSS_SELECTOR, ".room-enter-btn").click()
        visible("#enter-room-modal")
    step("open_test_room", open_test_room)

    def enter_room():
        # Playwright 차이 ①: page.fill() 은 기존 값을 비우고 입력하지만,
        #   Selenium send_keys() 는 "덧붙인다". QASS 는 테스트 방의 비밀번호/이름을
        #   프리필하므로 반드시 clear() 후 입력해야 인증이 통과한다.
        pw = driver.find_element(By.CSS_SELECTOR, "#enter-room-password")
        uploader = driver.find_element(By.CSS_SELECTOR, "#enter-uploader-name")
        pw.clear()
        pw.send_keys(TEST_ROOM_PASSWORD)
        uploader.clear()
        uploader.send_keys(name)
        driver.find_element(By.CSS_SELECTOR, "#btn-enter-room-submit").click()
        visible("#room-screen")
    step("enter_room", enter_room)

    def captures_loaded():
        # count-label 이 "불러오는 중…" 에서 바뀔 때까지 대기.
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
        "tool": "selenium",
        "flowId": FLOW_ID,
        "target": TARGET,
        "startedAt": started_at.isoformat(),
        "finishedAt": finished_at.isoformat(),
        "durationMs": round((finished_at - started_at).total_seconds() * 1000),
        "status": status,
        "steps": steps,
    }
