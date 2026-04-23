import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Clearing existing data...')
    await prisma.financeMetrics.deleteMany()
    await prisma.salesMetrics.deleteMany()
    await prisma.manufacturingMetrics.deleteMany()
    await prisma.supplyChainMetrics.deleteMany()
    await prisma.supportMetrics.deleteMany()
    await prisma.hrMetrics.deleteMany()
    await prisma.company.deleteMany()

    console.log('Creating Admin User & Company...')
    const company = await prisma.company.create({
        data: {
            name: 'Silotech Inc',
            code: 'SILO',
        }
    })

    const password = await bcrypt.hash('password123', 10)
    const user = await prisma.user.upsert({
        where: { email: 'admin@insight.com' },
        update: {},
        create: {
            email: 'admin@insight.com',
            profileName: 'Admin User',
            password,
            // @ts-ignore
            role: 'admin',
        },
    })
    console.log({ user })

    const date = new Date()

    console.log('Creating Finance Metrics...')
    await prisma.financeMetrics.create({
        data: {
            companyId: company.id,
            period: 'Weekly',
            date: date,
            revenue: 2500000,
            expenses: 1800000,
            profit: 700000,
            inflow: 350000,
            outflow: 210000,
            cashBalance: 1200000,
            prevInflow: 320000,
            prevOutflow: 250000,
            prevCashBalance: 1100000,
            arTotal: 850000,
            arCurrent: 400000,
            ar0to30: 250000,
            ar30to60: 150000,
            ar60to90plus: 50000,
            apTotal: 650000,
            apCurrent: 300000,
            ap0to30: 200000,
            ap30to60: 100000,
            ap60to90plus: 50000,
        }
    })

    console.log('Creating Sales Metrics...')
    await prisma.salesMetrics.create({
        data: {
            companyId: company.id,
            period: 'Weekly',
            date: date,
            annualTarget: 100000000,
            ordersYtdPct: 65,
            invoiceYtdPct: 58,
            leadsCount: 150,
            rfqCount: 85,
            quotesCount: 60,
            negotiationCount: 25,
            orderCount: 12,
            quotesValue: 5000000,
            negotiationValue: 2500000,
            winValue: 1200000,
            lossValue: 800000,
        }
    })

    console.log('Creating Manufacturing Metrics...')
    await prisma.manufacturingMetrics.create({
        data: {
            companyId: company.id,
            period: 'Weekly',
            date: date,
            rfqNew: 45,
            rfqStandard: 30,
            rfqCustom: 15,
            projectOnTrack: 120,
            projectBehindSchedule: 15,
            projectCritical: 5,
            efficiency: 88.5
        }
    })

    console.log('Creating Supply Chain Metrics...')
    await prisma.supplyChainMetrics.create({
        data: {
            companyId: company.id,
            period: 'Weekly',
            date: date,
            outstandingPayments: 450000,
            domesticSource: 85,
            intlSource: 35,
            totalSuppliers: 120,
            cashAdvanceTerms: 20,
            net15Terms: 30,
            net30Terms: 45,
            net60Terms: 15,
            net90Terms: 10
        }
    })

    console.log('Creating Support Metrics...')
    await prisma.supportMetrics.create({
        data: {
            companyId: company.id,
            period: 'Weekly',
            date: date,
            totalTickets: 350,
            openTickets: 45,
            criticalIssues: 8,
            resolvedTickets: 305,
            avgResponseTime: 2.4
        }
    })

    console.log('Creating HR Metrics...')
    await prisma.hrMetrics.create({
        data: {
            companyId: company.id,
            period: 'Weekly',
            date: date,
            orgStrength: 250,
            openPosLagging: 3,
            openPosOnTrack: 12,
            recruitedApplied: 450,
            recruitedScreening: 120,
            recruitedInterview: 45,
            recruitedOffer: 15,
            recruitedHired: 10
        }
    })

    console.log('Seeding finished.')
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
