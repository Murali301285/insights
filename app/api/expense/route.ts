import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const companyId = searchParams.get('companyId')
        const employeeId = searchParams.get('employeeId')
        const fromDateStr = searchParams.get('fromDate')
        const toDateStr = searchParams.get('toDate')

        const whereClause: any = {}

        if (companyId && companyId !== 'all') {
            const ids = companyId.split(',')
            whereClause.companyId = { in: ids }
        }

        if (employeeId && employeeId !== 'all') {
            whereClause.userId = employeeId
        }

        if (fromDateStr || toDateStr) {
            whereClause.date = {}
            if (fromDateStr) {
                whereClause.date.gte = new Date(fromDateStr)
            }
            if (toDateStr) {
                const toDate = new Date(toDateStr)
                toDate.setHours(23, 59, 59, 999)
                whereClause.date.lte = toDate
            }
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            include: {
                user: true,
                category: true,
                currency: true
            },
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json(expenses)
    } catch (error) {
        console.error("Expense fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { 
            companyId, userId, date, categoryId, description, 
            currencyId, amount, bucketType, bucketReference 
        } = body

        if (!userId || !date || !categoryId || !currencyId || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const expense = await prisma.expense.create({
            data: {
                companyId: companyId && companyId !== 'all' ? companyId.split(',')[0] : null,
                userId,
                date: new Date(date),
                categoryId: parseInt(categoryId),
                description: description || "",
                currencyId: parseInt(currencyId),
                amount: parseFloat(amount),
                bucketType: bucketType || "NA",
                bucketReference: bucketReference || null,
            },
            include: {
                user: true,
                category: true,
                currency: true
            }
        })

        return NextResponse.json(expense, { status: 201 })
    } catch (error) {
        console.error("Expense create error:", error)
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json()
        const { id } = body

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        await prisma.expense.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Expense delete error:", error)
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
    }
}
