import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Nord Cafe...');

  // Clean existing data in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.menuScan.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscriptionInvoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.invoice.deleteMany();
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
  await prisma.cafe.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // 1. Roles & Permissions
  console.log('Creating Roles & Permissions...');
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Platform Administrator with full unrestricted control' },
    { name: 'ADMIN_STAFF', description: 'Operations & Support staff for cafe onboarding' },
    { name: 'CAFE_OWNER', description: 'Cafe Owner with management access to their cafe' },
    { name: 'CAFE_MANAGER', description: 'Branch manager for day-to-day operations' },
    { name: 'KITCHEN_STAFF', description: 'Kitchen Display System operator for preparation' },
    { name: 'CUSTOMER', description: 'Public patron accessing digital menu and orders' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    const createdRole = await prisma.role.create({ data: r });
    roleMap[r.name] = createdRole.id;
  }

  const permissions = [
    { permissionKey: 'platform:manage', description: 'Manage whole platform' },
    { permissionKey: 'tenants:manage', description: 'Onboard and manage cafes' },
    { permissionKey: 'cafe:settings', description: 'Edit cafe settings and branding' },
    { permissionKey: 'menu:manage', description: 'Create and update menu items' },
    { permissionKey: 'orders:manage', description: 'Manage and update incoming orders' },
    { permissionKey: 'kds:view', description: 'View kitchen display system' },
    { permissionKey: 'tables:manage', description: 'Manage tables and QR codes' },
  ];

  for (const p of permissions) {
    const createdPerm = await prisma.permission.create({ data: p });
    // Link to SUPER_ADMIN
    await prisma.rolePermission.create({
      data: {
        roleId: roleMap['SUPER_ADMIN'],
        permissionId: createdPerm.id,
      },
    });
  }

  // 2. Subscription Plans
  console.log('Creating Subscription Plans...');
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Free',
      description: 'Ideal for small pop-ups or cafes trying out digital menus',
      monthlyPrice: 0,
      yearlyPrice: 0,
      itemLimit: 20,
      tableLimit: 5,
      branchLimit: 1,
      staffLimit: 1,
      qrLimit: 1,
      hasOnlineOrdering: false,
      hasCustomBranding: false,
      hasAnalytics: false,
      hasKds: false,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      description: 'Perfect for established cafes wanting live orders, custom branding & kitchen KDS',
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

  const businessPlan = await prisma.plan.create({
    data: {
      name: 'Business',
      description: 'For busy multi-branch cafes, restaurants & fast chains with advanced analytics',
      monthlyPrice: 999,
      yearlyPrice: 9999,
      itemLimit: 1000,
      tableLimit: 100,
      branchLimit: 10,
      staffLimit: 20,
      qrLimit: 100,
      hasOnlineOrdering: true,
      hasCustomBranding: true,
      hasAnalytics: true,
      hasKds: true,
    },
  });

  // 3. Platform Super Admin User
  console.log('Creating Super Admin User...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const ownerPasswordHash = await bcrypt.hash('owner123', salt);
  const managerPasswordHash = await bcrypt.hash('manager123', salt);
  const kitchenPasswordHash = await bcrypt.hash('kitchen123', salt);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Nord Admin Support',
      email: 'admin@nordcafe.com',
      phone: '+91 98765 00001',
      passwordHash: adminPasswordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: roleMap['SUPER_ADMIN'],
    },
  });

  // 4. Cafe 1: Nordic Roast & Bakery (Pro Plan)
  console.log('Creating Cafe: Nordic Roast & Bakery...');
  const cafeOwnerUser = await prisma.user.create({
    data: {
      name: 'Aarav Sharma',
      email: 'owner@nordicroast.com',
      phone: '+91 98140 12345',
      passwordHash: ownerPasswordHash,
      status: 'ACTIVE',
    },
  });

  const nordicRoastCafe = await prisma.cafe.create({
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
    data: {
      userId: cafeOwnerUser.id,
      roleId: roleMap['CAFE_OWNER'],
      cafeId: nordicRoastCafe.id,
    },
  });

  // Cafe Settings
  await prisma.cafeSetting.create({
    data: {
      cafeId: nordicRoastCafe.id,
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      language: 'en',
      orderingEnabled: true,
      dineInEnabled: true,
      takeawayEnabled: true,
      deliveryEnabled: true,
      taxRatePercent: 5.0, // 5% GST
      packagingFee: 20.0,
      minOrderValue: 99.0,
      autoAcceptOrders: false,
      requireCustomerPhone: true,
      soundNotifications: true,
    },
  });

  // Subscription for Nordic Roast
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const nordicSubscription = await prisma.subscription.create({
    data: {
      cafeId: nordicRoastCafe.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      billingInterval: 'YEARLY',
      startDate: new Date(),
      endDate: oneYearFromNow,
    },
  });

  await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: nordicSubscription.id,
      amount: 4999,
      status: 'PAID',
      invoiceNumber: 'INV-NORDIC-2026-001',
    },
  });

  // Branch
  const mainBranch = await prisma.branch.create({
    data: {
      cafeId: nordicRoastCafe.id,
      name: 'Sector 35 Heritage Branch',
      address: 'SCO 214-215, Inner Market, Sector 35-C, Chandigarh 160022',
      phone: '+91 98140 12345',
      latitude: 30.724,
      longitude: 76.768,
      status: 'ACTIVE',
      isMain: true,
    },
  });

  // Business Hours
  for (let day = 0; day < 7; day++) {
    await prisma.businessHour.create({
      data: {
        branchId: mainBranch.id,
        weekday: day,
        openingTime: '08:00',
        closingTime: '23:00',
        isClosed: false,
      },
    });
  }

  // Social Links
  await prisma.cafeSocialLink.createMany({
    data: [
      { cafeId: nordicRoastCafe.id, platform: 'instagram', url: 'https://instagram.com/nordicroast' },
      { cafeId: nordicRoastCafe.id, platform: 'whatsapp', url: 'https://wa.me/919814012345' },
      { cafeId: nordicRoastCafe.id, platform: 'google_maps', url: 'https://maps.google.com/?q=Sector+35+Chandigarh' },
    ],
  });

  // Staff members for Nordic Roast
  const managerUser = await prisma.user.create({
    data: {
      name: 'Rohan Mehra',
      email: 'manager@nordicroast.com',
      phone: '+91 98765 43210',
      passwordHash: managerPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.create({
    data: {
      userId: managerUser.id,
      roleId: roleMap['CAFE_MANAGER'],
      cafeId: nordicRoastCafe.id,
      branchId: mainBranch.id,
    },
  });

  const kitchenUser = await prisma.user.create({
    data: {
      name: 'Chef Harpreet Singh',
      email: 'kitchen@nordicroast.com',
      phone: '+91 98765 67890',
      passwordHash: kitchenPasswordHash,
      status: 'ACTIVE',
    },
  });
  await prisma.userRole.create({
    data: {
      userId: kitchenUser.id,
      roleId: roleMap['KITCHEN_STAFF'],
      cafeId: nordicRoastCafe.id,
      branchId: mainBranch.id,
    },
  });

  // Coupon
  await prisma.coupon.create({
    data: {
      cafeId: nordicRoastCafe.id,
      code: 'NORD10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 299,
      maxDiscount: 100,
      isActive: true,
    },
  });

  // 5. Menu Categories & Items for Nordic Roast
  console.log('Creating Categories and Food Items...');
  
  // Category 1: Artisanal Coffee
  const catCoffee = await prisma.category.create({
    data: {
      cafeId: nordicRoastCafe.id,
      name: 'Specialty Coffee',
      description: 'Single-origin beans roasted in-house with certified Barista craftsmanship',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80',
      sortOrder: 1,
      isActive: true,
    },
  });

  // Category 2: Neapolitan Pizza
  const catPizza = await prisma.category.create({
    data: {
      cafeId: nordicRoastCafe.id,
      name: 'Artisan Woodfired Pizza',
      description: '48-hour fermented sourdough crust with San Marzano tomatoes & fresh fior di latte',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
      sortOrder: 2,
      isActive: true,
    },
  });

  // Category 3: Gourmet Burgers
  const catBurger = await prisma.category.create({
    data: {
      cafeId: nordicRoastCafe.id,
      name: 'Burgers & Melts',
      description: 'Brioche buns, house-made patties, smoked relish and golden fries',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
      sortOrder: 3,
      isActive: true,
    },
  });

  // Category 4: Bakery & Desserts
  const catDessert = await prisma.category.create({
    data: {
      cafeId: nordicRoastCafe.id,
      name: 'Bakery & Sweets',
      description: 'French butter croissants, New York cheesecakes and chocolate truffles',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
      sortOrder: 4,
      isActive: true,
    },
  });

  // Category 5: Beverages & Coolers
  const catCoolers = await prisma.category.create({
    data: {
      cafeId: nordicRoastCafe.id,
      name: 'Coolers & Tonics',
      description: 'Hand-crafted iced teas, botanical fizz and seasonal fruit tonics',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
      sortOrder: 5,
      isActive: true,
    },
  });

  // Addon Groups
  const coffeeAddons = await prisma.addonGroup.create({
    data: {
      cafeId: nordicRoastCafe.id,
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
      cafeId: nordicRoastCafe.id,
      name: 'Extra Toppings',
      minSelect: 0,
      maxSelect: 4,
      required: false,
      options: {
        create: [
          { name: 'Buffalo Mozzarella Ball', price: 80, isAvailable: true },
          { name: 'Truffle Oil Drizzle', price: 70, isAvailable: true },
          { name: 'Roasted Garlic & Jalapeños', price: 40, isAvailable: true },
          { name: 'Smoked Chicken Chunks', price: 90, isAvailable: true },
        ],
      },
    },
  });

  // --- Food Items ---

  // 1. Classic Flat White
  const itemFlatWhite = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catCoffee.id,
      name: 'Nordic Flat White',
      description: 'Velvety micro-foam poured over a double ristretto blend of Ethiopian Yirgacheffe.',
      basePrice: 169,
      image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&q=80',
      foodType: 'VEG',
      isAvailable: true,
      preparationMinutes: 5,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 1,
      variants: {
        create: [
          { name: 'Regular (240ml)', price: 169, isDefault: true },
          { name: 'Grande (360ml)', price: 209, isDefault: false },
        ],
      },
      menuItemAddonGroups: {
        create: [{ addonGroupId: coffeeAddons.id }],
      },
    },
  });

  // 2. Cappuccino
  const itemCappuccino = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catCoffee.id,
      name: 'Classic Creamy Cappuccino',
      description: 'Rich espresso balanced with smooth steamed whole milk topped with dense cocoa dusted foam.',
      basePrice: 149,
      image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=80',
      foodType: 'VEG',
      isAvailable: true,
      preparationMinutes: 5,
      isFeatured: false,
      isBestseller: true,
      sortOrder: 2,
      variants: {
        create: [
          { name: 'Regular', price: 149, isDefault: true },
          { name: 'Large', price: 189, isDefault: false },
        ],
      },
      menuItemAddonGroups: {
        create: [{ addonGroupId: coffeeAddons.id }],
      },
    },
  });

  // 3. Iced Spanish Latte
  const itemSpanishLatte = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catCoffee.id,
      name: 'Iced Spanish Latte',
      description: 'Subtly sweetened condensed milk infused with cold brew and topped with fresh cold milk.',
      basePrice: 199,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80',
      foodType: 'VEG',
      isAvailable: true,
      preparationMinutes: 6,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 3,
      variants: {
        create: [
          { name: 'Standard (350ml)', price: 199, isDefault: true },
          { name: 'Jumbo (500ml)', price: 239, isDefault: false },
        ],
      },
      menuItemAddonGroups: {
        create: [{ addonGroupId: coffeeAddons.id }],
      },
    },
  });

  // 4. Margherita Con Bufala Pizza
  const itemMargherita = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catPizza.id,
      name: 'Margherita Con Bufala',
      description: 'Fresh Italian buffalo mozzarella, crushed basil, San Marzano tomato reduction & EVOO.',
      basePrice: 389,
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
      foodType: 'VEG',
      isAvailable: true,
      preparationMinutes: 15,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 1,
      variants: {
        create: [
          { name: '10 inch Medium', price: 389, isDefault: true },
          { name: '12 inch Large', price: 499, isDefault: false },
        ],
      },
      menuItemAddonGroups: {
        create: [{ addonGroupId: pizzaAddons.id }],
      },
    },
  });

  // 5. Truffle Wild Mushroom Pizza
  const itemTrufflePizza = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catPizza.id,
      name: 'Black Truffle & Shiitake Pizza',
      description: 'White base with garlic crema, sautéed shiitake & button mushrooms, fontina and white truffle drizzle.',
      basePrice: 479,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
      foodType: 'VEG',
      isAvailable: true,
      preparationMinutes: 18,
      isFeatured: true,
      isBestseller: false,
      sortOrder: 2,
      variants: {
        create: [
          { name: '10 inch', price: 479, isDefault: true },
          { name: '12 inch', price: 599, isDefault: false },
        ],
      },
      menuItemAddonGroups: {
        create: [{ addonGroupId: pizzaAddons.id }],
      },
    },
  });

  // 6. Smoked Pepperoni Pizza
  const itemPepperoni = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catPizza.id,
      name: 'Rustic Pork Pepperoni Pizza',
      description: 'Slow-cured spicy pork pepperoni slices crisped to perfection over melted mozzarella and spicy marinara.',
      basePrice: 529,
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
      foodType: 'NON_VEG',
      isAvailable: true,
      preparationMinutes: 16,
      isFeatured: false,
      isBestseller: true,
      sortOrder: 3,
      variants: {
        create: [
          { name: '10 inch', price: 529, isDefault: true },
          { name: '12 inch', price: 659, isDefault: false },
        ],
      },
    },
  });

  // 7. Nordic Truffle Smash Burger
  const itemBurger = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catBurger.id,
      name: 'Smoked Cheddar Smash Burger',
      description: 'Double smashed crispy beef/veg patty, vintage cheddar, caramelized onions, truffle mayo on toasted brioche.',
      basePrice: 329,
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80',
      foodType: 'NON_VEG',
      isAvailable: true,
      preparationMinutes: 12,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 1,
      variants: {
        create: [
          { name: 'Single Patty', price: 329, isDefault: true },
          { name: 'Double Patty', price: 419, isDefault: false },
        ],
      },
    },
  });

  // 8. Lotus Biscoff Cheesecake
  const itemCheesecake = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catDessert.id,
      name: 'Lotus Biscoff Baked Cheesecake',
      description: 'Decadent creamy Philadelphia cream cheese cake on a spiced speculoos cookie crust with warm spread topping.',
      basePrice: 249,
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80',
      foodType: 'EGG',
      isAvailable: true,
      preparationMinutes: 3,
      isFeatured: true,
      isBestseller: true,
      sortOrder: 1,
    },
  });

  // 9. Handcrafted Tiramisu
  const itemTiramisu = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catDessert.id,
      name: 'Classic Espresso Tiramisu',
      description: 'Savoiardi ladyfingers soaked in our signature house espresso and layered with mascarpone cream & Valrhona cocoa.',
      basePrice: 269,
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80',
      foodType: 'EGG',
      isAvailable: true,
      preparationMinutes: 3,
      isFeatured: false,
      isBestseller: true,
      sortOrder: 2,
    },
  });

  // 10. Berry Hibiscus Cooler
  const itemCooler = await prisma.menuItem.create({
    data: {
      cafeId: nordicRoastCafe.id,
      categoryId: catCoolers.id,
      name: 'Wild Berry & Hibiscus Iced Brew',
      description: 'Brewed Egyptian hibiscus petals with wild raspberries, fresh mint leaves and sparkling soda.',
      basePrice: 179,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
      foodType: 'VEG',
      isAvailable: true,
      preparationMinutes: 4,
      isFeatured: false,
      isBestseller: false,
      sortOrder: 1,
    },
  });

  // 6. Dining Tables & QR Codes
  console.log('Generating Tables & QR codes...');
  
  // General Cafe QR
  const cafeGeneralQR = await prisma.qRCode.create({
    data: {
      cafeId: nordicRoastCafe.id,
      branchId: mainBranch.id,
      type: 'CAFE_GENERAL',
      token: 'qr_nordic_main_general',
      targetUrl: `/c/nordic-roast`,
      status: 'ACTIVE',
      scanCount: 342,
    },
  });

  // Create 6 Tables with QR codes
  const tableData = [
    { number: 'T-01', capacity: 2, status: 'AVAILABLE' },
    { number: 'T-02', capacity: 4, status: 'OCCUPIED' },
    { number: 'T-03', capacity: 4, status: 'AVAILABLE' },
    { number: 'T-04', capacity: 6, status: 'AVAILABLE' },
    { number: 'T-05', capacity: 2, status: 'AVAILABLE' },
    { number: 'T-06', capacity: 8, status: 'AVAILABLE' },
  ];

  const createdTables: any[] = [];
  for (const t of tableData) {
    const qrToken = `qr_nordic_t_${t.number.toLowerCase().replace('-', '')}`;
    const tableQr = await prisma.qRCode.create({
      data: {
        cafeId: nordicRoastCafe.id,
        branchId: mainBranch.id,
        type: 'TABLE',
        token: qrToken,
        targetUrl: `/c/nordic-roast?table=${t.number}`,
        status: 'ACTIVE',
        scanCount: Math.floor(Math.random() * 50) + 10,
      },
    });

    const diningTable = await prisma.diningTable.create({
      data: {
        cafeId: nordicRoastCafe.id,
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

  // 7. Seed Customer and Realistic Orders across states
  console.log('Creating Orders and Kitchen data...');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Simran Kaur',
      phone: '+91 98888 12345',
      email: 'simran@example.com',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Kabir Verma',
      phone: '+91 97777 54321',
      email: 'kabir@example.com',
    },
  });

  // Order 1: New / Pending Order (Dine-in at Table T-02)
  const order1 = await prisma.order.create({
    data: {
      cafeId: nordicRoastCafe.id,
      branchId: mainBranch.id,
      customerId: customer1.id,
      tableId: createdTables[1].id,
      orderNumber: 'NC-9101',
      orderType: 'DINE_IN',
      tableNumber: 'T-02',
      status: 'PENDING',
      subtotal: 538,
      taxAmount: 26.9,
      packagingFee: 0,
      discountAmount: 0,
      totalAmount: 564.9,
      paymentStatus: 'PAID',
      paymentMethod: 'RAZORPAY',
      notes: 'Please make flat white extra hot.',
      customerName: 'Simran Kaur',
      customerPhone: '+91 98888 12345',
      idempotencyKey: 'idem_nc_9101',
      items: {
        create: [
          {
            menuItemId: itemFlatWhite.id,
            itemName: 'Nordic Flat White',
            variantName: 'Grande (360ml)',
            quantity: 2,
            unitPrice: 209,
            subtotalPrice: 418,
            addons: {
              create: [
                { addonName: 'Extra Double Shot Espresso', price: 40 },
                { addonName: 'Oat Milk Sub', price: 50 },
              ],
            },
          },
          {
            menuItemId: itemCheesecake.id,
            itemName: 'Lotus Biscoff Baked Cheesecake',
            variantName: null,
            quantity: 1,
            unitPrice: 249,
            subtotalPrice: 249,
          },
        ],
      },
      statusHistory: {
        create: [
          { oldStatus: null, newStatus: 'PENDING', changedBy: 'Customer', note: 'Order placed via Table QR' },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: 564.9,
      method: 'RAZORPAY',
      status: 'SUCCESS',
      gatewayReference: 'pay_demo_simran_123',
      razorpayOrderId: 'order_rzp_9101',
      razorpayPaymentId: 'pay_rzp_9101_ok',
    },
  });

  // Order 2: Preparing Order (Kitchen Display System live)
  const order2 = await prisma.order.create({
    data: {
      cafeId: nordicRoastCafe.id,
      branchId: mainBranch.id,
      customerId: customer2.id,
      tableId: createdTables[0].id,
      orderNumber: 'NC-9102',
      orderType: 'DINE_IN',
      tableNumber: 'T-01',
      status: 'PREPARING',
      subtotal: 718,
      taxAmount: 35.9,
      packagingFee: 0,
      discountAmount: 0,
      totalAmount: 753.9,
      paymentStatus: 'PENDING',
      paymentMethod: 'COUNTER',
      notes: 'Crispy crust on pizza please.',
      customerName: 'Kabir Verma',
      customerPhone: '+91 97777 54321',
      idempotencyKey: 'idem_nc_9102',
      items: {
        create: [
          {
            menuItemId: itemMargherita.id,
            itemName: 'Margherita Con Bufala',
            variantName: '10 inch Medium',
            quantity: 1,
            unitPrice: 389,
            subtotalPrice: 389,
          },
          {
            menuItemId: itemBurger.id,
            itemName: 'Smoked Cheddar Smash Burger',
            variantName: 'Single Patty',
            quantity: 1,
            unitPrice: 329,
            subtotalPrice: 329,
          },
        ],
      },
      statusHistory: {
        create: [
          { oldStatus: null, newStatus: 'PENDING', changedBy: 'Customer' },
          { oldStatus: 'PENDING', newStatus: 'ACCEPTED', changedBy: 'Rohan (Manager)' },
          { oldStatus: 'ACCEPTED', newStatus: 'PREPARING', changedBy: 'Chef Harpreet' },
        ],
      },
    },
  });

  // Order 3: Completed Order with Invoice
  const order3 = await prisma.order.create({
    data: {
      cafeId: nordicRoastCafe.id,
      branchId: mainBranch.id,
      orderNumber: 'NC-9100',
      orderType: 'TAKEAWAY',
      tableNumber: null,
      status: 'COMPLETED',
      subtotal: 448,
      taxAmount: 22.4,
      packagingFee: 20,
      discountAmount: 44.8, // 10% coupon used
      totalAmount: 445.6,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      notes: 'Ready for pickup at 11:30 AM',
      customerName: 'Priya Joshi',
      customerPhone: '+91 98111 22334',
      items: {
        create: [
          {
            menuItemId: itemCappuccino.id,
            itemName: 'Classic Creamy Cappuccino',
            variantName: 'Large',
            quantity: 1,
            unitPrice: 189,
            subtotalPrice: 189,
          },
          {
            menuItemId: itemTiramisu.id,
            itemName: 'Classic Espresso Tiramisu',
            variantName: null,
            quantity: 1,
            unitPrice: 269,
            subtotalPrice: 269,
          },
        ],
      },
      statusHistory: {
        create: [
          { oldStatus: null, newStatus: 'PENDING', changedBy: 'Customer' },
          { oldStatus: 'PENDING', newStatus: 'ACCEPTED', changedBy: 'Manager' },
          { oldStatus: 'ACCEPTED', newStatus: 'READY', changedBy: 'Kitchen' },
          { oldStatus: 'READY', newStatus: 'COMPLETED', changedBy: 'Manager' },
        ],
      },
      invoice: {
        create: {
          invoiceNumber: 'INV-2026-9100',
          total: 445.6,
        },
      },
    },
  });

  // Cafe 2: The Matcha Lab (Business Plan)
  console.log('Creating Cafe: The Matcha Lab...');
  const matchaOwner = await prisma.user.create({
    data: {
      name: 'Kenji Tanaka',
      email: 'owner@matchalab.com',
      phone: '+91 98222 33445',
      passwordHash: ownerPasswordHash,
      status: 'ACTIVE',
    },
  });

  const matchaCafe = await prisma.cafe.create({
    data: {
      ownerId: matchaOwner.id,
      name: 'The Matcha Lab',
      slug: 'matcha-lab',
      logo: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1600&q=80',
      description: 'Kyoto ceremonial grade matcha whisks, strawberry cloud matchas & Japanese cloud cheesecakes.',
      status: 'ACTIVE',
      themeColor: '#059669',
      secondaryColor: '#ECFDF5',
      fontFamily: 'Inter',
      enableDarkMode: false,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: matchaOwner.id,
      roleId: roleMap['CAFE_OWNER'],
      cafeId: matchaCafe.id,
    },
  });

  await prisma.cafeSetting.create({
    data: {
      cafeId: matchaCafe.id,
      currency: 'INR',
      currencySymbol: '₹',
      taxRatePercent: 5.0,
      packagingFee: 15.0,
      minOrderValue: 150.0,
    },
  });

  await prisma.subscription.create({
    data: {
      cafeId: matchaCafe.id,
      planId: businessPlan.id,
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      startDate: new Date(),
      endDate: oneYearFromNow,
    },
  });

  const matchaBranch = await prisma.branch.create({
    data: {
      cafeId: matchaCafe.id,
      name: 'Cyber City Hub',
      address: 'Tower B, Ground Floor, Sector 67, Mohali',
      phone: '+91 98222 33445',
      status: 'ACTIVE',
      isMain: true,
    },
  });

  const matchaCat = await prisma.category.create({
    data: {
      cafeId: matchaCafe.id,
      name: 'Ceremonial Matcha',
      description: 'Stone-milled Uji green tea whisked with bamboo chasen',
      image: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=600&q=80',
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      cafeId: matchaCafe.id,
      categoryId: matchaCat.id,
      name: 'Strawberry Cloud Ceremonial Latte',
      description: 'Hand-whisked organic Uji matcha over crushed fresh strawberry compote and cold velvety milk.',
      basePrice: 289,
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&q=80',
      foodType: 'VEG',
      isAvailable: true,
      isFeatured: true,
      isBestseller: true,
    },
  });

  await prisma.qRCode.create({
    data: {
      cafeId: matchaCafe.id,
      branchId: matchaBranch.id,
      type: 'CAFE_GENERAL',
      token: 'qr_matcha_main',
      targetUrl: `/c/matcha-lab`,
      status: 'ACTIVE',
      scanCount: 180,
    },
  });

  // Cafe 3: Brew & Bite Cafe (Free Plan - pending setup)
  console.log('Creating Cafe: Brew & Bite Cafe...');
  const brewOwner = await prisma.user.create({
    data: {
      name: 'Vikram Seth',
      email: 'owner@brewandbite.com',
      phone: '+91 98333 44556',
      passwordHash: ownerPasswordHash,
      status: 'ACTIVE',
    },
  });

  const brewCafe = await prisma.cafe.create({
    data: {
      ownerId: brewOwner.id,
      name: 'Brew & Bite Bistro',
      slug: 'brew-and-bite',
      logo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
      coverImage: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1600&q=80',
      description: 'Casual neighborhood bistro serving all-day breakfast, artisanal bagels and cold brews.',
      status: 'ACTIVE',
      themeColor: '#EA580C',
      secondaryColor: '#FFF7ED',
      fontFamily: 'Inter',
    },
  });

  await prisma.userRole.create({
    data: {
      userId: brewOwner.id,
      roleId: roleMap['CAFE_OWNER'],
      cafeId: brewCafe.id,
    },
  });

  await prisma.cafeSetting.create({
    data: {
      cafeId: brewCafe.id,
      currency: 'INR',
      currencySymbol: '₹',
      taxRatePercent: 5.0,
      packagingFee: 10.0,
      minOrderValue: 50.0,
    },
  });

  await prisma.subscription.create({
    data: {
      cafeId: brewCafe.id,
      planId: freePlan.id,
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      startDate: new Date(),
      endDate: oneYearFromNow,
    },
  });

  // Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'PLATFORM_INITIALIZATION',
        metadata: JSON.stringify({ system: 'Nord Cafe v1.0.0', initializedAt: new Date() }),
      },
      {
        userId: cafeOwnerUser.id,
        cafeId: nordicRoastCafe.id,
        action: 'MENU_UPDATE',
        metadata: JSON.stringify({ updatedItems: 10, categoryCount: 5 }),
      },
    ],
  });

  console.log('✅ Database successfully seeded with rich production demo data!');
  console.log('------------------------------------------------------------');
  console.log('Credentials:');
  console.log('👑 Super Admin:  admin@nordcafe.com / admin123');
  console.log('☕ Cafe Owner:   owner@nordicroast.com / owner123');
  console.log('💼 Cafe Manager: manager@nordicroast.com / manager123');
  console.log('👨‍🍳 Kitchen:      kitchen@nordicroast.com / kitchen123');
  console.log('Public Digital Menu: http://localhost:3000/c/nordic-roast');
  console.log('------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
