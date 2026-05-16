import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const type = searchParams.get("type")
    
    try {
        const drafts = await prisma.salesDocumentDraft.findMany({
            where: { 
                companyId: companyId || undefined,
                type: type || undefined
            },
            orderBy: { updatedAt: "desc" }
        })
        return NextResponse.json(drafts)
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { id, companyId, name, type, data } = body

        if (id) {
            const draft = await prisma.salesDocumentDraft.update({
                where: { id },
                data: { name, type, data, companyId }
            })
            return NextResponse.json(draft)
        } else {
            const draft = await prisma.salesDocumentDraft.create({
                data: { name, type, data, companyId }
            })
            return NextResponse.json(draft)
        }
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return new NextResponse("ID missing", { status: 400 })

    try {
        await prisma.salesDocumentDraft.delete({ where: { id } })
        return new NextResponse("Deleted", { status: 200 })
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}
