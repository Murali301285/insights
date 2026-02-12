import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const companies = await prisma.company.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(companies);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, code, address, registrationNumber, contactEmail, contactPhone } = body;

        const company = await prisma.company.create({
            data: {
                name,
                code,
                address,
                registrationNumber,
                contactEmail,
                contactPhone
            },
        });

        return NextResponse.json(company);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await prisma.company.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
    }
}
