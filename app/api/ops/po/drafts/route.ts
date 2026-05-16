import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    
    try {
        const drafts = await prisma.poDraft.findMany({
            where: companyId ? { companyId } : {},
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
        const { companyId, name, data, id } = body

        if (id) {
            // Update existing draft
            const draft = await prisma.poDraft.update({
                where: { id },
                data: { name, data, companyId }
            })
            return NextResponse.json(draft)
        } else {
            // Create new draft
            const draft = await prisma.poDraft.create({
                data: { name, data, companyId }
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
        await prisma.poDraft.delete({ where: { id } })
        return new NextResponse("Deleted", { status: 200 })
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}
