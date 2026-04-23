"use client"
import * as React from "react"
import { PremiumCard } from "@/components/design/PremiumCard"

export default function ConfigModulePlaceholder() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900 bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">System Configuration</h1>
            <p className="text-zinc-500">Master database configurations, Roles, Users, and Tax Settings mapping parameters.</p>
            <PremiumCard className="p-8 flex items-center justify-center min-h-[400px] border-zinc-200 border-dashed">
                <span className="text-zinc-400 font-medium tracking-wide border px-4 py-2 border-zinc-200 bg-zinc-50 rounded text-sm">Under Technical Expansion</span>
            </PremiumCard>
        </div>
    )
}
