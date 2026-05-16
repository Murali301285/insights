import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    if (!companyId) return new NextResponse("Company ID missing", { status: 400 })

    try {
        const banks = await prisma.companyBank.findMany({
            where: { companyId },
            orderBy: { isPrimary: "desc" }
        })
        return NextResponse.json(banks)
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { companyId, bankName, accountType, accountNumber, ifscCode, branchName, address, chequeLeaf, isPrimary } = body

        // If this is primary, unset other primaries
        if (isPrimary) {
            await prisma.companyBank.updateMany({
                where: { companyId },
                data: { isPrimary: false }
            })
        }

        const bank = await prisma.companyBank.create({
            data: {
                companyId,
                bankName,
                accountType,
                accountNumber,
                ifscCode,
                branchName,
                address,
                chequeLeaf,
                isPrimary
            }
        })
        return NextResponse.json(bank)
    } catch (e: any) {
        if (e.code === 'P2002') return new NextResponse("Duplicate Account Number", { status: 400 })
        return new NextResponse("Error", { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { id, companyId, bankName, accountType, accountNumber, ifscCode, branchName, address, chequeLeaf, isPrimary } = body

        if (isPrimary) {
            await prisma.companyBank.updateMany({
                where: { companyId, id: { not: id } },
                data: { isPrimary: false }
            })
        }

        const bank = await prisma.companyBank.update({
            where: { id },
            data: {
                bankName,
                accountType,
                accountNumber,
                ifscCode,
                branchName,
                address,
                chequeLeaf,
                isPrimary
            }
        })
        return NextResponse.json(bank)
    } catch (e: any) {
        if (e.code === 'P2002') return new NextResponse("Duplicate Account Number", { status: 400 })
        return new NextResponse("Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return new NextResponse("ID missing", { status: 400 })

    try {
        await prisma.companyBank.delete({ where: { id } })
        return new NextResponse("Deleted", { status: 200 })
    } catch (e) {
        return new NextResponse("Error", { status: 500 })
    }
}
