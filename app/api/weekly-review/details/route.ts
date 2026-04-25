import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const settings = await prisma.settings.findUnique({
            where: { key: "weekly_review_data" }
        })

        const defaultData = { items: [], others: [] }
        const data = settings ? (settings.value as any) : defaultData

        const items = data.items || []
        const others = data.others || []

        // Group item IDs by module
        const moduleIds: Record<string, string[]> = {
            sales: [],
            manufacturing: [],
            support: [],
            'supply-chain': []
        }

        items.forEach((item: any) => {
            if (moduleIds[item.module]) {
                moduleIds[item.module].push(item.itemId)
            }
        })

        // Fetch records
        const [opportunities, orders, tickets, requests] = await Promise.all([
            moduleIds.sales.length > 0 ? prisma.opportunity.findMany({
                where: { id: { in: moduleIds.sales } },
                include: { customer: true, incharge: true, status: true }
            }) : [],
            moduleIds.manufacturing.length > 0 ? prisma.order.findMany({
                where: { id: { in: moduleIds.manufacturing } },
                include: { opportunity: true, currentStage: true }
            }) : [],
            moduleIds.support.length > 0 ? prisma.supportTicket.findMany({
                where: { id: { in: moduleIds.support } },
                include: { incharge: true, order: true }
            }) : [],
            moduleIds['supply-chain'].length > 0 ? prisma.supplyRequest.findMany({
                where: { id: { in: moduleIds['supply-chain'] } },
                include: { incharge: true, stage: true }
            }) : []
        ])

        return NextResponse.json({
            opportunities,
            orders,
            tickets,
            requests,
            others,
            history: data.history || []
        })
    } catch (error) {
        console.error("Weekly review details error:", error)
        return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 })
    }
}
