const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        await prisma.currencyMaster.upsert({
            where: { slno: 1 },
            update: {},
            create: { slno: 1, currencyName: 'INR', symbol: '₹', shortName: 'INR' }
        });
        await prisma.currencyMaster.upsert({
            where: { slno: 2 },
            update: {},
            create: { slno: 2, currencyName: 'USD', symbol: '$', shortName: 'USD' }
        });
        await prisma.currencyMaster.upsert({
            where: { slno: 3 },
            update: {},
            create: { slno: 3, currencyName: 'EUR', symbol: '€', shortName: 'EUR' }
        });
        console.log("Seeded currencies");
    } catch(e) {
        console.error(e)
    }
}
main().finally(() => prisma.$disconnect());
