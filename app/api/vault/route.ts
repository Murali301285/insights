import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { companies: true, role: true }
        });

        // 1. Check access clearance
        if (!dbUser || (dbUser.role?.name !== 'admin' && !dbUser.hasVaultAccess)) {
            return NextResponse.json({ error: "Forbidden: You do not have Vault clearance." }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');
        const category = searchParams.get('category'); // Optional filtering

        // Ensure user actually belongs to company they are requesting (unless global/admin)
        if (dbUser.role?.name !== 'admin' && !dbUser.hasGlobalAccess && companyId !== 'all') {
            const belongsToComp = dbUser.companies?.some(c => c.id === companyId);
            if (!belongsToComp) {
                return NextResponse.json({ error: "Forbidden: Company access denied." }, { status: 403 });
            }
        }

        if (searchParams.get('counts') === 'true') {
            const counts = await prisma.vaultDocument.groupBy({
                by: ['category'],
                where: companyId && companyId !== 'all' ? { companyId } : {},
                _count: {
                    id: true
                }
            });
            return NextResponse.json(counts);
        }

        const whereClause: any = {};
        if (companyId && companyId !== 'all') whereClause.companyId = companyId;
        if (category) whereClause.category = category;

        const documents = await prisma.vaultDocument.findMany({
            where: whereClause,
            include: {
                uploadedBy: { select: { profileName: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        console.error("GET Vault Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ 
            where: { email: session.user.email },
            include: { role: true }
        });
        if (!dbUser || (dbUser.role?.name !== 'admin' && !dbUser.hasVaultAccess)) {
            return NextResponse.json({ error: "Forbidden: Vault access denied" }, { status: 403 });
        }

        const body = await req.json();
        const { companyId, category, fileName, fileData, description } = body;

        if (!companyId || !category || !fileName || !fileData) {
            return NextResponse.json({ error: "Missing required document fields" }, { status: 400 });
        }

        const vaultDoc = await prisma.vaultDocument.create({
            data: {
                companyId,
                category,
                fileName,
                fileData,
                description: description || null,
                uploadedById: dbUser.id,
            }
        });

        return NextResponse.json(vaultDoc);
    } catch (error: any) {
        console.error("POST Vault Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ 
            where: { email: session.user.email },
            include: { role: true }
        });
        if (!dbUser || (dbUser.role?.name !== 'admin' && !dbUser.hasVaultAccess)) {
            return NextResponse.json({ error: "Forbidden: Vault access denied" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
        }

        await prisma.vaultDocument.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE Vault Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
