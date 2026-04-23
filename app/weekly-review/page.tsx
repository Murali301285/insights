"use client"
import * as React from "react"
import { useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider";
import { PremiumCard } from "@/components/design/PremiumCard"

export default function WeeklyReviewModule() {
    const { setHeaderInfo } = useHeader();
    useEffect(() => {
        setHeaderInfo("Weekly Management Review", "Executive tracking and status update matrix for all operational verticals.");
    }, [setHeaderInfo]);

    return (
        <div className="space-y-6">
            
            <PremiumCard className="p-8 flex items-center justify-center min-h-[400px] border-zinc-200 border-dashed">
                <span className="text-zinc-400 font-medium">Coming Soon</span>
            </PremiumCard>
        </div>
    )
}
