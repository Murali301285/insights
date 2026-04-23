"use client"
import * as React from "react"
import { PremiumCard } from "@/components/design/PremiumCard"

export default function EmailModulePlaceholder() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900">Internal Email Module</h1>
            <p className="text-zinc-500">Awaiting OAuth integration configurations (Google/Microsoft).</p>
            <PremiumCard className="p-8 flex items-center justify-center min-h-[400px] border-zinc-200 border-dashed">
                <span className="text-zinc-400 font-medium">Future OAuth Setup Required</span>
            </PremiumCard>
        </div>
    )
}
