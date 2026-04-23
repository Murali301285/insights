const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding new configuration menus...");

    // Find the configuration parent menu ID
    const configParent = await prisma.appPage.findFirst({
        where: { pageName: { contains: "Config" } },
    });

    if (!configParent) {
        console.log("Configuration parent menu not found! Searching for alternative...");
    }

    const parentId = configParent ? configParent.id : null;

    // Add Role Master
    const roleMenu = await prisma.appPage.upsert({
        where: { path: '/config/role' },
        update: { isActive: true },
        create: {
            pageName: 'Role Master',
            path: '/config/role',
            isActive: true,
            icon: 'Shield',
            orderIndex: 20,
            parentId: parentId
        }
    });

    // Add Role Auth Master
    const roleAuthMenu = await prisma.appPage.upsert({
        where: { path: '/config/role-auth' },
        update: { isActive: true },
        create: {
            pageName: 'Role Authentication',
            path: '/config/role-auth',
            isActive: true,
            icon: 'Key',
            orderIndex: 21,
            parentId: parentId
        }
    });

    console.log("Adding default accesses...");
    
    // Grant access to all active roles
    const roles = await prisma.role.findMany();
    for (const role of roles) {
        for (const menu of [roleMenu, roleAuthMenu]) {
            await prisma.roleAccess.upsert({
                where: {
                    roleId_pageId: {
                        roleId: role.id,
                        pageId: menu.id
                    }
                },
                update: {
                    canView: true,
                    canAdd: true,
                    canEdit: true,
                    canDelete: true
                },
                create: {
                    roleId: role.id,
                    pageId: menu.id,
                    canView: true,
                    canAdd: true,
                    canEdit: true,
                    canDelete: true
                }
            }).catch((e: any) => console.log("RoleAccess insertion error: ", e.message));
        }
    }

    console.log("Finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
