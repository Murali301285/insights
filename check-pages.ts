import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.appPage.findMany({
        where: { parentId: null }
    });
    console.log(pages.map(p => p.pageName));
}

main().catch(console.error).finally(() => prisma.$disconnect());
