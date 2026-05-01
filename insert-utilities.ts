import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    let utilitiesParent = await prisma.appPage.findFirst({ where: { pageName: 'Utilities' }});
    if (!utilitiesParent) {
        utilitiesParent = await prisma.appPage.create({
            data: {
                pageName: 'Utilities',
                isActive: true,
                orderIndex: 8,
                icon: 'Wrench'
            }
        });
    }

    const tools = [
        { name: 'Email', path: '#email', icon: 'Mail' },
        { name: 'Weekly Review', path: '#weekly-review', icon: 'Calendar' },
        { name: 'Assistant', path: '#assistant', icon: 'Bot' },
        { name: 'Generate Report', path: '#generate-report', icon: 'FileText' },
        { name: 'Search', path: '#search', icon: 'Search' },
        { name: 'Chat', path: '#chat', icon: 'MessageSquare' }
    ];

    for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];
        let existing = await prisma.appPage.findFirst({ where: { pageName: tool.name, parentId: utilitiesParent.id }});
        if (!existing) {
            await prisma.appPage.create({
                data: {
                    pageName: tool.name,
                    path: tool.path,
                    icon: tool.icon,
                    parentId: utilitiesParent.id,
                    orderIndex: i,
                    isActive: true
                }
            });
        }
    }
    console.log("Utilities tools inserted successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
