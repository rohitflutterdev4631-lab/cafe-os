import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCafeOsData() {
  console.log('⚡ Seeding CAFE OS Extended Ecosystem Data...');

  const cafe = await prisma.cafe.findFirst({
    where: { slug: 'nordic-roast' },
    include: { branches: true, menuItems: true },
  });

  if (!cafe) {
    console.error('Cafe nordic-roast not found. Please run base seed first.');
    return;
  }

  const branch = cafe.branches[0];

  // 1. Suppliers
  console.log('📦 Seeding Suppliers...');
  const supplier1 = await prisma.supplier.upsert({
    where: { id: 'supp-beancraft-01' },
    update: {},
    create: {
      id: 'supp-beancraft-01',
      cafeId: cafe.id,
      name: 'BeanCraft Roasters Co.',
      contactPerson: 'Marcus Sterling',
      email: 'orders@beancraft.com',
      phone: '+91 98201 44552',
      address: 'Estate 14, Roastery Lane, Chikmagalur',
      categories: 'Specialty Coffee Beans, Filter Papers',
      paymentTerms: 'NET_30',
      rating: 4.9,
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { id: 'supp-puremeadow-02' },
    update: {},
    create: {
      id: 'supp-puremeadow-02',
      cafeId: cafe.id,
      name: 'PureMeadow Organic Dairy',
      contactPerson: 'Anita Desai',
      email: 'supply@puremeadow.farm',
      phone: '+91 98112 33441',
      address: 'Farmville Sector 4, Pune Suburbs',
      categories: 'Organic Whole Milk, Oat Milk, Whipping Cream',
      paymentTerms: 'NET_15',
      rating: 4.8,
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { id: 'supp-ecopack-03' },
    update: {},
    create: {
      id: 'supp-ecopack-03',
      cafeId: cafe.id,
      name: 'EcoPack Green Solutions',
      contactPerson: 'David Chen',
      email: 'sales@ecopackgreen.in',
      phone: '+91 98765 12098',
      address: 'Industrial Plot 99, Navi Mumbai',
      categories: 'Biodegradable Cups, Straws, Carry Bags, Napkins',
      paymentTerms: 'COD',
      rating: 4.7,
    },
  });

  // 2. Inventory Items
  console.log('🌾 Seeding Inventory Items & Stock...');
  const inventoryData = [
    {
      id: 'inv-arabica-beans',
      name: 'Ethiopian Yirgacheffe Arabica Beans',
      sku: 'BN-ETH-01',
      category: 'BEANS',
      currentStock: 18500, // 18.5 kg in grams
      minStock: 5000,
      maxStock: 50000,
      unit: 'GRAM',
      costPerUnit: 1.45, // ₹1.45 / gram = ₹1450/kg
      supplierId: supplier1.id,
      batchNumber: 'ETH-2026-B8',
      expiryDate: new Date('2027-04-15'),
      isLowStock: false,
    },
    {
      id: 'inv-colombian-beans',
      name: 'Colombian Supremo Dark Roast',
      sku: 'BN-COL-02',
      category: 'BEANS',
      currentStock: 4200, // 4.2 kg (Low stock alert!)
      minStock: 6000,
      maxStock: 40000,
      unit: 'GRAM',
      costPerUnit: 1.25,
      supplierId: supplier1.id,
      batchNumber: 'COL-2026-C2',
      expiryDate: new Date('2027-03-20'),
      isLowStock: true,
    },
    {
      id: 'inv-organic-milk',
      name: 'PureMeadow Farm Whole Milk',
      sku: 'DRY-MLK-01',
      category: 'DAIRY',
      currentStock: 32000, // 32 Liters in ml
      minStock: 15000,
      maxStock: 80000,
      unit: 'ML',
      costPerUnit: 0.08, // ₹80/liter
      supplierId: supplier2.id,
      batchNumber: 'MK-NOV24',
      expiryDate: new Date('2026-11-28'),
      isLowStock: false,
    },
    {
      id: 'inv-oat-milk',
      name: 'Barista Oat Milk Premium',
      sku: 'DRY-OAT-02',
      category: 'DAIRY',
      currentStock: 8000, // 8 Liters in ml
      minStock: 10000,
      maxStock: 30000,
      unit: 'ML',
      costPerUnit: 0.22, // ₹220/liter
      supplierId: supplier2.id,
      batchNumber: 'OAT-24A',
      expiryDate: new Date('2027-01-10'),
      isLowStock: true,
    },
    {
      id: 'inv-caramel-syrup',
      name: 'Madagascar Artisan Caramel Syrup',
      sku: 'SYR-CAR-01',
      category: 'SYRUPS',
      currentStock: 4500, // 4.5 L in ml
      minStock: 2000,
      maxStock: 12000,
      unit: 'ML',
      costPerUnit: 0.45,
      supplierId: supplier1.id,
      batchNumber: 'SYR-98',
      expiryDate: new Date('2027-08-30'),
      isLowStock: false,
    },
    {
      id: 'inv-sugar-demerara',
      name: 'Raw Demerara Cane Sugar',
      sku: 'SGR-DEM-01',
      category: 'CONSUMABLES',
      currentStock: 24000, // 24 kg in grams
      minStock: 10000,
      maxStock: 50000,
      unit: 'GRAM',
      costPerUnit: 0.09,
      supplierId: supplier3.id,
      batchNumber: 'SG-901',
      expiryDate: new Date('2028-01-01'),
      isLowStock: false,
    },
    {
      id: 'inv-cups-250',
      name: 'EcoKraft Ripple Hot Cups (250ml)',
      sku: 'PKG-CP8-01',
      category: 'PACKAGING',
      currentStock: 850,
      minStock: 300,
      maxStock: 2000,
      unit: 'PIECE',
      costPerUnit: 3.5,
      supplierId: supplier3.id,
      batchNumber: 'CP-250-9',
      isLowStock: false,
    },
    {
      id: 'inv-cups-350',
      name: 'EcoKraft Ripple Hot Cups (350ml)',
      sku: 'PKG-CP12-02',
      category: 'PACKAGING',
      currentStock: 620,
      minStock: 300,
      maxStock: 2000,
      unit: 'PIECE',
      costPerUnit: 4.2,
      supplierId: supplier3.id,
      batchNumber: 'CP-350-4',
      isLowStock: false,
    },
    {
      id: 'inv-sourdough-bread',
      name: 'Fresh Fermented Sourdough Loaf',
      sku: 'BKR-SRD-01',
      category: 'BAKERY',
      currentStock: 18,
      minStock: 8,
      maxStock: 35,
      unit: 'PIECE',
      costPerUnit: 95.0,
      supplierId: supplier1.id,
      expiryDate: new Date('2026-11-26'),
      isLowStock: false,
    },
  ];

  for (const inv of inventoryData) {
    await prisma.inventoryItem.upsert({
      where: { cafeId_sku: { cafeId: cafe.id, sku: inv.sku } },
      update: inv,
      create: { ...inv, cafeId: cafe.id, branchId: branch?.id },
    });
  }

  // 3. Recipe Linkages
  console.log('🧪 Linking Menu Items to Recipe Ingredients...');
  // Find menu items
  const espressoItem = cafe.menuItems.find((m) => m.name.toLowerCase().includes('espresso'));
  const cappuccinoItem = cafe.menuItems.find((m) => m.name.toLowerCase().includes('cappuccino'));
  const latteItem = cafe.menuItems.find((m) => m.name.toLowerCase().includes('latte'));

  if (espressoItem) {
    await prisma.recipeIngredient.deleteMany({ where: { menuItemId: espressoItem.id } });
    await prisma.recipeIngredient.createMany({
      data: [
        {
          menuItemId: espressoItem.id,
          inventoryItemId: 'inv-arabica-beans',
          quantity: 18.5, // 18.5 grams beans per double shot
          unit: 'GRAM',
        },
        {
          menuItemId: espressoItem.id,
          inventoryItemId: 'inv-cups-250',
          quantity: 1,
          unit: 'PIECE',
        },
      ],
    });
  }

  if (cappuccinoItem) {
    await prisma.recipeIngredient.deleteMany({ where: { menuItemId: cappuccinoItem.id } });
    await prisma.recipeIngredient.createMany({
      data: [
        {
          menuItemId: cappuccinoItem.id,
          inventoryItemId: 'inv-arabica-beans',
          quantity: 18.5,
          unit: 'GRAM',
        },
        {
          menuItemId: cappuccinoItem.id,
          inventoryItemId: 'inv-organic-milk',
          quantity: 180, // 180ml steamed whole milk
          unit: 'ML',
        },
        {
          menuItemId: cappuccinoItem.id,
          inventoryItemId: 'inv-cups-250',
          quantity: 1,
          unit: 'PIECE',
        },
      ],
    });
  }

  if (latteItem) {
    await prisma.recipeIngredient.deleteMany({ where: { menuItemId: latteItem.id } });
    await prisma.recipeIngredient.createMany({
      data: [
        {
          menuItemId: latteItem.id,
          inventoryItemId: 'inv-arabica-beans',
          quantity: 18.5,
          unit: 'GRAM',
        },
        {
          menuItemId: latteItem.id,
          inventoryItemId: 'inv-organic-milk',
          quantity: 240,
          unit: 'ML',
        },
        {
          menuItemId: latteItem.id,
          inventoryItemId: 'inv-cups-350',
          quantity: 1,
          unit: 'PIECE',
        },
      ],
    });
  }

  // 4. Purchase Orders
  console.log('📑 Seeding Purchase Orders...');
  const po1 = await prisma.purchaseOrder.upsert({
    where: { poNumber: 'PO-2026-081' },
    update: {},
    create: {
      cafeId: cafe.id,
      branchId: branch?.id,
      supplierId: supplier1.id,
      poNumber: 'PO-2026-081',
      status: 'RECEIVED',
      totalAmount: 18500,
      orderDate: new Date('2026-11-15'),
      expectedDate: new Date('2026-11-18'),
      receivedDate: new Date('2026-11-18'),
      notes: 'Monthly batch of Yirgacheffe beans + decaf origin beans.',
      items: {
        create: [
          {
            inventoryItemId: 'inv-arabica-beans',
            quantity: 10000,
            unitCost: 1.45,
            totalCost: 14500,
            receivedQuantity: 10000,
          },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrder.upsert({
    where: { poNumber: 'PO-2026-094' },
    update: {},
    create: {
      cafeId: cafe.id,
      branchId: branch?.id,
      supplierId: supplier1.id,
      poNumber: 'PO-2026-094',
      status: 'APPROVED',
      totalAmount: 12500,
      orderDate: new Date('2026-11-23'),
      expectedDate: new Date('2026-11-26'),
      notes: 'Urgent restock of Colombian Supremo Dark Roast.',
      items: {
        create: [
          {
            inventoryItemId: 'inv-colombian-beans',
            quantity: 10000,
            unitCost: 1.25,
            totalCost: 12500,
            receivedQuantity: 0,
          },
        ],
      },
    },
  });

  // 5. Reservations & Waitlist
  console.log('📅 Seeding Reservations & Waitlist...');
  const tables = await prisma.diningTable.findMany({ where: { cafeId: cafe.id } });

  await prisma.reservation.deleteMany({ where: { cafeId: cafe.id } });
  await prisma.reservation.createMany({
    data: [
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        customerName: 'Priya Narang',
        customerPhone: '+91 98200 99881',
        customerEmail: 'priya.narang@gmail.com',
        guestCount: 4,
        date: '2026-11-24',
        time: '19:30',
        tableId: tables[0]?.id,
        status: 'CONFIRMED',
        specialRequests: 'Window seat preferred, celebrating birthday.',
      },
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        customerName: 'Kunal Kapoor',
        customerPhone: '+91 98111 22334',
        customerEmail: 'kunal@zenithlabs.io',
        guestCount: 2,
        date: '2026-11-24',
        time: '20:00',
        tableId: tables[1]?.id,
        status: 'CONFIRMED',
        specialRequests: 'Quiet area for business catchup.',
      },
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        customerName: 'Meera Sen',
        customerPhone: '+91 99300 44556',
        customerEmail: 'meera.sen@designco.com',
        guestCount: 6,
        date: '2026-11-24',
        time: '18:15',
        tableId: tables[2]?.id,
        status: 'SEATED',
        specialRequests: 'Need high chair for toddler.',
      },
    ],
  });

  await prisma.waitlistEntry.deleteMany({ where: { cafeId: cafe.id } });
  await prisma.waitlistEntry.createMany({
    data: [
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        customerName: 'Devansh Verma',
        customerPhone: '+91 97690 11223',
        guestCount: 2,
        queueNumber: 1,
        status: 'NOTIFIED',
        estimatedWaitMinutes: 5,
        notes: 'Sitting at the entrance bar stool waiting for Table 4.',
      },
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        customerName: 'Ananya Roy',
        customerPhone: '+91 98213 55667',
        guestCount: 3,
        queueNumber: 2,
        status: 'WAITING',
        estimatedWaitMinutes: 15,
        notes: 'Outside terrace preference.',
      },
    ],
  });

  // 6. Cash Shifts
  console.log('💵 Seeding Shift Management & Cash Drawers...');
  await prisma.cashShift.deleteMany({ where: { cafeId: cafe.id } });
  await prisma.cashShift.create({
    data: {
      cafeId: cafe.id,
      branchId: branch?.id,
      staffName: 'Rohan Mehra',
      shiftType: 'MORNING',
      openingCash: 5000.0,
      closingCash: null,
      expectedCash: 12450.0,
      cashSales: 7450.0,
      upiSales: 16800.0,
      cardSales: 11200.0,
      cashDifference: 0,
      status: 'OPEN',
      openedAt: new Date('2026-11-24T08:00:00Z'),
      notes: 'Morning shift operational. Till verified with initial float ₹5,000.',
    },
  });

  // 7. Operating Expenses
  console.log('📉 Seeding Expenses & COGS...');
  await prisma.expense.deleteMany({ where: { cafeId: cafe.id } });
  await prisma.expense.createMany({
    data: [
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        category: 'RENT',
        title: 'Monthly High-Street Store Lease (Nov 2026)',
        amount: 85000,
        date: new Date('2026-11-01'),
        paymentMethod: 'BANK_TRANSFER',
        status: 'APPROVED',
        approvedBy: 'Aarav Sharma',
        notes: 'Main commercial lease payment via RTGS.',
      },
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        category: 'ELECTRICITY',
        title: 'Commercial Power & HVAC Utility Bill',
        amount: 22400,
        date: new Date('2026-11-08'),
        paymentMethod: 'BANK_TRANSFER',
        status: 'APPROVED',
        approvedBy: 'Aarav Sharma',
        notes: 'Includes kitchen heavy-draw line and walk-in chiller.',
      },
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        category: 'SALARY',
        title: 'Bi-Weekly Barista & Kitchen Team Stipend',
        amount: 64000,
        date: new Date('2026-11-15'),
        paymentMethod: 'BANK_TRANSFER',
        status: 'APPROVED',
        approvedBy: 'Aarav Sharma',
        notes: 'Paid to 4 baristas and 2 kitchen assistants.',
      },
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        category: 'MAINTENANCE',
        title: 'Water Filtration Reverse Osmosis Membrane Replacement',
        amount: 4800,
        date: new Date('2026-11-19'),
        paymentMethod: 'UPI',
        status: 'APPROVED',
        approvedBy: 'Rohan Mehra',
        notes: 'Ensures TDS 120-140 ppm ideal for espresso extraction.',
      },
    ],
  });

  // 8. Equipment & Maintenance
  console.log('☕ Seeding Cafe Equipment & Machinery...');
  await prisma.equipment.deleteMany({ where: { cafeId: cafe.id } });
  const espressoMachine = await prisma.equipment.create({
    data: {
      cafeId: cafe.id,
      branchId: branch?.id,
      name: 'La Marzocco Linea PB 2-Group AV',
      model: 'Linea PB AV 2025',
      serialNumber: 'LM-PB-994218',
      category: 'ESPRESSO_MACHINE',
      purchaseDate: new Date('2025-02-10'),
      warrantyExpiry: new Date('2027-02-10'),
      lastServiceDate: new Date('2026-10-15'),
      nextServiceDate: new Date('2027-01-15'),
      status: 'OPERATIONAL',
      serviceVendor: 'Kaapi Solutions Services',
      contactPhone: '+91 98450 11992',
      notes: 'Dual boiler PID calibrated to 93.5°C. Boiler pressure 9.0 bar steady.',
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      equipmentId: espressoMachine.id,
      serviceDate: new Date('2026-10-15'),
      cost: 3500,
      description: 'Grouphead gasket replacement, shower screen descale, and steam wand seal rebuild.',
      technician: 'Suresh Kumar (Kaapi Solutions)',
      nextServiceDue: new Date('2027-01-15'),
    },
  });

  await prisma.equipment.create({
    data: {
      cafeId: cafe.id,
      branchId: branch?.id,
      name: 'Mahlkönig EK43 All-Round Coffee Grinder',
      model: 'EK43 Matte Black',
      serialNumber: 'MK-EK-48201',
      category: 'GRINDER',
      purchaseDate: new Date('2025-02-15'),
      warrantyExpiry: new Date('2027-02-15'),
      lastServiceDate: new Date('2026-09-01'),
      nextServiceDate: new Date('2026-12-01'),
      status: 'OPERATIONAL',
      serviceVendor: 'Kaapi Solutions Services',
      notes: '98mm cast steel burrs aligned with dial indicator.',
    },
  });

  await prisma.equipment.create({
    data: {
      cafeId: cafe.id,
      branchId: branch?.id,
      name: 'True T-49 Commercial 2-Door Reach-in Refrigerator',
      model: 'T-49-HC',
      serialNumber: 'TR-77291',
      category: 'REFRIGERATOR',
      purchaseDate: new Date('2025-01-20'),
      warrantyExpiry: new Date('2028-01-20'),
      lastServiceDate: new Date('2026-08-20'),
      nextServiceDate: new Date('2026-12-20'),
      status: 'OPERATIONAL',
      serviceVendor: 'CoolTech Commercial Refrigeration',
      notes: 'Main milk storage, maintained at strict 3.5°C.',
    },
  });

  // 9. Marketing Campaigns & AI Generated Copy
  console.log('📣 Seeding Marketing Campaigns...');
  await prisma.marketingCampaign.deleteMany({ where: { cafeId: cafe.id } });
  await prisma.marketingCampaign.createMany({
    data: [
      {
        cafeId: cafe.id,
        name: 'Autumn Spiced Cortado Launch',
        type: 'FESTIVE',
        channel: 'WHATSAPP',
        targetSegment: 'VIP',
        promoCode: 'AUTUMN20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        startDate: new Date('2026-11-20'),
        endDate: new Date('2026-11-30'),
        status: 'ACTIVE',
        metricsSent: 240,
        metricsRedeemed: 68,
        roiEstimate: 340.5,
        aiGeneratedCopy:
          '☕ Experience the cozy warmth of autumn at Nordic Roast! Enjoy an exclusive 20% off on our limited-edition Madagascar Spiced Cortado crafted with single-origin Ethiopian beans. Use code AUTUMN20 when scanning your table QR code today!',
      },
      {
        cafeId: cafe.id,
        name: 'Weekend Morning Sourdough & Brew Combo',
        type: 'BOGO',
        channel: 'SOCIAL',
        targetSegment: 'ALL',
        promoCode: 'WEEKENDROAST',
        discountType: 'FIXED',
        discountValue: 100,
        startDate: new Date('2026-11-28'),
        endDate: new Date('2026-12-05'),
        status: 'SCHEDULED',
        metricsSent: 0,
        metricsRedeemed: 0,
        roiEstimate: 210.0,
        aiGeneratedCopy:
          'Weekend vibes deserve artisanal bakes! Pair any manual pour-over with our signature Wild Sourdough & Avocado Whip and save ₹100. Drop by between 8 AM - 12 PM this Saturday & Sunday. 🥐☕✨',
      },
    ],
  });

  // 10. Automation Rules
  console.log('⚡ Seeding Workflow Automation Rules...');
  await prisma.automationRule.deleteMany({ where: { cafeId: cafe.id } });
  await prisma.automationRule.createMany({
    data: [
      {
        cafeId: cafe.id,
        name: 'Auto-Trigger WhatsApp on Kitchen Order Ready',
        trigger: 'ORDER_READY',
        conditionJson: JSON.stringify({ orderType: ['TAKEAWAY', 'DINE_IN'] }),
        actionType: 'WHATSAPP',
        actionConfigJson: JSON.stringify({
          template: 'Your order {{orderNumber}} is freshly prepared and waiting at the counter! ☕✨',
        }),
        isActive: true,
        executionCount: 142,
        lastExecutedAt: new Date(),
      },
      {
        cafeId: cafe.id,
        name: 'Low Stock Auto-Alert & Purchase Order Draft',
        trigger: 'INVENTORY_LOW',
        conditionJson: JSON.stringify({ thresholdRatio: 1.0 }),
        actionType: 'DRAFT_PO',
        actionConfigJson: JSON.stringify({
          autoNotifyManager: true,
          defaultRestockQuantityMultiplier: 3,
        }),
        isActive: true,
        executionCount: 19,
        lastExecutedAt: new Date('2026-11-23T14:20:00Z'),
      },
      {
        cafeId: cafe.id,
        name: 'VIP Customer 14-Day Inactivity Retention Chime',
        trigger: 'CUSTOMER_INACTIVE',
        conditionJson: JSON.stringify({ daysInactive: 14, customerTier: 'VIP' }),
        actionType: 'WHATSAPP',
        actionConfigJson: JSON.stringify({
          couponCode: 'WE_MISS_YOU_20',
          discount: '20%',
        }),
        isActive: true,
        executionCount: 38,
        lastExecutedAt: new Date('2026-11-22T10:00:00Z'),
      },
    ],
  });

  // 11. Food Safety & Operational Checklists
  console.log('📋 Seeding Food Safety Daily Checklists...');
  await prisma.foodSafetyChecklist.deleteMany({ where: { cafeId: cafe.id } });
  await prisma.foodSafetyChecklist.createMany({
    data: [
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        type: 'OPENING',
        title: 'Morning Shift Launch & Hygiene Protocol',
        itemsJson: JSON.stringify([
          { item: 'Calibrate water filter TDS reading (120-140 ppm target)', checked: true },
          { item: 'Purge espresso steam wands and flush group heads with hot cycle', checked: true },
          { item: 'Verify walk-in refrigerator temperature is below 4.0°C (Current: 3.4°C)', checked: true },
          { item: 'Inspect fresh dairy milk expiry labels and open-container dates', checked: true },
          { item: 'Sanitize high-contact POS touchscreen and counter bar surfaces', checked: true },
          { item: 'Test kitchen display audio chimes and receipt thermal roll', checked: true },
        ]),
        completedBy: 'Rohan Mehra (Manager)',
        verifiedBy: 'Aarav Sharma (Owner)',
        status: 'COMPLETED',
        date: '2026-11-24',
      },
      {
        cafeId: cafe.id,
        branchId: branch?.id,
        type: 'FRIDGE_TEMP',
        title: 'Dairy & Ingredient Cold-Chain Temperature Log',
        itemsJson: JSON.stringify([
          { item: 'Main Reach-in Milk Cooler: 3.2°C (Acceptable: 1.0 - 4.0°C)', checked: true },
          { item: 'Under-counter Barista Pitcher Chiller: 2.8°C', checked: true },
          { item: 'Pastry & Dessert Display Cabinet: 5.1°C (Acceptable: 4.0 - 6.0°C)', checked: true },
          { item: 'Deep Freeze Gelato & Ice Reserves: -18.4°C', checked: true },
        ]),
        completedBy: 'Chef Harpreet Singh',
        verifiedBy: 'Rohan Mehra',
        status: 'COMPLETED',
        date: '2026-11-24',
      },
    ],
  });

  // 12. Customer CRM Loyalty & Feedback
  console.log('🌟 Seeding Customer Loyalty & Feedback...');
  const customers = await prisma.customer.findMany({ take: 5 });
  if (customers.length > 0) {
    // Update first customer with VIP points
    await prisma.customer.update({
      where: { id: customers[0].id },
      data: {
        loyaltyPoints: 480,
        totalSpent: 8450.0,
        visitCount: 18,
        tier: 'VIP',
        birthday: '1992-05-14',
        notes: 'Loves single-origin pour-overs, prefers oat milk in flat whites.',
      },
    });

    await prisma.customerFeedback.deleteMany({ where: { cafeId: cafe.id } });
    await prisma.customerFeedback.createMany({
      data: [
        {
          cafeId: cafe.id,
          customerId: customers[0].id,
          customerName: customers[0].name,
          customerPhone: customers[0].phone,
          rating: 5,
          foodRating: 5,
          serviceRating: 5,
          ambianceRating: 5,
          comments:
            'Hands down the cleanest espresso extraction in the city. The Ethiopian roast notes were floral and crisp. Barista Rohan gave fantastic origin notes!',
          aiSentiment: 'POSITIVE',
          aiSummary: 'Praised single origin coffee quality and barista customer knowledge.',
          status: 'REVIEWED',
        },
        {
          cafeId: cafe.id,
          customerName: 'Samir Joshi',
          customerPhone: '+91 98334 00991',
          rating: 4,
          foodRating: 5,
          serviceRating: 4,
          ambianceRating: 4,
          comments:
            'Great sourdough toast and pour-over. Service took about 14 minutes due to busy morning rush, but the coffee was worth the wait.',
          aiSentiment: 'POSITIVE',
          aiSummary: 'Customer enjoyed food and brew; slight delay noted during morning peak.',
          status: 'NEW',
        },
      ],
    });
  }

  console.log('✅ CAFE OS Extended Ecosystem Data Seeded Successfully!');
}

seedCafeOsData()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
