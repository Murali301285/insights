import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Locating Win Status...");
    const winStatus = await prisma.statusMaster.findFirst({
        where: { statusName: { contains: 'Win', mode: 'insensitive' } }
    });

    if (!winStatus) {
        console.error("No Win status found.");
        return;
    }

    console.log(`Win Status ID is ${winStatus.slno}`);

    const wonOpps = await prisma.opportunity.findMany({
        where: { statusId: winStatus.slno, isDelete: false },
        include: { order: true },
        orderBy: { date: 'asc' }
    });

    console.log(`Found ${wonOpps.length} Won Opportunities. Checking for missing Orders...`);

    let createdCount = 0;

    for (const opp of wonOpps) {
        if (!opp.order) {
            const now = opp.date || new Date();
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = String(now.getFullYear());
            const prefix = `${d}${m}${y}`;

            const lastOrder = await prisma.order.findFirst({
                where: { orderNo: { startsWith: prefix } },
                orderBy: { orderNo: 'desc' }
            });

            let runningNo = 1;
            if (lastOrder && lastOrder.orderNo.length >= 11) {
                const lastStr = lastOrder.orderNo.slice(-3);
                const parsed = parseInt(lastStr, 10);
                if (!isNaN(parsed)) runningNo = parsed + 1;
            }

            const orderNo = `${prefix}${String(runningNo).padStart(3, '0')}`;

            await prisma.order.create({
                data: {
                    orderNo,
                    opportunityId: opp.id,
                    date: now,
                    createdBy: "System Migration",
                    updatedBy: "System Migration"
                }
            });

            console.log(`Created Order ${orderNo} for Opportunity ${opp.opportunityName}`);
            createdCount++;
        }
    }

    console.log(`Successfully retro-seeded ${createdCount} orders.`);
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
