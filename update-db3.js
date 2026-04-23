const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Move Supply Chain inside Insights
    const insightsMenu = await prisma.appPage.findFirst({ where: { pageName: 'Insights' } });
    if (insightsMenu) {
        const p = await prisma.appPage.findFirst({ where: { pageName: 'Supply Chain' } });
        if (p) {
            await prisma.appPage.update({
                where: { id: p.id },
                data: { parentId: insightsMenu.id, orderIndex: 6 } // Appended after HR
            });
            console.log('Moved Supply Chain into Insights.');
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
