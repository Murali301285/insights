const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        await prisma.categoryMaster.create({
            data: { categoryName: 'Test Server Connection' }
        });
        console.log('Success');
    } catch (e) {
        console.error('SERVER ERROR DETAILS:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
