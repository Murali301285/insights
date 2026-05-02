const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const configPage = await prisma.appPage.findFirst({ where: { pageName: 'Config' } });
        if (configPage) {
            await prisma.appPage.updateMany({ 
                where: { path: '/config/lookups' }, 
                data: { parentId: configPage.id } 
            });
            console.log('Lookups moved to Config');
        } else {
            console.log('Config page not found');
        }
    } catch(e) {
        console.error(e)
    }
}

main().finally(() => prisma.$disconnect());
