const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Fetch Hierarchy and Vault pages
    const pages = await prisma.appPage.findMany();
    
    const vault = pages.find(p => p.pageName === "Vault");
    const hierarchy = pages.find(p => p.pageName === "Hierarchy");

    if (vault && hierarchy) {
        console.log(`Vault order is ${vault.orderIndex}, Hierarchy order is ${hierarchy.orderIndex}`);
        
        // Put Hierarchy just above Vault
        await prisma.appPage.update({
            where: { id: hierarchy.id },
            data: { orderIndex: vault.orderIndex - 1 }
        });
        console.log("Updated internal index successfully.");
    } else {
        console.log("Vault or Hierarchy not found:", vault, hierarchy);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
