const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../audit-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Capturing AI Menu Importer Screenshots...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const BASE_URL = 'http://localhost:3000';

  // 1. Cafe Owner Flow
  const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const ownerPage = await ownerContext.newPage();
  await ownerPage.goto(`${BASE_URL}/login`);
  await ownerPage.fill('input[type="email"]', 'owner@nordicroast.com');
  await ownerPage.fill('input[type="password"]', 'owner123');
  await ownerPage.click('button[type="submit"]');
  await ownerPage.waitForURL('**/dashboard', { timeout: 10000 });

  // Importer History
  await ownerPage.goto(`${BASE_URL}/dashboard/importer`, { waitUntil: 'networkidle', timeout: 10000 });
  await ownerPage.screenshot({ path: path.join(SCREENSHOT_DIR, '26_importer_history.png') });
  console.log('  ✓ Captured 26_importer_history.png');

  // Importer Upload Form
  await ownerPage.goto(`${BASE_URL}/dashboard/importer/new`, { waitUntil: 'networkidle', timeout: 10000 });
  await ownerPage.screenshot({ path: path.join(SCREENSHOT_DIR, '27_importer_upload.png') });
  console.log('  ✓ Captured 27_importer_upload.png');

  // Find an existing import ID from API to capture review studio
  const sessionRes = await ownerPage.request.get(`${BASE_URL}/api/v1/menu-imports`);
  const sessionData = await sessionRes.json();
  if (sessionData.data && sessionData.data.length > 0) {
    const importId = sessionData.data[0].id;
    await ownerPage.goto(`${BASE_URL}/dashboard/importer/${importId}`, { waitUntil: 'networkidle', timeout: 10000 });
    await ownerPage.screenshot({ path: path.join(SCREENSHOT_DIR, '28_importer_review_studio.png') });
    console.log('  ✓ Captured 28_importer_review_studio.png');
  }

  // 2. Super Admin Flow
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${BASE_URL}/login`);
  await adminPage.fill('input[type="email"]', 'admin@nordcafe.com');
  await adminPage.fill('input[type="password"]', 'admin123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/admin', { timeout: 10000 });

  await adminPage.goto(`${BASE_URL}/admin/importer`, { waitUntil: 'networkidle', timeout: 10000 });
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '29_admin_importer_governance.png') });
  console.log('  ✓ Captured 29_admin_importer_governance.png');

  await adminPage.goto(`${BASE_URL}/admin/importer/settings`, { waitUntil: 'networkidle', timeout: 10000 });
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '30_admin_importer_settings.png') });
  console.log('  ✓ Captured 30_admin_importer_settings.png');

  await browser.close();
  console.log('✅ AI Menu Importer Screenshots Captured Successfully!');
}

run().catch((e) => {
  console.error('Fatal capture error:', e);
  process.exit(1);
});
