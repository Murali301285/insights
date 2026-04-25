import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('companyId');

        let userRole = "user";
        let dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { companies: true, role: true }
        });

        if (dbUser && dbUser.role) userRole = (dbUser.role as any).name;

        // Base where clause using company grouping
        const whereClause: any = {};
        if (companyId && companyId !== 'all') {
            if (companyId.includes(',')) {
                whereClause.companyId = { in: companyId.split(',') };
            } else {
                whereClause.companyId = companyId;
            }
        }

        const viewMode = searchParams.get('view') || 'all'; // 'all' or 'my'

        if (viewMode === 'my' || userRole === 'user') {
            // Users only see tasks assigned to them explicitly OR if explicitly toggled 'my'
            whereClause.assignedToId = dbUser?.id;
        } else if (userRole === 'admin') {
            // Admin sees all in the company
        } else if (userRole === 'manager') {
            // Manager sees tasks assigned to them, created by them, OR we can just show all in company if same
            // For rigorous hierarchy, ideally we check HierarchyNode children. 
            // For simplicity (as noted in implementation plan fallback), we'll let Manager see all tasks in their company
            // Since they are a "manager".
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                assignedBy: { select: { id: true, profileName: true, email: true } },
                assignedTo: { select: { id: true, profileName: true, email: true } },
                project: { select: { orderNo: true, opportunity: { select: { opportunityName: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tasks);
    } catch (error: any) {
        console.error("GET Tasks Error:", error);
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
            include: { companies: true, role: true }
        });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const roleName = dbUser.role ? (dbUser.role as any).name : 'user';
        if (roleName === 'user') {
            return NextResponse.json({ error: "Standard users cannot assign tasks" }, { status: 403 });
        }

        const body = await req.json();
        const { companyId, title, description, assignedToId, function: funcName, projectId, otherProject, startDate, dueDate, priority, estimatedHrs } = body;

        const actualCompanyId = companyId || (dbUser.companies && dbUser.companies[0]?.id);

        if (!actualCompanyId || !description || !assignedToId || !funcName || !dueDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                companyId: actualCompanyId,
                title: title || null,
                description,
                assignedById: dbUser.id,
                assignedToId,
                function: funcName,
                projectId: projectId || null,
                otherProject: otherProject || null,
                startDate: startDate ? new Date(startDate) : null,
                dueDate: new Date(dueDate),
                estimatedHrs: estimatedHrs || null,
                priority: priority || 'medium',
                status: 'Pending'
            }
        });

        return NextResponse.json(task);
    } catch (error: any) {
        console.error("POST Tasks Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
