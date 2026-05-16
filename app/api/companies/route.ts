import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        
        let whereClause: any = {};
        
        const url = new URL(req.url);
        const activeOnly = url.searchParams.get('active') === 'true';

        if (activeOnly) {
            whereClause.isBlocked = false;
        }

        if (session && session.user && session.user.role !== 'admin') {
            whereClause.users = {
                some: {
                    id: session.user.id
                }
            };
        }

        const companies = await prisma.company.findMany({
            where: whereClause,
            include: {
                DocumentTemplates: true
            },
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
        const { 
            name, code, address, registrationNumber, contactEmail, contactPhone, 
            colorIndicator, contactPerson, description, 
            logo, signature, seal, conditions,
            bankName, accountNumber, ifscCode, branch, accountName
        } = body;

        const company = await prisma.company.create({
            data: {
                name,
                code,
                address,
                registrationNumber,
                contactEmail,
                contactPhone,
                colorIndicator,
                contactPerson,
                description,
                logo,
                signature,
                seal,
                conditions,
                bankName,
                accountNumber,
                ifscCode,
                branch,
                accountName
            },
        });

        return NextResponse.json(company);
    } catch (error) {
        console.error("POST Error:", error);
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

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            id, name, code, address, registrationNumber, contactEmail, contactPhone, 
            colorIndicator, contactPerson, description, isBlocked,
            logo, signature, seal, conditions,
            bankName, accountNumber, ifscCode, branch, accountName
        } = body;

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const company = await prisma.company.update({
            where: { id },
            data: {
                name,
                code,
                address,
                registrationNumber,
                contactEmail,
                contactPhone,
                colorIndicator,
                contactPerson,
                description,
                isBlocked,
                logo,
                signature,
                seal,
                conditions,
                bankName,
                accountNumber,
                ifscCode,
                branch,
                accountName
            },
        });

        return NextResponse.json(company);
    } catch (error) {
        console.error("PUT Error:", error);
        return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }
}
