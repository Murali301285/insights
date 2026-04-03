import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('companyId')

        if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 })

        const funds = await prisma.financeFundValue.findMany({
            where: { companyId },
            orderBy: { date: 'desc' }
        })

        return NextResponse.json(funds)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, companyId, date, fundValue, utilised, remarks } = body

        if (!companyId || !date) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

        if (id) {
            const updated = await prisma.financeFundValue.update({
                where: { id: Number(id) },
                data: {
                    date: new Date(date),
                    fundValue: Number(fundValue) || 0,
                    utilised: Number(utilised) || 0,
                    remarks: remarks || "",
                }
            })
            return NextResponse.json(updated)
        } else {
            const newFund = await prisma.financeFundValue.create({
                data: {
                    companyId,
                    date: new Date(date),
                    fundValue: Number(fundValue) || 0,
                    utilised: Number(utilised) || 0,
                    remarks: remarks || "",
                }
            })
            return NextResponse.json(newFund)
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

        await prisma.financeFundValue.delete({
            where: { id: parseInt(id) }
        })

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// Trigger recreation
