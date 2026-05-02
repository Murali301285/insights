import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type')
        const activeOnly = searchParams.get('active') === 'true'

        const whereClause: any = { isDelete: false }
        if (type) {
            whereClause.type = type
        }
        if (activeOnly) {
            whereClause.isActive = true
        }

        const lookups = await prisma.lookupMaster.findMany({
            where: whereClause,
            orderBy: { value: 'asc' }
        })

        return NextResponse.json(lookups)
    } catch (error) {
        console.error("Error fetching lookups:", error)
        return NextResponse.json({ error: "Failed to fetch lookups" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { type, value, label, remarks } = body

        if (!type || !value) {
            return NextResponse.json({ error: "Type and Value are required" }, { status: 400 })
        }

        const newLookup = await prisma.lookupMaster.create({
            data: {
                type,
                value,
                label,
                remarks
            }
        })

        return NextResponse.json(newLookup, { status: 201 })
    } catch (error: any) {
        console.error("Error creating lookup:", error?.message, error?.stack)
        return NextResponse.json({ error: "Failed to create lookup", details: error?.message || "Unknown error" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { id, value, label, remarks, isActive } = body

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        const updateData: any = {}
        if (value !== undefined) updateData.value = value
        if (label !== undefined) updateData.label = label
        if (remarks !== undefined) updateData.remarks = remarks
        if (isActive !== undefined) updateData.isActive = isActive

        const updated = await prisma.lookupMaster.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Error updating lookup:", error)
        return NextResponse.json({ error: "Failed to update lookup" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        // Soft delete
        const deleted = await prisma.lookupMaster.update({
            where: { id },
            data: { isDelete: true }
        })

        return NextResponse.json({ success: true, deleted })
    } catch (error) {
        console.error("Error deleting lookup:", error)
        return NextResponse.json({ error: "Failed to delete lookup" }, { status: 500 })
    }
}
