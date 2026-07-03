# QASS 공통 플로우 계약 (Flow Contract) — v1

> 이 문서는 **단일 진실 공급원(Single Source of Truth)**입니다.
> Playwright / Selenium / API / Appium 네 가지 도구는 **모두 아래 같은 플로우**를
> 자기 방식으로 실행하고, **모두 같은 결과 형태**를 반환합니다.
> "같은 QASS · 다른 도구"의 핵심이 바로 이 계약입니다.
>
> 모듈 내부 구현은 자유롭게 바꿔도 됩니다. **이 계약(입출력 형태)만 깨지 않으면**
> 다른 도구·웹 쇼케이스에 영향이 0입니다. (구축기 5번: 모듈 경계 고정)

대상(target): `https://qass1.pages.dev/`
백엔드(API용): Supabase REST `https://snjexfohyklviarxprvm.supabase.co/rest/v1`

---

## 1. 공통 시나리오 (UI 도구: Playwright / Selenium / Appium)

QASS 의 가장 대표적인 사용자 여정 — **로그인 → 방 입장 → 증적 확인 → 검색** 입니다.

| # | step id           | 동작                                                              | 통과 기준 (expect)                                |
|---|-------------------|-------------------------------------------------------------------|---------------------------------------------------|
| 1 | `open_landing`    | `/` 로 이동                                                       | `h1` 에 "테스트에 돌려드립니다" 포함              |
| 2 | `go_app`          | `/app.html` 로 이동                                              | `#login-screen` 노출                              |
| 3 | `login`           | `#login-name` 에 이름 입력 → `#btn-login` 클릭                   | `#rooms-screen` 노출                              |
| 4 | `rooms_loaded`    | 방 목록 로딩 대기                                                 | `.room-card` 1개 이상, "QASS 테스트 방" 존재      |
| 5 | `open_test_room`  | "QASS 테스트 방" 카드의 `.room-enter-btn` 클릭                   | `#enter-room-modal` **또는** `#room-screen` 노출  |
| 6 | `enter_room`      | 모달이 뜨면 `#enter-room-password`=`qass1234`·`#enter-uploader-name`=이름 → `#btn-enter-room-submit`; 무비번 방이면 바로 통과 | `#room-screen` 노출      |
| 7 | `captures_loaded` | 캡처 그리드 로딩 대기                                             | `#count-label` 이 "불러오는 중…" 이 아님          |
| 8 | `search`          | `#search` 에 `google` 입력                                       | 그리드가 필터됨(에러 없이 입력 반영)              |

> 고정 테스트 자격증명: 방 이름 `QASS 테스트 방`, 비밀번호 `qass1234`.
> (QASS `main.js` 의 `TEST_ROOM_NAME` / `TEST_ROOM_PASSWORD` 와 동일)
>
> 참고: "QASS 테스트 방" 은 현재 **비밀번호 없이 바로 입장**하는 방으로 운영됩니다. 도구들은
> 5·6 스텝에서 (비밀번호 모달) / (무비번 바로 입장) 두 형태를 모두 처리하므로, 방 설정이
> 바뀌어도 같은 8스텝 계약이 그대로 통과합니다.

## 2. API 시나리오 (도구: API)

UI 없이 **같은 데이터**를 Supabase REST 로 읽습니다.

| # | step id           | 동작                                                       | 통과 기준                          |
|---|-------------------|------------------------------------------------------------|------------------------------------|
| 1 | `list_rooms`      | `GET /rooms?select=...` 방 목록 조회                       | 200, 배열 반환                     |
| 2 | `find_test_room`  | 목록에서 "QASS 테스트 방" 찾기                             | 1건 존재                           |
| 3 | `list_captures`   | `GET /captures?room_id=eq.<id>` 해당 방 캡처 조회          | 200, 배열 반환                     |
| 4 | `search`          | 캡처를 `url|title` 로 `google` 필터 (순수 함수)            | 필터 결과 반환(0건 허용)           |

---

## 3. 결과 계약 (네 도구 공통 출력 형태)

모든 도구는 실행 후 아래 JSON 형태(`FlowResult`)를 반환/출력합니다.
웹 쇼케이스·CI·리포트는 이 형태에만 의존합니다.

```jsonc
{
  "tool":       "playwright",          // "playwright" | "selenium" | "appium" | "api"
  "flowId":     "qass-core-evidence-flow",
  "target":     "https://qass1.pages.dev/",
  "startedAt":  "2026-06-29T00:00:00.000Z",
  "finishedAt": "2026-06-29T00:00:12.345Z",
  "durationMs": 12345,
  "status":     "pass",                // "pass" | "fail"  (스텝 하나라도 fail 이면 fail)
  "steps": [
    { "id": "open_landing", "status": "pass", "ms": 820, "note": "" }
    // status: "pass" | "fail" | "skip"
  ],
  "artifacts": {                        // 선택 — 없으면 생략
    "video": "playwright/artifacts/qass-core-evidence-flow.webm"
  }
}
```

### StepResult
```jsonc
{ "id": "string", "status": "pass" | "fail" | "skip", "ms": 0, "note": "string" }
```

이 계약을 코드로 박아둔 곳: 각 프로젝트의 동일 이름 함수 `runFlow(...) -> FlowResult`.
