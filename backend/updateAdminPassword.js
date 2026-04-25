import { PrismaClient } from "@prisma/client";
import { createPasswordHash } from "./src/utils/password.js";

const prisma = new PrismaClient();

async function main() {
  const password = createPasswordHash("Admin@123");

  await prisma.user.update({
    where: { login: "admin" },
    data: {
      password,
      role: "administrator",
      isActive: true,
    },
  });

  console.log("Senha do admin atualizada com sucesso.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
