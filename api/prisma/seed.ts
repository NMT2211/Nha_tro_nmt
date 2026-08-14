import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { PERMISSION_DEFINITIONS } from '../src/common/constants/permissions';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main(): Promise<void> {
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.quyen.upsert({
      where: { maQuyen: permission.maQuyen },
      update: {
        tenQuyen: permission.tenQuyen,
        nhomQuyen: permission.nhomQuyen,
      },
      create: permission,
    });
  }
  const ownerRoles = await prisma.vaiTro.findMany({
    where: { maVaiTro: 'CHU_SO_HUU', laHeThong: true },
    select: { id: true },
  });
  const permissions = await prisma.quyen.findMany({ select: { id: true } });
  await prisma.vaiTroQuyen.createMany({
    data: ownerRoles.flatMap((role) =>
      permissions.map((permission) => ({
        vaiTroId: role.id,
        quyenId: permission.id,
      })),
    ),
    skipDuplicates: true,
  });
}

main().finally(async () => prisma.$disconnect());
