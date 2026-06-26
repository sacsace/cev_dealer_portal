import { PrismaClient, UserRole, PartStatus, PermissionModule, PermissionAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const rootPasswordHash = await bcrypt.hash('admin123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  const permissionModules = Object.values(PermissionModule);
  const permissionActions = Object.values(PermissionAction);

  for (const module of permissionModules) {
    for (const action of permissionActions) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action },
      });
    }
  }

  const rootUser = await prisma.user.upsert({
    where: { loginId: 'root' },
    update: {
      email: 'lee@msventures.in',
      passwordHash: rootPasswordHash,
    },
    create: {
      name: 'Root Admin',
      email: 'lee@msventures.in',
      loginId: 'root',
      mobile: '9876543210',
      passwordHash: rootPasswordHash,
      role: UserRole.ROOT,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cev.local' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@cev.local',
      mobile: '9876543211',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const dealer = await prisma.dealer.upsert({
    where: { dealerCode: 'FH001' },
    update: {},
    create: {
      dealerName: 'Frontier Hyundai',
      dealerCode: 'FH001',
      email: 'parts@frontierhyundai.com',
      mobile: '9876543212',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      gstNumber: '27AABCU9603R1ZM',
      contactPerson: 'Parts Manager',
      loginId: 'FH001',
    },
  });

  await prisma.user.upsert({
    where: { email: 'parts@frontierhyundai.com' },
    update: {
      loginId: 'FH001',
    },
    create: {
      name: 'Frontier Hyundai',
      email: 'parts@frontierhyundai.com',
      loginId: 'FH001',
      mobile: '9876543212',
      passwordHash: await bcrypt.hash('Dealer@123', 10),
      role: UserRole.DEALER,
      dealerId: dealer.id,
    },
  });

  await prisma.dealer.update({
    where: { id: dealer.id },
    data: {
      contactUserId: adminUser.id,
      contactPerson: adminUser.name,
    },
  });

  const categories = await Promise.all(
    ['Assembled Part', 'Base Part', 'Engine', 'Body', 'Electrical'].map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const models = await Promise.all(
    [
      { modelName: 'Accent LCI', modelCode: 'ACCENT_LCI' },
      { modelName: 'Aura AI3 4DR', modelCode: 'AURA_AI3' },
      { modelName: 'Eon HA', modelCode: 'EON_HA' },
      { modelName: 'Exter MS1', modelCode: 'EXTER_MS1' },
      { modelName: 'Grand i10', modelCode: 'GRAND_I10' },
      { modelName: 'Santro', modelCode: 'SANTRO' },
      { modelName: 'Xcent', modelCode: 'XCENT' },
    ].map((m) =>
      prisma.vehicleModel.upsert({
        where: { modelCode: m.modelCode },
        update: {},
        create: m,
      }),
    ),
  );

  const problemTypes = [
    { name: '전환 문제', nameEn: 'Conversion issue', sortOrder: 1 },
    { name: 'CNG 누출', nameEn: 'CNG leak', sortOrder: 2 },
    { name: '실린더 녹 발생', nameEn: 'Cylinder rust', sortOrder: 3 },
    { name: '엔진 실화 및 울컥거림', nameEn: 'Engine misfire and jerking', sortOrder: 4 },
    { name: '엔진 시동 꺼짐 (냉간 시동)', nameEn: 'Engine stall (cold start)', sortOrder: 5 },
    { name: 'HP 튜브 캠페인', nameEn: 'HP tube campaign', sortOrder: 6 },
    { name: '주행거리 짧음', nameEn: 'Short driving range', sortOrder: 7 },
    { name: 'MIL이 옵니다', nameEn: 'MIL is on', sortOrder: 8 },
    { name: '픽업 불량', nameEn: 'Poor pickup', sortOrder: 9 },
    { name: '후방 소음', nameEn: 'Rear noise', sortOrder: 10 },
    { name: '조절기 소음', nameEn: 'Regulator noise', sortOrder: 11 },
    { name: 'RPM 변동', nameEn: 'RPM fluctuation', sortOrder: 12 },
    { name: '시작 문제', nameEn: 'Starting issue', sortOrder: 13 },
    { name: '잘못된 레벨 표시', nameEn: 'Incorrect level display', sortOrder: 14 },
  ];

  for (const pt of problemTypes) {
    await prisma.problemType.upsert({
      where: { name: pt.name },
      update: { nameEn: pt.nameEn, sortOrder: pt.sortOrder },
      create: pt,
    });
  }

  const jobCardTypes = [
    { name: 'BS4', nameEn: 'BS4', sortOrder: 1 },
    { name: 'BS6', nameEn: 'BS6', sortOrder: 2 },
  ];

  for (const jt of jobCardTypes) {
    await prisma.jobCardType.upsert({
      where: { name: jt.name },
      update: { nameEn: jt.nameEn, sortOrder: jt.sortOrder },
      create: jt,
    });
  }

  const fitmentOptions = [
    { name: 'Plant', nameEn: 'Plant', sortOrder: 1 },
    { name: 'Retro', nameEn: 'Retro', sortOrder: 2 },
  ];

  for (const fitment of fitmentOptions) {
    await prisma.fitment.upsert({
      where: { name: fitment.name },
      update: { nameEn: fitment.nameEn, sortOrder: fitment.sortOrder },
      create: fitment,
    });
  }

  const sampleParts = [
    { partNumber: 'BP-001', partName: 'Brake Pad Set Front', categoryId: categories[0].id, dealerPrice: 2500, mrp: 3200, stockQuantity: 50 },
    { partNumber: 'OF-002', partName: 'Oil Filter', categoryId: categories[1].id, dealerPrice: 350, mrp: 450, stockQuantity: 200 },
    { partNumber: 'SP-003', partName: 'Spark Plug Set', categoryId: categories[2].id, dealerPrice: 800, mrp: 1100, stockQuantity: 0, status: PartStatus.OUT_OF_STOCK },
    { partNumber: 'BD-004', partName: 'Front Bumper Cover', categoryId: categories[3].id, dealerPrice: 8500, mrp: 12000, stockQuantity: 15 },
    { partNumber: 'EL-005', partName: 'Headlight Assembly', categoryId: categories[4].id, dealerPrice: 4200, mrp: 5800, stockQuantity: 30 },
  ];

  for (const part of sampleParts) {
    const created = await prisma.part.upsert({
      where: { partNumber: part.partNumber },
      update: {},
      create: {
        partNumber: part.partNumber,
        partName: part.partName,
        categoryId: part.categoryId,
        description: `${part.partName} - Genuine OEM part`,
        mrp: part.mrp,
        dealerPrice: part.dealerPrice,
        gstRate: 18,
        stockQuantity: part.stockQuantity,
        minimumOrderQty: 1,
        warrantyAvailable: true,
        status: part.status ?? PartStatus.AVAILABLE,
      },
    });

    await prisma.partModelMapping.upsert({
      where: { partId_modelId: { partId: created.id, modelId: models[0].id } },
      update: {},
      create: { partId: created.id, modelId: models[0].id },
    });
  }

  console.log('Seed completed.');
  console.log('Root:', rootUser.email, '/ root / admin123');
  console.log('Admin:', adminUser.email, '/ Admin@123');
  console.log('Dealer:', 'parts@frontierhyundai.com or FH001 / Dealer@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
