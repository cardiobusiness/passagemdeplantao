import { PrismaClient } from "@prisma/client";
import { createPasswordHash } from "../src/utils/password.js";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = createPasswordHash("Admin@123");

  await prisma.user.upsert({
    where: { login: "admin" },
    update: {
      name: "Administrador",
      email: "admin@cti.com",
      password: adminPassword,
      jobTitle: "Administrador",
      role: "administrator",
      isActive: true
    },
    create: {
      name: "Administrador",
      email: "admin@cti.com",
      login: "admin",
      password: adminPassword,
      jobTitle: "Administrador",
      role: "administrator",
      isActive: true
    }
  });

  console.log("Usuario admin criado/atualizado com sucesso.");
  console.log("Login: admin");
  console.log("Senha: Admin@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
