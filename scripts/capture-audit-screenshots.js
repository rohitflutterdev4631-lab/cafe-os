const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../audit-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Automated Playwright Audit & Screenshot Capture...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const BASE_URL = 'http://localhost:3000';

  // 1. Audit Public Pages
  console.log('1. Auditing Public Pages...');
  const publicContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await publicContext.newPage();

  const publicRoutes = [
    { name: '01_homepage', url: '/' },
    { name: '02_login', url: '/login' },
    { name: '03_register', url: '/register' },
    { name: '04_customer_menu', url: '/c/nordic-roast' },
    { name: '05_customer_table_menu', url: '/c/nordic-roast?table=T-02' },
    { name: '06_customer_checkout', url: '/c/nordic-roast/checkout' },
    { name: '07_order_tracking', url: '/c/nordic-roast/orders/NC-9101' },
    { name: '08_order_lookup', url: '/lookup' },
  ];

  for (const route of publicRoutes) {
    try {
      await page.goto(`${BASE_URL}${route.url}`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.name}_desktop.png`), fullPage: false });
      console.log(`  ✓ Captured ${route.name}_desktop.png`);
    } catch (e) {
      console.error(`  ✗ Failed to capture ${route.name}:`, e.message);
    }
  }

  // Mobile Customer Menu Viewport (390x844 iPhone 14 style)
  console.log('2. Auditing Mobile Customer Experience (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  try {
    await mobilePage.goto(`${BASE_URL}/c/nordic-roast`, { waitUntil: 'networkidle', timeout: 10000 });
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '09_customer_menu_mobile.png') });
    console.log('  ✓ Captured 09_customer_menu_mobile.png');

    await mobilePage.goto(`${BASE_URL}/c/nordic-roast/checkout`, { waitUntil: 'networkidle', timeout: 10000 });
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '10_customer_checkout_mobile.png') });
    console.log('  ✓ Captured 10_customer_checkout_mobile.png');
  } catch (e) {
    console.error('  ✗ Mobile capture error:', e.message);
  }

  // 3. Audit Super Admin Panel
  console.log('3. Auditing Super Admin Panel...');
  const adminContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${BASE_URL}/login`);
  await adminPage.fill('input[type="email"]', 'admin@nordcafe.com');
  await adminPage.fill('input[type="password"]', 'admin123');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/admin', { timeout: 10000 });

  const adminRoutes = [
    { name: '11_admin_overview', url: '/admin' },
    { name: '12_admin_cafes', url: '/admin/cafes' },
    { name: '13_admin_onboarding', url: '/admin/onboarding' },
    { name: '14_admin_plans', url: '/admin/plans' },
    { name: '15_admin_users', url: '/admin/users' },
  ];

  for (const route of adminRoutes) {
    try {
      await adminPage.goto(`${BASE_URL}${route.url}`, { waitUntil: 'networkidle', timeout: 10000 });
      await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.name}.png`) });
      console.log(`  ✓ Captured ${route.name}.png`);
    } catch (e) {
      console.error(`  ✗ Failed to capture ${route.name}:`, e.message);
    }
  }

  // 4. Audit Cafe Owner Dashboard
  console.log('4. Auditing Cafe Owner Dashboard...');
  const ownerContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const ownerPage = await ownerContext.newPage();
  await ownerPage.goto(`${BASE_URL}/login`);
  await ownerPage.fill('input[type="email"]', 'owner@nordicroast.com');
  await ownerPage.fill('input[type="password"]', 'owner123');
  await ownerPage.click('button[type="submit"]');
  await ownerPage.waitForURL('**/dashboard', { timeout: 10000 });

  const ownerRoutes = [
    { name: '16_dashboard_overview', url: '/dashboard' },
    { name: '17_dashboard_orders', url: '/dashboard/orders' },
    { name: '18_dashboard_menu', url: '/dashboard/menu' },
    { name: '19_dashboard_tables', url: '/dashboard/tables' },
    { name: '20_dashboard_qr_codes', url: '/dashboard/qr-codes' },
    { name: '21_dashboard_analytics', url: '/dashboard/analytics' },
    { name: '22_dashboard_subscription', url: '/dashboard/subscription' },
    { name: '23_dashboard_settings', url: '/dashboard/settings' },
    { name: '24_dashboard_staff', url: '/dashboard/staff' },
  ];

  for (const route of ownerRoutes) {
    try {
      await ownerPage.goto(`${BASE_URL}${route.url}`, { waitUntil: 'networkidle', timeout: 10000 });
      await ownerPage.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.name}.png`) });
      console.log(`  ✓ Captured ${route.name}.png`);
    } catch (e) {
      console.error(`  ✗ Failed to capture ${route.name}:`, e.message);
    }
  }

  // 5. Audit Kitchen Display System (KDS)
  console.log('5. Auditing Kitchen KDS...');
  const kitchenContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const kitchenPage = await kitchenContext.newPage();
  await kitchenPage.goto(`${BASE_URL}/login`);
  await kitchenPage.fill('input[type="email"]', 'kitchen@nordicroast.com');
  await kitchenPage.fill('input[type="password"]', 'kitchen123');
  await kitchenPage.click('button[type="submit"]');
  await kitchenPage.waitForURL('**/kitchen', { timeout: 10000 });
  await kitchenPage.screenshot({ path: path.join(SCREENSHOT_DIR, '25_kitchen_kds.png') });
  console.log('  ✓ Captured 25_kitchen_kds.png');

  await browser.close();
  console.log('✅ Audit & Screenshot Capture Finished Successfully!');
}

run().catch((e) => {
  console.error('Fatal audit error:', e);
  process.exit(1);
});
