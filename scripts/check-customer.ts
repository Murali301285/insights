import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const customers = await prisma.customerMaster.findMany({
        where: { customerName: { contains: "Gaaia" } },
        include: { company: true }
    })
    console.log("CUSTOMERS:", JSON.stringify(customers, null, 2))

    const orders = await prisma.order.findMany({
        include: { 
            opportunity: {
                include: { customer: true }
            }
        }
    })
    console.log("ORDERS:", JSON.stringify(orders.map(o => ({
        orderNo: o.orderNo,
        customerName: o.opportunity?.customer?.customerName,
        customerCompanyId: o.opportunity?.customer?.companyId,
    })), null, 2))

    const companies = await prisma.company.findMany()
    console.log("COMPANIES:", JSON.stringify(companies.map(c => ({ id: c.id, name: c.name })), null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
