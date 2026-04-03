import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const companyId = searchParams.get('companyId')

        const orders = await prisma.inventoryOrder.findMany({
            where: companyId ? { companyId } : undefined,
            orderBy: { date: 'desc' },
            include: {
                supplier: true,
                items: true,
            }
        })
        
        // Transform for UI (needs id, date, details, supplier, total, status)
        const mappedOrders = orders.map(o => ({
            id: o.orderNumber,
            dbId: o.id,
            date: o.date.toISOString(),
            details: o.details || `Order ${o.orderNumber}`,
            supplier: o.supplier?.supplierName || "Unknown",
            supplierId: o.supplierSlno,
            total: o.total,
            status: o.status,
            expectedDelivery: o.expectedDelivery?.toISOString(),
            conditions: o.conditions,
            remarks: o.remarks,
            paymentType: o.paymentTypeId?.toString() || 'Credit',
            type: o.type,
            orderId: o.orderId,
            items: o.items.map(i => ({
                id: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                tax: i.tax
            }))
        }))

        return NextResponse.json(mappedOrders)
    } catch (error) {
        console.error("Inventory Fetch Error:", error)
        return NextResponse.json({ error: "Failed to fetch inventory orders" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { companyId, date, details, supplierId, items, total, expectedDelivery, conditions, remarks, type, orderId } = body

        if (!supplierId || !items || !items.length) {
            return NextResponse.json({ error: "Missing supplier or items" }, { status: 400 })
        }

        const dDate = new Date(date)
        const dayStr = String(dDate.getDate()).padStart(2, '0') + 
                       String(dDate.getMonth() + 1).padStart(2, '0') + 
                       String(dDate.getFullYear()).slice(-2)

        const todayCount = await prisma.inventoryOrder.count({
            where: {
                orderNumber: { startsWith: dayStr }
            }
        })
        
        const orderNumber = `${dayStr}${String(todayCount + 1).padStart(3, '0')}`

        const newOrder = await prisma.inventoryOrder.create({
            data: {
                orderNumber,
                type: type || 'INTERNAL',
                orderId: orderId || null,
                date: dDate,
                details,
                supplierSlno: parseInt(supplierId),
                companyId: companyId && companyId !== '' ? companyId : null,
                total: parseFloat(total),
                expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
                conditions,
                remarks,
                status: 'Pending',
                items: {
                    create: items.map((i: any) => ({
                        name: i.name,
                        price: parseFloat(i.price) || 0,
                        quantity: parseFloat(i.quantity) || 0,
                        tax: parseFloat(i.tax) || 0
                    }))
                }
            }
        })

        return NextResponse.json(newOrder)
    } catch (error) {
        console.error("Inventory Create Error:", error)
        return NextResponse.json({ error: "Failed to create inventory order" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { dbId, status, receivedOn, ...updateData } = body

        if (!dbId) return NextResponse.json({ error: "ID missing" }, { status: 400 })

        // Check if updating only status (receive order)
        if (status === 'Received') {
            const updated = await prisma.inventoryOrder.update({
                where: { id: dbId },
                data: {
                    status: 'Received',
                    receivedOn: receivedOn ? new Date(receivedOn) : new Date()
                }
            })
            return NextResponse.json(updated)
        }

        // Otherwise full update
        // We delete old items and recreate for simplicity
        await prisma.inventoryItem.deleteMany({
            where: { inventoryOrderId: dbId }
        })

        const updatedOrder = await prisma.inventoryOrder.update({
            where: { id: dbId },
            data: {
                date: updateData.date ? new Date(updateData.date) : undefined,
                type: updateData.type || undefined,
                orderId: updateData.orderId || null,
                details: updateData.details,
                supplierSlno: updateData.supplierId ? parseInt(updateData.supplierId) : undefined,
                companyId: updateData.companyId && updateData.companyId !== '' ? updateData.companyId : null,
                total: updateData.total ? parseFloat(updateData.total) : undefined,
                expectedDelivery: updateData.expectedDelivery ? new Date(updateData.expectedDelivery) : null,
                conditions: updateData.conditions,
                remarks: updateData.remarks,
                items: {
                    create: updateData.items.map((i: any) => ({
                        name: i.name,
                        price: parseFloat(i.price) || 0,
                        quantity: parseFloat(i.quantity) || 0,
                        tax: parseFloat(i.tax) || 0
                    }))
                }
            }
        })

        return NextResponse.json(updatedOrder)
    } catch (error) {
        console.error("Inventory Update Error:", error)
        return NextResponse.json({ error: "Failed to update inventory order" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 })

        await prisma.inventoryOrder.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Inventory Delete Error:", error)
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
    }
}
