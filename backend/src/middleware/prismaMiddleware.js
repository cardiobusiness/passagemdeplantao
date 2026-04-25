import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

export const prisma = new PrismaClient();

// Garantir desconexão ao encerrar
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
