const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Database Connection...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Defined' : 'Missing');

    try {
        const userCount = await prisma.user.count();
        console.log('✅ Connection Successful!');
        console.log(`Found ${userCount} users in the database.`);
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
