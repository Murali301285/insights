import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    
    try {
        const workflows = await prisma.salesWorkflowMaster.findMany({
            where: { 
                companyId: companyId || undefined,
                isDelete: false 
            },
            include: {
                steps: {
                    include: { user: true },
                    orderBy: { stepOrder: 'asc' }
                }
            }
        })
        return NextResponse.json(workflows)
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { companyId, name, docType, steps } = body

        const workflow = await prisma.salesWorkflowMaster.create({
            data: {
                companyId,
                name,
                docType,
                steps: {
                    create: steps.map((s: any) => ({
                        userId: s.userId,
                        stepOrder: s.stepOrder
                    }))
                }
            }
        })
        return NextResponse.json(workflow)
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}
