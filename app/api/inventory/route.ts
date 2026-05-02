import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const companyId = searchParams.get('companyId')

        const items = await prisma.inventoryMaster.findMany({
            where: {
                isDelete: false,
                ...(companyId ? { companyId } : {})
            },
            include: {
                components: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(items)
    } catch (error) {
        console.error("Inventory Fetch Error:", error)
        return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { 
            companyId, type, name, categoryId, hsnCode, description, 
            unit, rate, gst, igst, quantity, components 
        } = body

        if (!name || !type) {
            return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
        }

        const newItem = await prisma.inventoryMaster.create({
            data: {
                companyId: companyId || null,
                type,
                name,
                categoryId: categoryId ? parseInt(categoryId) : null,
                hsnCode,
                description,
                unit,
                rate: parseFloat(rate) || 0,
                gst,
                igst,
                quantity: parseFloat(quantity) || 1,
                components: components && components.length > 0 ? {
                    create: components.map((c: any) => ({
                        componentName: c.name,
                        qty: parseFloat(c.qty) || 0,
                        rate: parseFloat(c.rate) || 0,
                        total: parseFloat(c.total) || 0
                    }))
                } : undefined
            },
            include: {
                components: true
            }
        })

        return NextResponse.json(newItem, { status: 201 })
    } catch (error) {
        console.error("Inventory Create Error:", error)
        return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { 
            id, companyId, type, name, categoryId, hsnCode, description, 
            unit, rate, gst, igst, quantity, components 
        } = body

        if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 })

        // Replace components
        if (components) {
            await prisma.inventorySubComponent.deleteMany({
                where: { inventoryMasterId: id }
            })
        }

        const updated = await prisma.inventoryMaster.update({
            where: { id },
            data: {
                companyId: companyId || null,
                type,
                name,
                categoryId: categoryId ? parseInt(categoryId) : null,
                hsnCode,
                description,
                unit,
                rate: parseFloat(rate) || 0,
                gst,
                igst,
                quantity: parseFloat(quantity) || 1,
                components: components && components.length > 0 ? {
                    create: components.map((c: any) => ({
                        componentName: c.name,
                        qty: parseFloat(c.qty) || 0,
                        rate: parseFloat(c.rate) || 0,
                        total: parseFloat(c.total) || 0
                    }))
                } : undefined
            },
            include: {
                components: true
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Inventory Update Error:", error)
        return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 })

        const deleted = await prisma.inventoryMaster.update({
            where: { id },
            data: { isDelete: true }
        })

        return NextResponse.json({ success: true, deleted })
    } catch (error) {
        console.error("Inventory Delete Error:", error)
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
    }
}
