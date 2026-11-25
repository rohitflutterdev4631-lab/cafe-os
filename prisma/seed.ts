const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const seedData = require('./seed-items.json');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding with 45 items...');

  // 1. Clean in dependency order
  console.log('Cleaning existing records...');
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockWastage.deleteMany();
  await prisma.branchTransfer.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.cashShift.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.customerFeedback.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.foodSafetyChecklist.deleteMany();
  await prisma.menuImport.deleteMany();
  await prisma.menuScan.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItemAddon.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.menuItemAddonGroup.deleteMany();
  await prisma.addonOption.deleteMany();
  await prisma.addonGroup.deleteMany();
  await prisma.itemVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cafeSocialLink.deleteMany();
  await prisma.businessHour.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.cafeSetting.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscriptionInvoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.cafe.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 2. Roles
  console.log('Creating Roles & Permissions...');
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Platform Administrator with full control' },
    { name: 'ADMIN_STAFF', description: 'Operations & Support staff' },
    { name: 'CAFE_OWNER', description: 'Cafe Owner with management access' },
    { name: 'CAFE_MANAGER', description: 'Branch manager for operations' },
    { name: 'KITCHEN_STAFF', description: 'Kitchen Display System operator' },
  ];
  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    const createdRole = await prisma.role.create({ data: r });
    roleMap[r.name] = createdRole.id;
  }

  // 3. Subscription Plans
  console.log('Creating Plans...');
  await prisma.plan.create({
    data: {
      name: 'Pro',
      description: 'Live orders, custom branding & kitchen KDS',
      monthlyPrice: 499,
      yearlyPrice: 4999,
      itemLimit: 150,
      tableLimit: 25,
      branchLimit: 1,
      staffLimit: 4,
      qrLimit: 25,
      hasOnlineOrdering: true,
      hasCustomBranding: true,
      hasAnalytics: true,
      hasKds: true,
    },
  });

  // 4. Users
  console.log('Creating Users...');
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('admin123', salt);
  const ownerPass = await bcrypt.hash('owner123', salt);
  const managerPass = await bcrypt.hash('manager123', salt);
  const kitchenPass = await bcrypt.hash('kitchen123', salt);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Nord Admin Support',
      email: 'admin@nordcafe.com',
      phone: '+91 98765 00001',
      passwordHash: adminPass,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.create({
    data: { userId: adminUser.id, roleId: roleMap['SUPER_ADMIN'] },
  });

  const cafeOwnerUser = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'owner@nordicroast.com',
      phone: '+91 98140 12345',
      passwordHash: ownerPass,
      status: 'ACTIVE',
    },
  });

  // 5. Cafe: Nordic Roast & Bakery
  console.log('Creating Cafe: Nordic Roast & Bakery...');
  const cafe = await prisma.cafe.create({
    data: {
      ownerId: cafeOwnerUser.id,
      name: 'Nordic Roast & Bakery',
      slug: 'nordic-roast',
      logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80',
      description: 'Artisanal single-origin roasts, authentic stone-baked pizzas, and handcrafted sourdough pastries.',
      status: 'ACTIVE',
      themeColor: '#2563EB',
      secondaryColor: '#F8FAFC',
      fontFamily: 'Inter',
      enableDarkMode: false,
      cardLayout: 'MODERN',
      gstin: '03AAAAA0000A1Z5',
      fssai: '10020011000543',
    },
  });

  await prisma.userRole.create({
    data: { userId: cafeOwnerUser.id, roleId: roleMap['CAFE_OWNER'], cafeId: cafe.id },
  });

  await prisma.cafeSetting.create({
    data: {
      cafeId: cafe.id,
      currency: 'INR',
      currencySymbol: '₹',
      orderingEnabled: true,
      dineInEnabled: true,
      takeawayEnabled: true,
      deliveryEnabled: false,
      taxRatePercent: 5.0,
      packagingFee: 0.0,
      minOrderValue: 0.0,
      autoAcceptOrders: false,
      requireCustomerPhone: true,
      soundNotifications: true,
    },
  });

  const mainBranch = await prisma.branch.create({
    data: {
      cafeId: cafe.id,
      name: 'Sector 35-C Flagship Store',
      address: 'SCO 142-143, Inner Market, Sector 35-C, Chandigarh, 160022',
      phone: '+91 98140 12345',
      latitude: 30.7225,
      longitude: 76.7681,
      isMain: true,
      status: 'ACTIVE',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: 'Rohan Mehra',
      email: 'manager@nordicroast.com',
      phone: '+91 98765 43210',
      passwordHash: managerPass,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.create({
    data: { userId: managerUser.id, roleId: roleMap['CAFE_MANAGER'], cafeId: cafe.id, branchId: mainBranch.id },
  });

  const kitchenUser = await prisma.user.create({
    data: {
      name: 'Chef Harpreet Singh',
      email: 'kitchen@nordicroast.com',
      phone: '+91 98765 67890',
      passwordHash: kitchenPass,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.create({
    data: { userId: kitchenUser.id, roleId: roleMap['KITCHEN_STAFF'], cafeId: cafe.id, branchId: mainBranch.id },
  });

  // Coupons
  await prisma.coupon.create({
    data: {
      cafeId: cafe.id,
      code: 'NORD10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 299,
      maxDiscount: 100,
      isActive: true,
    },
  });

  // Addon Groups
  const coffeeAddons = await prisma.addonGroup.create({
    data: {
      cafeId: cafe.id,
      name: 'Coffee Customization',
      minSelect: 0,
      maxSelect: 3,
      required: false,
      options: {
        create: [
          { name: 'Extra Double Shot Espresso', price: 40, isAvailable: true },
          { name: 'Oat Milk Sub', price: 50, isAvailable: true },
          { name: 'Almond Milk Sub', price: 50, isAvailable: true },
          { name: 'Madagascar Vanilla Syrup', price: 30, isAvailable: true },
          { name: 'Whipped Cream', price: 30, isAvailable: true },
        ],
      },
    },
  });

  const pizzaAddons = await prisma.addonGroup.create({
    data: {
      cafeId: cafe.id,
      name: 'Extra Pizza Toppings',
      minSelect: 0,
      maxSelect: 4,
      required: false,
      options: {
        create: [
          { name: 'Buffalo Mozzarella Ball', price: 80, isAvailable: true },
          { name: 'White Truffle Oil Drizzle', price: 70, isAvailable: true },
          { name: 'Roasted Garlic & Jalapeños', price: 40, isAvailable: true },
          { name: 'Smoked Chicken Chunks', price: 90, isAvailable: true },
        ],
      },
    },
  });

  // 6. Categories & All 45 Items
  console.log('Seeding 8 Categories and 45 Dishes...');
  let totalItemsCreated = 0;
  let flatWhiteItem = null;
  let margheritaItem = null;
  let cheesecakeItem = null;

  for (let catIdx = 0; catIdx < seedData.length; catIdx++) {
    const c = seedData[catIdx];
    const category = await prisma.category.create({
      data: {
        cafeId: cafe.id,
        name: c.category,
        description: c.catDesc,
        image: c.catImage,
        sortOrder: catIdx + 1,
        isActive: true,
      },
    });

    for (let itemIdx = 0; itemIdx < c.items.length; itemIdx++) {
      const it = c.items[itemIdx];
      const menuItem = await prisma.menuItem.create({
        data: {
          cafeId: cafe.id,
          categoryId: category.id,
          name: it.name,
          description: it.description,
          basePrice: it.basePrice,
          image: it.image,
          foodType: it.foodType,
          isAvailable: true,
          preparationMinutes: it.prepMin || 10,
          isFeatured: it.isBestseller || false,
          isBestseller: it.isBestseller || false,
          sortOrder: itemIdx + 1,
        },
      });

      if (it.name === 'Nordic Flat White') flatWhiteItem = menuItem;
      if (it.name === 'Margherita Con Bufala D.O.P.') margheritaItem = menuItem;
      if (it.name === 'Lotus Biscoff Baked Cheesecake') cheesecakeItem = menuItem;

      // Variants
      if (it.variants && it.variants.length > 0) {
        for (const v of it.variants) {
          await prisma.itemVariant.create({
            data: {
              menuItemId: menuItem.id,
              name: v.name,
              price: v.price,
              isDefault: v.isDefault || false,
            },
          });
        }
      }

      // Addons
      if (c.category === 'Specialty Coffee') {
        await prisma.menuItemAddonGroup.create({
          data: { menuItemId: menuItem.id, addonGroupId: coffeeAddons.id },
        });
      } else if (c.category === 'Woodfired Artisan Pizza') {
        await prisma.menuItemAddonGroup.create({
          data: { menuItemId: menuItem.id, addonGroupId: pizzaAddons.id },
        });
      }

      totalItemsCreated++;
    }
  }
  console.log(`Successfully created ${totalItemsCreated} menu items!`);

  // 7. Dining Tables & QR Codes (T-01 to T-08)
  console.log('Generating Dining Tables & QR codes...');
  const tableData = [
    { number: 'T-01', capacity: 2, status: 'AVAILABLE' },
    { number: 'T-02', capacity: 4, status: 'OCCUPIED' },
    { number: 'T-03', capacity: 4, status: 'AVAILABLE' },
    { number: 'T-04', capacity: 6, status: 'AVAILABLE' },
    { number: 'T-05', capacity: 2, status: 'AVAILABLE' },
    { number: 'T-06', capacity: 8, status: 'AVAILABLE' },
    { number: 'T-07', capacity: 4, status: 'AVAILABLE' },
    { number: 'T-08', capacity: 4, status: 'AVAILABLE' },
  ];

  const createdTables = [];
  for (const t of tableData) {
    const qrToken = `qr_nordic_t_${t.number.toLowerCase().replace('-', '')}`;
    const tableQr = await prisma.qRCode.create({
      data: {
        cafeId: cafe.id,
        branchId: mainBranch.id,
        type: 'TABLE',
        token: qrToken,
        targetUrl: `/c/nordic-roast?table=${t.number}`,
        status: 'ACTIVE',
        scanCount: Math.floor(Math.random() * 40) + 10,
      },
    });

    const diningTable = await prisma.diningTable.create({
      data: {
        cafeId: cafe.id,
        branchId: mainBranch.id,
        tableNumber: t.number,
        capacity: t.capacity,
        status: t.status,
        qrCodeId: tableQr.id,
      },
    });

    await prisma.qRCode.update({
      where: { id: tableQr.id },
      data: { tableId: diningTable.id },
    });

    createdTables.push(diningTable);
  }

  // 8. Sample Customer & Live Orders for Cockpit & POS
  console.log('Creating Sample Orders...');
  const customer1 = await prisma.customer.create({
    data: { name: 'Simran Kaur', phone: '+91 98888 12345', email: 'simran@example.com' },
  });
  const customer2 = await prisma.customer.create({
    data: { name: 'Kabir Verma', phone: '+91 97777 54321', email: 'kabir@example.com' },
  });

  if (flatWhiteItem && cheesecakeItem) {
    const order1 = await prisma.order.create({
      data: {
        cafeId: cafe.id,
        branchId: mainBranch.id,
        customerId: customer1.id,
        tableId: createdTables[1].id,
        orderNumber: 'NC-9101',
        orderType: 'DINE_IN',
        tableNumber: 'T-02',
        status: 'PENDING',
        subtotal: 587,
        taxAmount: 29.35,
        packagingFee: 0,
        discountAmount: 0,
        totalAmount: 616.35,
        paymentStatus: 'PAID',
        paymentMethod: 'RAZORPAY',
        notes: 'Extra hot flat white please.',
        customerName: 'Simran Kaur',
        customerPhone: '+91 98888 12345',
        idempotencyKey: 'idem_nc_9101',
        items: {
          create: [
            {
              menuItemId: flatWhiteItem.id,
              itemName: flatWhiteItem.name,
              variantName: 'Grande (360ml)',
              quantity: 2,
              unitPrice: 209,
              subtotalPrice: 418,
            },
            {
              menuItemId: cheesecakeItem.id,
              itemName: cheesecakeItem.name,
              variantName: null,
              quantity: 1,
              unitPrice: 249,
              subtotalPrice: 249,
            },
          ],
        },
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order1.id,
        amount: 616.35,
        method: 'RAZORPAY',
        status: 'SUCCESS',
        gatewayReference: 'pay_demo_simran_123',
      },
    });
  }

  if (margheritaItem) {
    await prisma.order.create({
      data: {
        cafeId: cafe.id,
        branchId: mainBranch.id,
        customerId: customer2.id,
        tableId: createdTables[0].id,
        orderNumber: 'NC-9102',
        orderType: 'DINE_IN',
        tableNumber: 'T-01',
        status: 'PREPARING',
        subtotal: 389,
        taxAmount: 19.45,
        packagingFee: 0,
        discountAmount: 0,
        totalAmount: 408.45,
        paymentStatus: 'PENDING',
        paymentMethod: 'COUNTER',
        notes: 'Crispy crust on pizza.',
        customerName: 'Kabir Verma',
        customerPhone: '+91 97777 54321',
        idempotencyKey: 'idem_nc_9102',
        items: {
          create: [
            {
              menuItemId: margheritaItem.id,
              itemName: margheritaItem.name,
              variantName: '10-inch Personal',
              quantity: 1,
              unitPrice: 389,
              subtotalPrice: 389,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Seeding completed with 45 items successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
