"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { HeaderDisplay } from "@/components/layout/HeaderDisplay"
import { FilterBar } from "@/components/layout/FilterBar"
import { InsightBackground } from "@/components/design/InsightLogo"
import { SilotechFooter } from "@/components/layout/SilotechFooter"
import { UserProfile } from "@/components/layout/UserProfile"
import { FloatingChatButton } from "@/components/layout/FloatingChatButton"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { UserProvider, User } from "@/components/providers/UserProvider"

interface ShellLayoutProps {
    children: React.ReactNode
    user: User | null
}

export function ShellLayout({ children, user }: ShellLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [navContext, setNavContext] = useState<any>(null)

    // exact match for /login or starts with /login/ if you have sub-routes (unlikely for now)
    const isLoginPage = pathname === "/login"

    useEffect(() => {
        if (isLoginPage || pathname === '/change-password') {
            setIsAuthorized(true)
            return
        }

        let isMounted = true

        fetch('/api/user-nav')
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return
                if (data.error) {
                    setIsAuthorized(false)
                    router.push('/login')
                    return
                }

                setNavContext(data)

                // Skip authorization check for root /, change-password, and standard layout paths (if any)
                if (pathname === '/' || pathname === '/change-password') {
                    setIsAuthorized(true)
                    return
                }

                // Gather all permitted paths from nav and utilities
                const allowedPaths = new Set<string>()
                
                // Root is always allowed
                allowedPaths.add('/')

                if (data.nav && Array.isArray(data.nav)) {
                    const collectPaths = (items: any[]) => {
                        items.forEach(item => {
                            if (item.href) {
                                // Add base path and trailing slash variations
                                allowedPaths.add(item.href)
                            }
                            if (item.children) {
                                collectPaths(item.children)
                            }
                        })
                    }
                    collectPaths(data.nav)
                }

                // Add utilities paths based on allowed tools
                if (data.utilities && Array.isArray(data.utilities)) {
                    data.utilities.forEach((tool: string) => {
                        if (tool === 'Email') allowedPaths.add('/email')
                        if (tool === 'Weekly Review') allowedPaths.add('/weekly-review')
                        if (tool === 'Assistant') allowedPaths.add('/chat')
                        // Search, Generate Report are embedded components, they don't have separate paths yet,
                        // but if they do, we'd add them here.
                    })
                }

                // Simple check: does the requested path exist in allowed paths?
                // Allowing sub-paths implicitly if parent is allowed.
                const isPathAllowed = Array.from(allowedPaths).some(allowed => 
                    pathname === allowed || (allowed !== '/' && pathname.startsWith(allowed + '/'))
                )

                if (isPathAllowed) {
                    setIsAuthorized(true)
                } else {
                    console.warn(`Unauthorized access attempt to: ${pathname}`)
                    setIsAuthorized(false)
                    router.push('/')
                }
            })
            .catch(err => {
                console.error("Authorization fetch failed:", err)
                if (isMounted) setIsAuthorized(false)
                router.push('/login')
            })

        return () => {
            isMounted = false
        }
    }, [pathname, router, isLoginPage])

    if (isLoginPage || pathname === '/change-password') {
        return <>{children}</>
    }

    if (isAuthorized === null) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-sm font-medium text-zinc-500">Authenticating Route...</p>
                </div>
            </div>
        )
    }

    if (isAuthorized === false) {
        return null // Will be redirected
    }

    return (
        <div className="flex h-screen w-full bg-zinc-50 overflow-hidden font-sans text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900">
            <InsightBackground />
            <AppSidebar user={user} navContext={navContext} />
            <main className="flex-1 relative z-10 flex flex-col overflow-hidden">
                {/* Top Header for User Profile */}
                <header className="flex justify-between items-center px-8 py-4 shrink-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
                    <HeaderDisplay />
                    <div className="flex items-center gap-4">
                        <FilterBar navContext={navContext} />
                        <UserProfile user={user} />
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto hover-scroll">
                    <UserProvider user={user}>
                        <div className="max-w-7xl mx-auto p-8 min-h-[calc(100vh-140px)]">
                            {children}
                        </div>
                    </UserProvider>
                    <SilotechFooter />
                </div>
            </main>
            {navContext?.utilities?.includes('Chat') && <FloatingChatButton />}
        </div>
    )
}
