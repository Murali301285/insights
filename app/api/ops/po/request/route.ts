import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

// GET POs based on type
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // "all", "mine", "pending"

    try {
        let where: any = {};

        if (type === "mine") {
            where.createdById = session.user.id;
        } else if (type === "pending") {
            // Find POs where the current step's userId matches the session user
            // This is slightly complex in Prisma, so we might need a join or findMany then filter
            const pendingPos = await prisma.purchaseOrderRequest.findMany({
                where: {
                    status: "PENDING_APPROVAL",
                    workflow: {
                        steps: {
                            some: {
                                userId: session.user.id
                            }
                        }
                    }
                },
                include: {
                    workflow: {
                        include: {
                            steps: true
                        }
                    },
                    company: true,
                    supplier: true,
                    createdBy: true,
                    history: {
                        include: {
                            user: true
                        },
                        orderBy: {
                            timestamp: 'desc'
                        }
                    }
                }
            });

            // Filter in JS to ensure user is at the CORRECT current step
            const myPending = pendingPos.filter(po => {
                const currentStep = po.workflow.steps.find(s => s.stepOrder === po.currentStepOrder);
                return currentStep?.userId === session.user.id;
            });

            return NextResponse.json(myPending);
        }

        const pos = await prisma.purchaseOrderRequest.findMany({
            where,
            include: {
                company: true,
                supplier: true,
                createdBy: true,
                workflow: {
                    include: {
                        steps: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                history: {
                    include: {
                        user: true
                    },
                    orderBy: {
                        timestamp: 'desc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(pos);
    } catch (error) {
        console.error("GET PO error:", error);
        return NextResponse.json({ error: "Failed to fetch POs" }, { status: 500 });
    }
}

// POST create a new PO request
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { companyId, supplierSlno, items, targetDate, paymentTerms, justification, attachments, workflowId } = body;

        if (!companyId || !supplierSlno || !items || items.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find workflow: either use the one provided or find the first active one for this company
        let workflow;
        if (workflowId) {
            workflow = await prisma.poWorkflowMaster.findUnique({
                where: { id: workflowId },
                include: { steps: { orderBy: { stepOrder: 'asc' } } }
            });
        } else {
            workflow = await prisma.poWorkflowMaster.findFirst({
                where: { companyId, isActive: true, isDelete: false },
                include: { steps: { orderBy: { stepOrder: 'asc' } } }
            });
        }

        if (!workflow || workflow.steps.length === 0) {
            return NextResponse.json({ error: "No valid approval workflow found." }, { status: 400 });
        }

        // Generate PO Number
        const count = await prisma.purchaseOrderRequest.count({
            where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } }
        });
        const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        const po = await prisma.purchaseOrderRequest.create({
            data: {
                poNumber,
                companyId,
                supplierSlno: parseInt(supplierSlno),
                items,
                targetDate: targetDate ? new Date(targetDate) : null,
                paymentTerms,
                justification,
                attachments,
                workflowId: workflow.id,
                currentStepOrder: 1,
                status: "PENDING_APPROVAL",
                createdById: session.user.id
            },
            include: {
                workflow: {
                    include: {
                        steps: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        // Add to history
        await prisma.poApprovalHistory.create({
            data: {
                poRequestId: po.id,
                stepOrder: 0, // 0 indicates creation
                userId: session.user.id,
                action: "CREATED",
                remarks: "PO Request Raised"
            }
        });

        // Send Email to the first approver
        const firstApprover = po.workflow.steps.find(s => s.stepOrder === 1);
        if (firstApprover?.user?.email) {
            await sendEmail({
                to: firstApprover.user.email,
                subject: `Approval Required: ${po.poNumber}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Purchase Order Approval Request</h2>
                        <p>A new Purchase Order Request <strong>${po.poNumber}</strong> has been raised by ${session.user.name || session.user.email}.</p>
                        <p><strong>Justification:</strong> ${po.justification || 'N/A'}</p>
                        <div style="margin-top: 20px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/ops/purchase-order?tab=approvals" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View & Approve</a>
                        </div>
                    </div>
                `
            });
        }

        return NextResponse.json(po, { status: 201 });
    } catch (error) {
        console.error("POST PO error:", error);
        return NextResponse.json({ error: "Failed to create PO" }, { status: 500 });
    }
}

// PUT handle approve/reject/resubmit
export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, action, remarks } = body; // action: "APPROVE", "REJECT", "RESUBMIT"

        const po = await prisma.purchaseOrderRequest.findUnique({
            where: { id },
            include: {
                workflow: { include: { steps: { include: { user: true } } } },
                createdBy: true
            }
        });

        if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

        if (action === "APPROVE") {
            const currentStep = po.workflow.steps.find(s => s.stepOrder === po.currentStepOrder);
            if (currentStep?.userId !== session.user.id) {
                return NextResponse.json({ error: "You are not the authorized approver for this step." }, { status: 403 });
            }

            const isFinalStep = po.currentStepOrder === po.workflow.steps.length;

            if (isFinalStep) {
                await prisma.purchaseOrderRequest.update({
                    where: { id },
                    data: { status: "APPROVED" }
                });
            } else {
                await prisma.purchaseOrderRequest.update({
                    where: { id },
                    data: { currentStepOrder: po.currentStepOrder + 1 }
                });

                // Notify next approver
                const nextApprover = po.workflow.steps.find(s => s.stepOrder === po.currentStepOrder + 1);
                if (nextApprover?.user?.email) {
                    await sendEmail({
                        to: nextApprover.user.email,
                        subject: `Approval Required: ${po.poNumber}`,
                        html: `<p>PO <strong>${po.poNumber}</strong> is waiting for your approval.</p>`
                    });
                }
            }

            await prisma.poApprovalHistory.create({
                data: {
                    poRequestId: id,
                    stepOrder: po.currentStepOrder,
                    userId: session.user.id,
                    action: "APPROVED",
                    remarks
                }
            });

        } else if (action === "REJECT") {
            await prisma.purchaseOrderRequest.update({
                where: { id },
                data: { status: "REJECTED", rejectedRemarks: remarks }
            });

            await prisma.poApprovalHistory.create({
                data: {
                    poRequestId: id,
                    stepOrder: po.currentStepOrder,
                    userId: session.user.id,
                    action: "REJECTED",
                    remarks
                }
            });

            // Notify creator
            if (po.createdBy.email) {
                await sendEmail({
                    to: po.createdBy.email,
                    subject: `PO Rejected: ${po.poNumber}`,
                    html: `<p>Your PO request <strong>${po.poNumber}</strong> has been rejected.</p><p><strong>Remarks:</strong> ${remarks}</p>`
                });
            }
        } else if (action === "RESUBMIT") {
            // Update items/details if provided in body
            const { items, justification, targetDate } = body;
            
            await prisma.purchaseOrderRequest.update({
                where: { id },
                data: { 
                    status: "PENDING_APPROVAL", 
                    currentStepOrder: 1, 
                    resubmittedAt: new Date(),
                    items: items || undefined,
                    justification: justification || undefined,
                    targetDate: targetDate ? new Date(targetDate) : undefined
                }
            });

            await prisma.poApprovalHistory.create({
                data: {
                    poRequestId: id,
                    stepOrder: 0,
                    userId: session.user.id,
                    action: "RESUBMITTED",
                    remarks: "PO Resubmitted after rejection"
                }
            });
            
            // Notify first approver again
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PUT PO error:", error);
        return NextResponse.json({ error: "Failed to process PO action" }, { status: 500 });
    }
}
