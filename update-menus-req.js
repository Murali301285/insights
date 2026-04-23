const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Get Config Menu
    const configMenu = await prisma.appPage.findFirst({
        where: { pageName: 'Config', parentId: null }
    });

    if (!configMenu) throw new Error('Config menu not found');

    console.log('Found Config Menu ID:', configMenu.id);

    // 2. Hide System Page
    await prisma.appPage.updateMany({
        where: { pageName: 'System', parentId: configMenu.id },
        data: { isActive: false }
    });
    console.log('Hid System page');

    // 3. Move Hierarchy page below Vault
    // Vault order is 7, Config is 8. So put Hierarchy at 8, and push Config to 9, etc.
    const hierarchyPage = await prisma.appPage.findFirst({
        where: { pageName: 'Hierarchy' }
    });

    if (hierarchyPage) {
        await prisma.appPage.update({
            where: { id: hierarchyPage.id },
            data: { 
                parentId: null,
                icon: 'Network',
                orderIndex: 8 
            }
        });
        
        // Also update the order of Config so It pushes down
        await prisma.appPage.updateMany({
            where: { id: configMenu.id },
            data: { orderIndex: 9 }
        });
        console.log('Moved Hierarchy under main menu below Vault');
    }

    // 4. Add Role
    const roleExists = await prisma.appPage.findFirst({
        where: { pageName: 'Role', parentId: configMenu.id }
    });
    if (!roleExists) {
        await prisma.appPage.create({
            data: {
                pageName: 'Role',
                path: '/config/role',
                parentId: configMenu.id,
                orderIndex: 2, // arbitrary order
            }
        });
        console.log('Added Role to Config menu');
    }

    // 5. Add Role Auth
    const roleAuthExists = await prisma.appPage.findFirst({
        where: { pageName: 'Role Auth', parentId: configMenu.id }
    });
    if (!roleAuthExists) {
        await prisma.appPage.create({
            data: {
                pageName: 'Role Auth',
                path: '/config/role-auth',
                parentId: configMenu.id,
                orderIndex: 3, // arbitrary order
            }
        });
        console.log('Added Role Auth to Config menu');
    }

    console.log('Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
