import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    const user = await prisma.user.upsert({
        where: { email: 'admin@insight.com' },
        update: {},
        create: {
            email: 'admin@insight.com',
            profileName: 'Admin User',
            password,
            role: 'admin',
        },
    })
    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
