/**
 * run.js — API 플로우 러너.
 * 브라우저·드라이버 없이 같은 QASS 데이터를 읽어 FlowResult 를 출력/저장합니다.
 * 다른 도구(Playwright 등)와 출력 형태가 같으므로 그대로 비교할 수 있습니다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFlow, FLOW_ID } from './qass-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = path.join(__dirname, 'artifacts');

const result = await runFlow({ search: process.argv[2] || 'google' });

console.log('\n=== FlowResult ===\n' + JSON.stringify(result, null, 2) + '\n');

fs.mkdirSync(ARTIFACTS, { recursive: true });
fs.writeFileSync(
  path.join(ARTIFACTS, `${FLOW_ID}.result.json`),
  JSON.stringify(result, null, 2),
);

process.exit(result.status === 'pass' ? 0 : 1);
