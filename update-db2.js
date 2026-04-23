const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Restructuring Insights Menu...');

    // 1. Create 'Insights' Parent Menu
    let insightsMenu = await prisma.appPage.findFirst({ where: { pageName: 'Insights' } });
    if (!insightsMenu) {
        insightsMenu = await prisma.appPage.create({
            data: {
                pageName: 'Insights',
                icon: 'BarChart4', // or 'LineChart'
                orderIndex: 2,
                isActive: true,
                path: '/insights' // Or null if it's strictly a dropdown
            }
        });
        console.log('Created Insights Menu.');
    } else {
        await prisma.appPage.update({
            where: { id: insightsMenu.id },
            data: { isActive: true }
        });
    }

    // 2. Move Finance, Business Acquisition, Order Fulfilment, Support, HR inside 'Insights'
    const pagesToMove = ['Finance', 'Business Acquisition', 'Order fulfilment', 'Support', 'HR'];
    
    // Let's get the Insights ID to set as parentId
    for (let index = 0; index < pagesToMove.length; index++) {
        const pageName = pagesToMove[index];
        const p = await prisma.appPage.findFirst({ where: { pageName: pageName } });
        if (p) {
            await prisma.appPage.update({
                where: { id: p.id },
                data: { 
                    parentId: insightsMenu.id,
                    orderIndex: index + 1
                }
            });
            console.log(`Moved ${pageName} into Insights.`);
        }
    }

    // 3. Rename My Vault -> Vault, My Tasks -> Tasks
    const vault = await prisma.appPage.findFirst({ where: { pageName: 'My Vault' } });
    if (vault) {
        await prisma.appPage.update({ where: { id: vault.id }, data: { pageName: 'Vault' } });
        console.log('Renamed My Vault -> Vault');
    }

    const tasks = await prisma.appPage.findFirst({ where: { pageName: 'My Tasks' } });
    if (tasks) {
        await prisma.appPage.update({ where: { id: tasks.id }, data: { pageName: 'Tasks' } });
        console.log('Renamed My Tasks -> Tasks');

        // Add sub-menus to Tasks
        const taskSubs = [
            { pageName: 'Dashboard', path: '/tasks/dashboard', orderIndex: 1 },
            { pageName: 'Active Tasks', path: '/tasks/active', orderIndex: 2 },
            { pageName: 'Completed', path: '/tasks/completed', orderIndex: 3 },
        ];

        for (const sub of taskSubs) {
            const check = await prisma.appPage.findFirst({ where: { path: sub.path } });
            if (!check) {
                await prisma.appPage.create({
                    data: {
                        ...sub,
                        parentId: tasks.id,
                        isActive: true
                    }
                });
                console.log(`Created Task Sub-menu: ${sub.pageName}`);
            }
        }
    }

    // 4. Remove 'Weekly Review' from the DB navigation mapping so it only shows at the bottom statically!
    const review = await prisma.appPage.findFirst({ where: { pageName: 'Weekly Review' } });
    if (review) {
        await prisma.appPage.update({ where: { id: review.id }, data: { isActive: false } });
        console.log('Deactivated Weekly Review dynamically to prevent duplicate Sidebar entries.');
    }

    console.log('Structure update complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
