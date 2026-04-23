const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const parent = await prisma.appPage.create({
        data: {
            pageName: 'Ops',
            path: '/ops',
            icon: 'Settings',
            isActive: true,
            orderIndex: 40
        }
    });

    console.log('Ops created:', parent);

    const items = ['Inventory', 'Quotations', 'Sales Order', 'Pro-forma Invoice', 'Invoice', 'Purchase Order', 'Purchase Bills', 'Credit Note', 'Debit Note', 'GRN', 'GCN', 'DC'];

    for (let i = 0; i < items.length; i++) {
        await prisma.appPage.create({
            data: {
                pageName: items[i],
                path: '/ops/' + items[i].toLowerCase().replace(/ /g, '-'),
                parentId: parent.id,
                orderIndex: i,
                isActive: true
            }
        });
    }

    console.log('Children created');
}

main().catch(console.error).finally(() => prisma.$disconnect());
