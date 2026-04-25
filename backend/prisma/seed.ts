import { PrismaClient } from "@prisma/client";
import { createPasswordHash } from "../src/utils/password.js";

const prisma = new PrismaClient();

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

async function ensureDefaultOrganization() {
  const existingOrganization = await prisma.organization.findFirst({
    where: { name: "Organização Padrão" },
    orderBy: { id: "asc" }
  });

  if (existingOrganization) {
    return existingOrganization;
  }

  return prisma.organization.create({
    data: {
      name: "Organização Padrão",
      plan: "trial",
      status: "trial",
      trialStartsAt: new Date(),
      trialEndsAt: addDays(new Date(), 60),
      isActive: true
    }
  });
}

async function upsertUser(
  organizationId: number,
  user: {
    name: string;
    email: string;
    login: string;
    password: string;
    jobTitle: string;
    role: string;
  }
) {
  return prisma.user.upsert({
    where: { login: user.login },
    update: {
      organizationId,
      name: user.name,
      email: user.email,
      password: createPasswordHash(user.password),
      jobTitle: user.jobTitle,
      role: user.role,
      isActive: true
    },
    create: {
      organizationId,
      name: user.name,
      email: user.email,
      login: user.login,
      password: createPasswordHash(user.password),
      jobTitle: user.jobTitle,
      role: user.role,
      isActive: true
    }
  });
}

async function main() {
  const organization = await ensureDefaultOrganization();

  await Promise.all([
    upsertUser(organization.id, {
      name: "Administrador",
      email: "admin@cti.com",
      login: "admin",
      password: "Admin@123",
      jobTitle: "Administrador",
      role: "administrator"
    }),
    upsertUser(organization.id, {
      name: "Coordenador",
      email: "coordenador@cti.com",
      login: "coordenador",
      password: "Coord@123",
      jobTitle: "Coordenador",
      role: "coordinator"
    }),
    upsertUser(organization.id, {
      name: "Rotina",
      email: "rotina@cti.com",
      login: "rotina",
      password: "Rotina@123",
      jobTitle: "Fisioterapeuta",
      role: "routine"
    }),
    upsertUser(organization.id, {
      name: "Plantonista",
      email: "plantonista@cti.com",
      login: "plantonista",
      password: "Plantao@123",
      jobTitle: "Fisioterapeuta",
      role: "oncall"
    })
  ]);

  const defaultSector = await prisma.sector.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: "CTI 1"
      }
    },
    update: {
      isActive: true
    },
    create: {
      organizationId: organization.id,
      name: "CTI 1",
      isActive: true
    }
  });

  for (let i = 101; i <= 140; i += 1) {
    const code = `L${i}`;
    await prisma.bed.upsert({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code
        }
      },
      update: {
        sectorId: defaultSector.id,
        sector: defaultSector.name,
        isActive: true
      },
      create: {
        organizationId: organization.id,
        sectorId: defaultSector.id,
        code,
        sector: defaultSector.name,
        occupied: false,
        status: "Vago"
      }
    });
  }

  console.log("Seed concluido com sucesso.");
  console.log(`Organizacao: ${organization.name}`);
  console.log("Login admin: admin");
  console.log("Senha admin: Admin@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
