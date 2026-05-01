import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const redundantNames = ['Email', 'Weekly Review', 'Assistant', 'Chat', 'Search', 'Generate Report'];
    
    const result = await prisma.appPage.deleteMany({
        where: {
            parentId: null,
            pageName: {
                in: redundantNames
            }
        }
    });
    
    console.log(`Deleted ${result.count} redundant standalone pages.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
