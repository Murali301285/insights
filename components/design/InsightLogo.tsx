import { cn } from "@/lib/utils"
import { Eye } from "lucide-react"

export function InsightLogo({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-1 font-bold text-2xl tracking-tighter text-zinc-900", className)}>
            <span>INS</span>
            <div className="relative flex items-center justify-center">
                {/* The 'Eye' represents the O */}
                <Eye className="w-6 h-6 text-zinc-900 stroke-[2.5px] animate-[zoom-in-out_3s_ease-in-out_infinite]" />
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse blur-sm" />
            </div>
            <span>GHT</span>
        </div>
    )
}

export function InsightBackground() {
    return (
        <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.04]">
            {/* Large rotating rings */}
            <div className="absolute w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] border-[1px] border-zinc-900 rounded-full animate-[spin_120s_linear_infinite]" />
            <div className="absolute w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] border-[1px] border-zinc-900 rounded-full animate-[spin_80s_linear_infinite_reverse] border-dashed" />
            <div className="absolute w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] border-[1px] border-zinc-900 rounded-full animate-[ping_8s_cubic-bezier(0,0,0.2,1)_infinite]" />
        </div>
    )
}
