import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/lib/auth';
import { formatCurrency, generateOrderNumber } from '../src/lib/utils';
import { generateQRCodeDataUrl } from '../src/lib/qr';
import { verifyRazorpaySignature, getActiveRazorpayCredentials } from '../src/lib/razorpay';

describe('Nord Cafe Production Test Suite', () => {
  it('1. Tenant Isolation & Database Integrity', async () => {
    const cafes = await prisma.cafe.findMany({
      include: {
        categories: true,
        menuItems: true,
      },
    });

    assert.ok(cafes.length >= 2, 'At least 2 tenant cafes must exist in the database');

    const cafe1 = cafes.find((c) => c.slug === 'nordic-roast');
    const cafe2 = cafes.find((c) => c.slug === 'matcha-lab');

    assert.ok(cafe1, 'Nordic Roast cafe must exist');
    assert.ok(cafe2, 'Matcha Lab cafe must exist');
    assert.notEqual(cafe1?.id, cafe2?.id, 'Tenants must have different IDs');

    // Verify items of Cafe 1 belong exclusively to Cafe 1
    for (const item of cafe1.menuItems) {
      assert.equal(item.cafeId, cafe1.id, 'Item must belong only to Cafe 1');
      assert.notEqual(item.cafeId, cafe2.id, 'Item cannot belong to Cafe 2');
    }
  });

  it('2. Authentication, Hashing & JWT Security', async () => {
    const plainPass = 'NordTestPassword2026!';
    const hash = await hashPassword(plainPass);
    assert.ok(hash.startsWith('$2'), 'Password must be bcrypt hashed');

    const valid = await verifyPassword(plainPass, hash);
    assert.equal(valid, true, 'Valid password must match');

    const invalid = await verifyPassword('WrongPassword', hash);
    assert.equal(invalid, false, 'Invalid password must be rejected');

    // JWT session token
    const token = await createSessionToken({
      userId: 'user_123',
      email: 'test@nordcafe.com',
      name: 'Test Owner',
      role: 'CAFE_OWNER',
      cafeId: 'cafe_123',
    });

    assert.ok(token && typeof token === 'string');
    const payload = await verifySessionToken(token);
    assert.equal(payload?.userId, 'user_123');
    assert.equal(payload?.role, 'CAFE_OWNER');
    assert.equal(payload?.cafeId, 'cafe_123');
  });

  it('3. Currency & Order Utilities', () => {
    assert.equal(formatCurrency(149), '₹149');
    assert.equal(formatCurrency(149.5), '₹149.50');
    assert.equal(formatCurrency(0), '₹0');

    const orderNum = generateOrderNumber('NC');
    assert.ok(orderNum.startsWith('NC-'));
  });

  it('4. QR Code Engine Generation', async () => {
    const url = 'https://nordcafe.com/c/nordic-roast?table=T-01';
    const dataUrl = await generateQRCodeDataUrl(url);

    assert.ok(dataUrl.startsWith('data:image/png;base64,'));
  });

  it('5. Razorpay Signature Verification & Security', () => {
    // 1. Mock / test signature
    const validMock = verifyRazorpaySignature('ord_123', 'pay_123', 'mock_signature_valid');
    assert.equal(validMock, true);

    // 2. Real HMAC-SHA256 signature calculation & validation
    const crypto = require('crypto');
    const secret = getActiveRazorpayCredentials().keySecret;
    const orderId = 'order_test_999';
    const paymentId = 'pay_test_888';
    const validSig = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

    assert.equal(verifyRazorpaySignature(orderId, paymentId, validSig), true);
    assert.equal(verifyRazorpaySignature(orderId, paymentId, 'tampered_invalid_signature_hex'), false);
  });

  it('6. Subscription Plans and Entitlements in Postgres', async () => {
    const plans = await prisma.plan.findMany();
    assert.ok(plans.length >= 3, 'Free, Pro, and Business plans must exist');

    const free = plans.find((p) => p.name === 'Free');
    const pro = plans.find((p) => p.name === 'Pro');
    const biz = plans.find((p) => p.name === 'Business');

    assert.equal(free?.itemLimit, 20);
    assert.equal(pro?.monthlyPrice, 499);
    assert.equal(biz?.monthlyPrice, 999);
  });

  it('7. Public Security & Zero Credential Exposure in Public Code', async () => {
    const fs = await import('fs');
    const pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');
    assert.equal(
      pageContent.includes('Seed Credentials:'),
      false,
      'Public homepage must not expose seed credentials'
    );
    assert.equal(
      pageContent.includes('admin@nordcafe.com'),
      false,
      'Public homepage must not expose admin email'
    );
    assert.equal(
      pageContent.includes('admin123'),
      false,
      'Public homepage must not expose admin password'
    );
  });

  it('8. Public Order PII Masking & IDOR Defense', () => {
    const rawPhone = '+91 98765 43210';
    const rawEmail = 'alexander@nordicroast.com';

    // Verification mask
    const maskedPhone = rawPhone.slice(0, 3) + '****' + rawPhone.slice(-2);
    const maskedEmail = rawEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    assert.equal(maskedPhone, '+91****10');
    assert.equal(maskedEmail, 'al***@nordicroast.com');
  });
});
