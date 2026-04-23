const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Database with Admin and Pages...');

    // 1. Create dummy Company if missing
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'InSight Corp',
                code: 'INSIGHT',
            }
        });
        console.log('Created Company:', company.name);
    }

    // 2. Hash Password and Create Admin Role
    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: { name: 'admin', remarks: 'Super Administrator' }
    });

    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@insights.com' },
        update: {
            password: hashedPassword,
            role: { connect: { id: adminRole.id } }
        },
        create: {
            email: 'admin@insights.com',
            profileName: 'Super Admin',
            password: hashedPassword,
            role: { connect: { id: adminRole.id } },
            companies: { connect: { id: company.id } }
        },
    });
    console.log('Created/Updated Admin User:', user.email);

    // 3. Ensure Menus exist (AppPage) so Admin can view everything

    const pagesToCreate = [
        // Base Dashboard
        { pageName: 'Dashboard', icon: 'LayoutDashboard', orderIndex: 0, path: '/', isParent: false },

        // Config Mod
        {
            pageName: 'Config', icon: 'Settings', orderIndex: 99,
            children: [
                { pageName: 'Company', path: '/config/company', orderIndex: 1 },
                { pageName: 'User', path: '/config/user', orderIndex: 2 },
                { pageName: 'Hierarchy', path: '/config/hierarchy', orderIndex: 3 },
                { pageName: 'Zone', path: '/config/zone', orderIndex: 4 },
                { pageName: 'System', path: '/config/system', orderIndex: 5 },
                { pageName: 'Customer', path: '/config/customer', orderIndex: 6 },
                { pageName: 'Supplier', path: '/config/supplier', orderIndex: 7 },
                { pageName: 'Category', path: '/config/category', orderIndex: 8 },
                { pageName: 'Payment Type', path: '/config/payment-type', orderIndex: 9 },
                { pageName: 'Status', path: '/config/status', orderIndex: 10 },
                { pageName: 'Stage', path: '/config/stage', orderIndex: 11 },
                { pageName: 'Request Stages', path: '/config/request-stages', orderIndex: 12 },
            ]
        },

        // Finance Base
        { pageName: 'Finance', icon: 'PieChart', orderIndex: 1, path: '/finance', isParent: true, children: [] },
        { pageName: 'Sales', icon: 'PieChart', orderIndex: 2, path: '/sales', isParent: true, children: [] },
        { pageName: 'Manufacturing', icon: 'Factory', orderIndex: 3, path: '/manufacturing', isParent: true, children: [] },
        { pageName: 'Supply Chain', icon: 'Network', orderIndex: 4, path: '/supply-chain', isParent: true, children: [] },
        { pageName: 'Support', icon: 'Wrench', orderIndex: 5, path: '/support', isParent: true, children: [] },
        { pageName: 'HR', icon: 'Users', orderIndex: 6, path: '/hr', isParent: true, children: [] },

        // New Advanced Modules
        { pageName: 'Email', path: '/email', icon: 'MessageSquareText', orderIndex: 20 },
        { pageName: 'Weekly Review', path: '/weekly-review', icon: 'ClipboardList', orderIndex: 21 },
        {
            pageName: 'Time Tracker', icon: 'Archive', orderIndex: 22,
            children: [
                { pageName: 'Entry', path: '/time-tracker/entry', orderIndex: 1 },
                { pageName: 'Report', path: '/time-tracker/report', orderIndex: 2 },
            ]
        },
        {
            pageName: 'Inventory', icon: 'Package', orderIndex: 23,
            children: [
                { pageName: 'Dashboard', path: '/inventory/dashboard', orderIndex: 1 },
                { pageName: 'Entry', path: '/inventory/entry', orderIndex: 2 },
                { pageName: 'Report', path: '/inventory/report', orderIndex: 3 },
            ]
        },
        {
            pageName: 'Expense', icon: 'Building', orderIndex: 24,
            children: [
                { pageName: 'Dashboard', path: '/expense/dashboard', orderIndex: 1 },
                { pageName: 'Entry', path: '/expense/entry', orderIndex: 2 },
                { pageName: 'Report', path: '/expense/report', orderIndex: 3 },
            ]
        }
    ];

    for (const page of pagesToCreate) {
        // Upsert Parent (using ID generation logic to avoid purely finding first)
        let p = await prisma.appPage.findFirst({ where: { pageName: page.pageName } });
        if (!p) {
            p = await prisma.appPage.create({
                data: {
                    pageName: page.pageName,
                    path: page.path || null,
                    icon: page.icon || null,
                    orderIndex: page.orderIndex || 0,
                    isActive: true
                }
            });
            console.log('Created Page:', p.pageName);
        } else {
            // Force activate just in case
            await prisma.appPage.update({
                where: { id: p.id },
                data: { isActive: true, path: page.path || null }
            })
            console.log('Force activated Page:', p.pageName);
        }

        // Upsert Children
        if (page.children && page.children.length > 0) {
            for (const child of page.children) {
                let c = await prisma.appPage.findFirst({ where: { path: child.path } });
                if (!c) {
                    await prisma.appPage.create({
                        data: {
                            pageName: child.pageName,
                            path: child.path,
                            orderIndex: child.orderIndex,
                            isActive: true,
                            parentId: p.id
                        }
                    });
                    console.log(' - Created Child:', child.pageName);
                } else {
                    await prisma.appPage.update({
                        where: { id: c.id },
                        data: { isActive: true }
                    })
                }
            }
        }
    }

    console.log('Database perfectly seeded! Login using admin@insights.com / 123456');
}

main()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
