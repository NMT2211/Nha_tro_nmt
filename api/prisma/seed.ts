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
}

main().finally(async () => prisma.$disconnect());
