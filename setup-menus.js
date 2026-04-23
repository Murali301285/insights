const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching Admin Role...');
    const adminRole = await prisma.role.findFirst({
        where: { name: 'admin' }
    });

    console.log('Creating New App Pages...');
    
    // 1. Email (Standalone)
    const emailPage = await prisma.appPage.create({
        data: {
            pageName: 'Email',
            path: '/email',
            icon: 'MessageSquareText', // Lucide outline icon
            orderIndex: 20
        }
    });

    // 2. Weekly Review (Standalone)
    const weeklyReviewPage = await prisma.appPage.create({
        data: {
            pageName: 'Weekly Review',
            path: '/weekly-review',
            icon: 'ClipboardList',
            orderIndex: 21
        }
    });

    // 3. Time Tracker (Parent & Children)
    const timeTrackerPage = await prisma.appPage.create({
        data: {
            pageName: 'Time Tracker',
            icon: 'Archive', // Using archive/clock icon mapping visually
            orderIndex: 22,
            children: {
                create: [
                    { pageName: 'Entry', path: '/time-tracker/entry', orderIndex: 1 },
                    { pageName: 'Report', path: '/time-tracker/report', orderIndex: 2 },
                ]
            }
        }
    });

    // 4. Inventory (Parent & Children)
    const inventoryPage = await prisma.appPage.create({
        data: {
            pageName: 'Inventory',
            icon: 'Package', 
            orderIndex: 23,
            children: {
                create: [
                    { pageName: 'Dashboard', path: '/inventory/dashboard', orderIndex: 1 },
                    { pageName: 'Entry', path: '/inventory/entry', orderIndex: 2 },
                    { pageName: 'Report', path: '/inventory/report', orderIndex: 3 },
                ]
            }
        }
    });

    // 5. Expense (Parent & Children)
    const expensePage = await prisma.appPage.create({
        data: {
            pageName: 'Expense',
            icon: 'Building',
            orderIndex: 24,
            children: {
                create: [
                    { pageName: 'Dashboard', path: '/expense/dashboard', orderIndex: 1 },
                    { pageName: 'Entry', path: '/expense/entry', orderIndex: 2 },
                    { pageName: 'Report', path: '/expense/report', orderIndex: 3 },
                ]
            }
        }
    });

    console.log('Menus successfully created in DB!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
