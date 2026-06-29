import { defineConfig, devices } from '@playwright/test';

/**
 * 데스크톱 크롬 · 헤드리스 · video 녹화.
 * 녹화 결과는 artifacts/ 에 모이고, 쇼케이스(web/)가 가리키는 데모 파일이 됩니다.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: './artifacts',
  use: {
    baseURL: 'https://qass1.pages.dev',
    headless: true,
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    video: 'on',            // ← 항상 video 녹화 (요구사항)
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
