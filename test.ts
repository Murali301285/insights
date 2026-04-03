import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.statusMaster.findMany().then(console.log).finally(() => prisma.$disconnect());
