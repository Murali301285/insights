const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const desiredOrder = [
        "Dashboard",
        "Insights",
        "Tasks",
        "Time Tracker",
        "Inventory",
        "Expense",
        "Vault",
        "Config"
    ];

    for (let i = 0; i < desiredOrder.length; i++) {
        const pageName = desiredOrder[i];
        await prisma.appPage.updateMany({
            where: { pageName: pageName, parentId: null },
            data: { orderIndex: i + 1, isActive: true }
        });
    }

    // Hide or "remove" Email from dynamic DB menu
    await prisma.appPage.updateMany({
        where: { pageName: 'Email' },
        data: { isActive: false }
    });

    console.log("Main menu re-ordered and Email removed from dynamic list.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
