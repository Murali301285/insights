import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const type = url.searchParams.get("type") || "all"

        const settings = await prisma.settings.findUnique({
            where: { key: "weekly_review_data" }
        })

        const defaultData = { items: [], others: [] }
        const data = settings ? (settings.value as any) : defaultData

        if (type === "items") return NextResponse.json(data.items || [])
        if (type === "others") return NextResponse.json(data.others || [])
        if (type === "history") return NextResponse.json(data.history || [])

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch weekly review data" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action, module, itemId, content, createdBy, disabled, id } = body

        const settings = await prisma.settings.findUnique({
            where: { key: "weekly_review_data" }
        })

        const data = settings ? (settings.value as any) : { items: [], others: [] }
        if (!data.items) data.items = []
        if (!data.others) data.others = []

        if (action === "toggle_item") {
            const existingIndex = data.items.findIndex((i: any) => i.module === module && i.itemId === itemId)
            if (existingIndex > -1) {
                data.items.splice(existingIndex, 1) // Remove
            } else {
                data.items.push({ module, itemId, addedAt: new Date().toISOString() }) // Add
            }
        } else if (action === "add_other") {
            data.others.push({
                id: Date.now().toString(),
                content,
                createdBy: createdBy || "Admin",
                createdAt: new Date().toISOString(),
                disabled: false
            })
        } else if (action === "update_other") {
            const index = data.others.findIndex((o: any) => o.id === id)
            if (index > -1) {
                if (content !== undefined) data.others[index].content = content
                if (disabled !== undefined) data.others[index].disabled = disabled
            }
        } else if (action === "delete_other") {
            data.others = data.others.filter((o: any) => o.id !== id)
        } else if (action === "complete_meeting") {
            if (!data.history) data.history = []
            
            // Get week number logic
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            const weekNo = Math.ceil(days / 7);

            data.history.push({
                id: Date.now().toString(),
                date: today.toISOString(),
                weekNo,
                year: today.getFullYear(),
                items: [...data.items],
                others: [...data.others]
            })

            data.items = []
            data.others = []
        }

        await prisma.settings.upsert({
            where: { key: "weekly_review_data" },
            update: { value: data },
            create: { key: "weekly_review_data", value: data }
        })

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error("Error in weekly review API", error)
        return NextResponse.json({ error: "Failed to update weekly review data" }, { status: 500 })
    }
}
