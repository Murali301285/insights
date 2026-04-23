const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const parent = await prisma.appPage.findFirst({ where: { pageName: 'Time Tracker' } });
    if (parent) {
        // Create Dashboard if it doesn't exist
        const check = await prisma.appPage.findFirst({ where: { path: '/time-tracker/dashboard' } });
        if (!check) {
            await prisma.appPage.create({
                data: {
                    pageName: 'Dashboard',
                    path: '/time-tracker/dashboard',
                    orderIndex: 1,
                    parentId: parent.id,
                    isActive: true
                }
            });
            console.log('Created Time Tracker Dashboard menu item.');
        } else {
            console.log('Time Tracker Dashboard menu item already exists.');
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
