import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const type = searchParams.get("type")
    
    try {
        const docs = await prisma.salesDocument.findMany({
            where: { 
                companyId: companyId || undefined,
                type: type || undefined
            },
            include: {
                customer: true,
                items: true,
                approvalHistory: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(docs)
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { 
            type, companyId, customerSlno, items, 
            targetDate, paymentTerms, justification,
            dispatchDetails, lrNumber, vehicleNumber, placeOfSupply,
            parentDocumentId, creatorId 
        } = body

        // Generate Document Number
        const count = await prisma.salesDocument.count({ where: { type, companyId } })
        const prefix = type === "QUOTATION" ? "QT" : type === "SO" ? "SO" : type === "PI" ? "PI" : "INV"
        const docNo = `${prefix}-${(count + 1).toString().padStart(4, '0')}`

        const doc = await prisma.salesDocument.create({
            data: {
                type,
                documentNumber: docNo,
                status: "PENDING",
                companyId,
                customerSlno: parseInt(customerSlno),
                targetDate: targetDate ? new Date(targetDate) : null,
                paymentTerms,
                justification,
                dispatchDetails,
                lrNumber,
                vehicleNumber,
                placeOfSupply,
                parentDocumentId,
                creatorId,
                items: {
                    create: items.map((item: any) => ({
                        description: item.description,
                        quantity: parseFloat(item.quantity),
                        rate: parseFloat(item.rate),
                        taxType: item.taxType,
                        cgst: parseFloat(item.cgst || 0),
                        sgst: parseFloat(item.sgst || 0),
                        igst: parseFloat(item.igst || 0),
                        discount: parseFloat(item.discount || 0),
                        total: parseFloat(item.total)
                    }))
                }
            }
        })

        // Handle Partial Invoicing consumption tracking
        if (parentDocumentId) {
            for (const item of items) {
                if (item.parentItemId) {
                    await prisma.salesDocumentItem.update({
                        where: { id: item.parentItemId },
                        data: {
                            invoicedQty: { increment: parseFloat(item.quantity) }
                        }
                    })
                }
            }
        }

        return NextResponse.json(doc)
    } catch (e: any) {
        console.error(e)
        return new NextResponse(e.message || "Error", { status: 500 })
    }
}
