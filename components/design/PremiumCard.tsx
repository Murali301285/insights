import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Eye } from "lucide-react"

interface PremiumCardProps extends React.ComponentProps<typeof Card> {
    title?: string
    subtitle?: string
    status?: "good" | "warning" | "critical" | "neutral"
    children: React.ReactNode
    onInfoClick?: () => void
}

export function PremiumCard({ title, subtitle, status = "good", className, children, onInfoClick, ...props }: PremiumCardProps) {
    const statusColors = {
        good: "bg-emerald-500",
        warning: "bg-amber-500",
        critical: "bg-red-500",
        neutral: "bg-zinc-400"
    }

    const borderColors = {
        good: "group-hover:border-emerald-200",
        warning: "group-hover:border-amber-200",
        critical: "group-hover:border-red-200",
        neutral: "group-hover:border-zinc-300"
    }

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-zinc-200 will-change-transform",
                borderColors[status],
                className
            )}
            {...props}
        >
            <div className={cn("absolute top-0 left-0 w-full h-1 transition-colors duration-300", statusColors[status])} />

            {onInfoClick && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onInfoClick();
                    }}
                    title="View Data Details"
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all z-20 opacity-0 group-hover:opacity-100"
                >
                    <Eye className="w-4 h-4" />
                </button>
            )}

            <CardHeader className="pb-2">
                <CardTitle className="tracking-tight text-zinc-900 text-lg">{title}</CardTitle>
                {subtitle && <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{subtitle}</p>}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}
