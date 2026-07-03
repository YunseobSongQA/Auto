# Appium — QASS 모바일 크롬 (안드로이드)

같은 QASS 플로우를 **모바일 크롬(안드로이드)** 에서 실행합니다. Playwright/Selenium 과
**같은 8 스텝·같은 FlowResult** 를 반환하되 환경만 모바일 웹입니다. QASS 가 반응형이라
DOM 선택자는 데스크톱과 동일하게 재사용합니다.

> 실무에서 Appium 은 **Python(pytest + Appium-Python-Client)** 으로 작성하는 경우가
> 매우 보편적이라, 이 구현도 Python 으로 작성했습니다. Appium-Python-Client 는 Selenium
> WebDriver 를 상속하므로 데스크톱 Selenium 과 같은 `By`/`WebDriverWait` API 를 씁니다.

플로우/결과 형태는 [`../FLOW_CONTRACT.md`](../FLOW_CONTRACT.md) 가 단일 진실 공급원입니다.

## 실행 방식 두 가지

| 방식 | 파일 | 설명 |
|------|------|------|
| **표준 러너 (권장)** | `test_qass.py` | 현업 표준. pytest fixture 가 Appium 세션을 만들어 주입하고 계약을 검증 |
| standalone (참고) | `run.py` | `appium.webdriver.Remote()` 로 직접 세션을 만드는 가장 단순한 형태 |

둘 다 같은 `qass_flow.py` 의 `run_flow(driver, name, search) -> FlowResult` 를 호출합니다.

## 검증 상태

- ✅ **이 저장소(코드스페이스)에서 검증됨**: Appium 서버 기동 + UiAutomator2 드라이버
  설치 + pytest/Appium-Python-Client 로드. 즉 **코드·설정은 정상**입니다.
- 🟡 **PC 필요**: 안드로이드 에뮬레이터/실기기만 있으면 그대로 돌아갑니다. 클라우드
  컨테이너는 에뮬레이터(KVM·메모리) 제약이 커서 **실제 실행·녹화는 PC 에서** 합니다.

## PC 실행 (Python 3.9+ · Node(Appium 서버) · Android SDK 필요)

```bash
# 1) 파이썬 의존성 (pytest + Appium-Python-Client + selenium)
pip install -r requirements.txt

# 2) Appium 서버 + 드라이버 (Appium 서버는 Node 기반)
npm install -g appium
appium driver install uiautomator2

# 3) 안드로이드 기기 준비 (둘 중 하나)
#   - Android Studio 로 AVD(에뮬레이터) 생성 후 실행, 또는
#   - USB 디버깅 켠 실기기 연결
adb devices                   # 기기가 'device' 로 보이는지 확인 (+ 기기에 Chrome 설치)

# 4) Appium 서버 기동 (별도 터미널)
appium

# 5) 실행 — 표준 러너(pytest) 또는 standalone
pytest -s test_qass.py        # 표준 러너
python run.py                 # standalone (동일 플로우)
```

성공하면 8 스텝이 모두 통과한 `FlowResult` 가 출력되고 `artifacts/` 에 저장됩니다.

## 데모 영상 만들어 쇼케이스에 붙이기

### 6) 녹화

- **Mac/Linux (CLI, 가장 간단)** — 녹화+실행+변환을 한 번에:
  ```bash
  ./record.sh          # → web/assets/appium.webm 자동 생성 (adb·ffmpeg 필요)
  ```
- **Windows / GUI** — Android Studio 에뮬레이터 창의 우측 도구막대 `⋮(Extended controls)`
  → **Record and Playback** → **Start recording** → 다른 터미널에서 `pytest -s test_qass.py`
  실행 → 끝나면 **Stop** → `appium.webm` 으로 저장. (안드로이드 스튜디오는 webm 으로 바로
  저장됩니다.) 저장한 파일을 `automation-portfolio/web/assets/appium.webm` 로 옮기세요.

### 7) config 한 곳만 바꾸면 카드에 영상이 붙습니다

`web/config.js` 의 appium 카드:
```js
demo: 'assets/appium.webm',   // null → 경로
demoType: 'video',            // 'mockup' → 'video'
status: 'verified',           // 'pending' → 'verified'
```

### 8) 커밋

```bash
git add automation-portfolio/web/assets/appium.webm automation-portfolio/web/config.js
git commit -m "Appium: add mobile demo video, flip card to verified"
git push
```
푸시하면 Cloudflare 가 자동 재배포 → 카드에 모바일 크롬 자동화 영상이 재생됩니다.

## 구조

| 파일 | 역할 |
|------|------|
| `qass_flow.py` | 플로우 구현. `run_flow(driver, name, search) -> FlowResult` (타 도구와 동일 계약) |
| `test_qass.py` | pytest 스펙 + fixture. Appium 세션 생성 → `run_flow` 호출 + 계약 검증 + 결과 저장 |
| `run.py` | standalone 러너(`webdriver.Remote()`) — 가장 단순한 참고용 |
| `requirements.txt` | 의존성(`Appium-Python-Client`·`selenium`·`pytest`) |

## 모바일 웹 자동화 메모 (배우기용)

- `browserName: 'Chrome'` 이면 세션이 **모바일 크롬(WEBVIEW)** 컨텍스트로 시작 — 그래서
  웹 선택자(`find_element(By.CSS_SELECTOR, '#login-name')` 등)를 바로 씁니다. 네이티브
  앱이라면 `driver.contexts` → `driver.switch_to.context('WEBVIEW_...')` 로 전환해야 합니다.
- `chromedriver` 는 UiAutomator2 드라이버가 기기 크롬 버전에 맞춰 자동 관리합니다
  (`appium:chromedriverAutodownload`).
