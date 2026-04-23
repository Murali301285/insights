const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDb() {
    console.log('Renaming DB Menus...');

    // 1. Rename Manufacturing -> Order fulfilment
    await prisma.appPage.updateMany({
        where: { pageName: 'Manufacturing' },
        data: { pageName: 'Order fulfilment' }
    });
    console.log('Updated: Order fulfilment');

    // 2. Rename Sales -> Business Acquisition
    await prisma.appPage.updateMany({
        where: { pageName: 'Sales' },
        data: { pageName: 'Business Acquisition' }
    });
    console.log('Updated: Business Acquisition');

    // 3. Inject My Vault and My Tasks
    const newPages = [
        { pageName: 'My Vault', path: '/vault', icon: 'FolderLock', orderIndex: 11, isActive: true },
        { pageName: 'My Tasks', path: '/tasks', icon: 'ListTodo', orderIndex: 12, isActive: true },
    ];

    for (const p of newPages) {
        let chk = await prisma.appPage.findFirst({ where: { pageName: p.pageName } });
        if (!chk) {
            await prisma.appPage.create({ data: p });
            console.log('Created:', p.pageName);
        } else {
            await prisma.appPage.update({ where: { id: chk.id }, data: p });
            console.log('Restored:', p.pageName);
        }
    }

    console.log('Database definitions strictly updated!');
}

updateDb()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
