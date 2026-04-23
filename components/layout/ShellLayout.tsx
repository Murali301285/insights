"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { HeaderDisplay } from "@/components/layout/HeaderDisplay"
import { FilterBar } from "@/components/layout/FilterBar"
import { InsightBackground } from "@/components/design/InsightLogo"
import { SilotechFooter } from "@/components/layout/SilotechFooter"
import { UserProfile } from "@/components/layout/UserProfile"
import { FloatingChatButton } from "@/components/layout/FloatingChatButton"

interface User {
    name: string
    email: string
    image?: string
    role: string
}

interface ShellLayoutProps {
    children: React.ReactNode
    user: User | null
}

export function ShellLayout({ children, user }: ShellLayoutProps) {
    const pathname = usePathname()
    // exact match for /login or starts with /login/ if you have sub-routes (unlikely for now)
    const isLoginPage = pathname === "/login"

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen w-full bg-zinc-50 overflow-hidden font-sans text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900">
            <InsightBackground />
            <AppSidebar user={user} />
            <main className="flex-1 relative z-10 flex flex-col overflow-hidden">
                {/* Top Header for User Profile */}
                <header className="flex justify-between items-center px-8 py-4 shrink-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
                    <HeaderDisplay />
                    <div className="flex items-center gap-4">
                        <FilterBar />
                        <UserProfile user={user} />
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto hover-scroll">
                    <div className="max-w-7xl mx-auto p-8 min-h-[calc(100vh-140px)]">
                        {children}
                    </div>
                    <SilotechFooter />
                </div>
            </main>
            <FloatingChatButton />
        </div>
    )
}
