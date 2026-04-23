import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Status required" }, { status: 400 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;
        const existingTask = await prisma.task.findUnique({ where: { id } });

        if (!existingTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const updateData: any = { status };
        
        // If marking as completed, set completedAt
        if (status === 'Completed' && existingTask.status !== 'Completed') {
            updateData.completedAt = new Date();
        } else if (status !== 'Completed') {
            updateData.completedAt = null; // Reopen if moved back
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedTask);
    } catch (error: any) {
        console.error("PUT Task Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
