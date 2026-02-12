import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit to last 100 for now
        })
        return NextResponse.json(logs)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }
}
