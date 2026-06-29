/**
 * qass.e2e.js — WebdriverIO(mocha) 스펙. 모바일 크롬에서 QASS 공통 플로우를 돌리고
 * 결과 계약(FlowResult)을 검증합니다.
 *
 * WebdriverIO 러너가 전역 `browser` 세션을 주입하므로, 그걸 그대로 공통 플로우
 * runFlow(driver, opts) 에 넘깁니다. 같은 계약이라 Playwright/Selenium 스펙과 판박이입니다.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFlow, FLOW_ID } from '../qass-flow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.join(__dirname, '..', 'artifacts');

describe('QASS 모바일 크롬 — 핵심 플로우', () => {
  it('로그인 → 방 입장 → 증적 확인 → 검색 (8 스텝, FlowResult 계약)', async () => {
    const result = await runFlow(browser, { name: 'QA봇', search: 'google' });

    // 결과 계약을 콘솔/파일로 — 다른 도구 출력과 그대로 비교 가능
    console.log('\n=== FlowResult ===\n' + JSON.stringify(result, null, 2) + '\n');
    fs.mkdirSync(ARTIFACTS, { recursive: true });
    fs.writeFileSync(path.join(ARTIFACTS, `${FLOW_ID}.result.json`), JSON.stringify(result, null, 2));

    // 계약 형태 검증
    assert.equal(result.tool, 'appium');
    assert.equal(result.flowId, FLOW_ID);
    assert.equal(result.steps.length, 8);

    // 모든 스텝 통과
    const failed = result.steps.filter((s) => s.status !== 'pass');
    assert.equal(failed.length, 0, '실패/스킵 스텝: ' + failed.map((s) => s.id).join(', '));
    assert.equal(result.status, 'pass');
  });
});
