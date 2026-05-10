import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const globalForPrisma = globalThis;
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
