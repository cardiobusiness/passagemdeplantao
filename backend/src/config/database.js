import { prisma } from "../middleware/prismaMiddleware.js";

export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      message: "Conectado ao banco de dados Supabase via Prisma"
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message ?? "Erro ao conectar ao banco de dados"
    };
  }
}
