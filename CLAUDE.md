# CLAUDE.md

이 저장소에서 작업하는 모든 에이전트가 지켜야 할 규칙입니다.

## Git 커밋 규칙 (필수)

**커밋 메시지에 AI 공동 작성자 / 도구 흔적을 절대 포함하지 않는다.**

다음 문자열을 커밋 메시지(제목·본문·trailer 어디에도) 넣지 말 것:

- `Co-Authored-By: Claude ...`
- `Co-Authored-By:` 형태로 들어가는 AI 계정 (예: `noreply@anthropic.com`)
- `Claude`, `Anthropic` 등 AI 도구를 가리키는 표현
- `🤖 Generated with ...` 류의 생성 도구 안내 문구

이유: GitHub에서 공동 작성자(co-author)로 표시되는 것을 원치 않음. 커밋은
사람(저장소 소유자)이 작성한 것으로만 표기되어야 한다.

커밋 전 확인:

```bash
# 커밋 메시지에 금지 문자열이 없는지 점검
git log -1 --format="%B" | grep -iE "co-authored-by|claude|anthropic" && echo "금지 문자열 발견 — 커밋 수정 필요"
```
