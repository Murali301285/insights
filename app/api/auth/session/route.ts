import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        return NextResponse.json(session || {});
    } catch (error) {
        console.error("Session Retrieval Error:", error);
        return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
    }
}
