import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFlow, FLOW_ID } from '../qass-flow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.join(__dirname, '..', 'artifacts');

test('QASS 핵심 플로우 — 로그인→방 입장→증적 확인→검색', async ({ page }, testInfo) => {
  const result = await runFlow(page, { name: 'QA봇', search: 'google' });

  // 결과 계약(FlowResult)을 그대로 콘솔에 출력 — 다른 도구와 비교 가능
  console.log('\n=== FlowResult ===\n' + JSON.stringify(result, null, 2) + '\n');

  // 결과 JSON 도 산출물로 저장
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  fs.writeFileSync(
    path.join(ARTIFACTS, `${FLOW_ID}.result.json`),
    JSON.stringify(result, null, 2),
  );

  // 각 스텝을 리포트에 첨부
  for (const s of result.steps) {
    await testInfo.attach(`step:${s.id}`, {
      body: `${s.status} (${s.ms}ms) ${s.note}`,
      contentType: 'text/plain',
    });
  }

  // 계약 형태 검증
  expect(result.tool).toBe('playwright');
  expect(result.flowId).toBe(FLOW_ID);
  expect(result.steps).toHaveLength(8);

  // 모든 스텝 통과
  const failed = result.steps.filter(s => s.status !== 'pass');
  expect(failed, `실패/스킵 스텝: ${failed.map(s => s.id).join(', ')}`).toHaveLength(0);
  expect(result.status).toBe('pass');
});
