import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all workflows
export async function GET(req: NextRequest) {
    try {
        const workflows = await prisma.poWorkflowMaster.findMany({
            include: {
                company: true,
                steps: {
                    include: {
                        user: true
                    },
                    orderBy: {
                        stepOrder: 'asc'
                    }
                },
                _count: {
                    select: { requests: { where: { status: "PENDING_APPROVAL" } } }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return NextResponse.json(workflows);
    } catch (error) {
        console.error("GET PO Workflows error:", error);
        return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
    }
}

// POST create a new workflow
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyId, name, isActive, steps } = body;

        if (!companyId || !name || !steps || steps.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate uniqueness of users in steps
        const userIds = steps.map((s: any) => s.userId);
        const uniqueUserIds = new Set(userIds);
        if (uniqueUserIds.size !== userIds.length) {
            return NextResponse.json({ error: "A user cannot be assigned to more than one step in the same workflow." }, { status: 400 });
        }

        const newWorkflow = await prisma.poWorkflowMaster.create({
            data: {
                companyId,
                name,
                isActive: isActive ?? true,
                steps: {
                    create: steps.map((s: any, index: number) => ({
                        stepOrder: index + 1,
                        userId: s.userId,
                        autoActionType: s.autoActionType || "NA",
                        autoActionHours: s.autoActionHours ? parseInt(s.autoActionHours) : null
                    }))
                }
            }
        });

        return NextResponse.json(newWorkflow, { status: 201 });
    } catch (error) {
        console.error("POST PO Workflow error:", error);
        return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
    }
}

// PUT edit a workflow
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, companyId, name, isActive, steps } = body;

        // Check if workflow has active pending requests
        const pendingCount = await prisma.purchaseOrderRequest.count({
            where: { workflowId: id, status: "PENDING_APPROVAL" }
        });

        if (pendingCount > 0) {
            return NextResponse.json({ 
                error: "This workflow has pending purchase orders. You are not allowed to update the workflow since these POs are pending action." 
            }, { status: 403 });
        }

        // Delete existing steps and recreate them
        await prisma.poWorkflowStep.deleteMany({
            where: { workflowId: id }
        });

        const updatedWorkflow = await prisma.poWorkflowMaster.update({
            where: { id },
            data: {
                companyId,
                name,
                isActive,
                steps: {
                    create: steps.map((s: any, index: number) => ({
                        stepOrder: index + 1,
                        userId: s.userId,
                        autoActionType: s.autoActionType || "NA",
                        autoActionHours: s.autoActionHours ? parseInt(s.autoActionHours) : null
                    }))
                }
            }
        });

        return NextResponse.json(updatedWorkflow);
    } catch (error) {
        console.error("PUT PO Workflow error:", error);
        return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
    }
}

// DELETE a workflow
export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing workflow ID" }, { status: 400 });

        // Check if workflow has active pending requests
        const pendingCount = await prisma.purchaseOrderRequest.count({
            where: { workflowId: id, status: "PENDING_APPROVAL" }
        });

        if (pendingCount > 0) {
            return NextResponse.json({ 
                error: "This workflow has pending purchase orders. You are not allowed to delete the workflow since these POs are pending action." 
            }, { status: 403 });
        }

        // Delete workflow
        await prisma.poWorkflowMaster.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Workflow deleted" });
    } catch (error) {
        console.error("DELETE PO Workflow error:", error);
        return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
    }
}
