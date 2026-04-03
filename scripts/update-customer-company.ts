import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    await prisma.customerMaster.updateMany({
        where: { customerName: "Gaaia3" },
        data: { companyId: "cmm5pxmfn0000v3uxe6vsyvse" } 
    })
    console.log("Updated Customer Gaaia3 to belong to Silotech Inc!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
