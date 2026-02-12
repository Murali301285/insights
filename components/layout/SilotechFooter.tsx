import { cn } from "@/lib/utils"

export function SilotechFooter({ className }: { className?: string }) {
    return (
        <footer className={cn("w-full py-6 text-center text-sm font-medium", className)}>
            <span className="text-zinc-400">© 2026 </span>
            <span className="text-emerald-600 font-bold">Silotech</span>
        </footer>
    )
}
