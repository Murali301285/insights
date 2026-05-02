const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const count = await prisma.lookupMaster.count();
        console.log('LookupMaster count:', count);
        const l = await prisma.lookupMaster.create({
            data: { type: 'UNIT', value: 'kg', label: 'Kilograms' }
        })
        console.log('Created test lookup:', l)
    } catch(e) {
        console.error(e)
    }
}
main().finally(() => prisma.$disconnect());
