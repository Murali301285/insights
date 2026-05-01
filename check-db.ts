import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.appPage.findMany();
    console.log("Pages:", pages);
    const roles = await prisma.role.findMany({ include: { roleAccesses: true }});
    console.log("Roles:", roles);
}

main().catch(console.error).finally(() => prisma.$disconnect());
