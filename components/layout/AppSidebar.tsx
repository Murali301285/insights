"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { InsightLogo } from "@/components/design/InsightLogo"
import {
    LayoutDashboard,
    PieChart,
    Users,
    Package,
    Factory,
    ChevronLeft,
    ChevronRight,
    Wrench,
    Search,
    Building,
    ChevronDown,
    Network
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"

interface NavItem {
    title: string
    icon?: any
    href?: string
    role?: string
    children?: NavItem[]
}

const parseNav: NavItem[] = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/" },
    { title: "Finance", icon: PieChart, href: "/finance" },
    { title: "Business Acquisition", icon: Users, href: "/sales" },
    { title: "Order fulfilment", icon: Factory, href: "/manufacturing" },
    { title: "Supply Chain", icon: Package, href: "/supply-chain" },
    { title: "Field Support", icon: Search, href: "/support" },
    { title: "HR & Admin", icon: Users, href: "/hr" },
    { title: "Hierarchy", href: "/config/hierarchy", icon: Network },
    {
        title: "Config",
        icon: Wrench,
        role: "admin",
        children: [
            { title: "Category", href: "/config/category" },
            { title: "Payment Type", href: "/config/payment-type" },
            { title: "Customer", href: "/config/customer" },
            { title: "Supplier", href: "/config/supplier" },
            { title: "User", href: "/config/user" },
            { title: "Company", href: "/config/company" },
            { title: "Zone", href: "/config/zone" },
            { title: "Status", href: "/config/status" },
            { title: "Stage", href: "/config/stage" },
            { title: "Request Stages", href: "/config/request-stages" },
        ]
    },
]

interface AppSidebarProps {
    user?: {
        name: string;
        email: string;
        role: string;
    } | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
    const [collapsed, setCollapsed] = React.useState(false)
    const [openConfig, setOpenConfig] = React.useState(false) // Default closed as requested by user
    const pathname = usePathname()
    const router = useRouter()

    // Auto-close config menu if navigating away
    React.useEffect(() => {
        if (!pathname.startsWith('/config')) {
            setOpenConfig(false)
        }
    }, [pathname])

    // Filter Navigation based on Role
    const filteredNav = parseNav.filter(item => {
        if (!item.role) return true; // Public items
        return user?.role === item.role; // Protected items
    });

    return (
        <div
            className={cn(
                "relative flex flex-col h-screen bg-white border-r border-zinc-200 transition-all duration-300 z-20",
                collapsed ? "w-20" : "w-56"
            )}
        >
            {/* Header */}
            <div className="flex items-center h-16 px-4 border-b border-zinc-100 relative justify-end">
                <div className={cn("absolute flex flex-col items-center justify-center left-1/2 -translate-x-1/2 transition-all duration-300", collapsed ? "scale-75" : "scale-100")}>
                    <InsightLogo className={cn("text-xl transition-all duration-300", collapsed ? "!text-[0px] [&_span]:hidden" : "")} />
                    <span className={cn("text-emerald-600 font-bold tracking-[0.15em] text-[8px] -mt-0.5 uppercase transition-all duration-300", collapsed ? "opacity-0 hidden" : "opacity-100")}>Intelligence</span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 z-10"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {filteredNav.map((item) => {
                    const isParent = !!item.children;
                    const isActive = item.href
                        ? (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))
                        : item.children?.some(child => child.href === pathname);

                    if (isParent && item.children) {
                        return (
                            <div key={item.title} className="space-y-1">
                                <button
                                    className={cn(
                                        "flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group text-sm font-medium justify-between",
                                        isActive && !openConfig // Highlight parent if active but closed
                                            ? "bg-zinc-50 text-zinc-900"
                                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                                        collapsed && "justify-center"
                                    )}
                                    onClick={() => !collapsed && setOpenConfig(!openConfig)}
                                >
                                    <div className="flex items-center">
                                        <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                                        <span className={cn("ml-3 whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                                            {item.title}
                                        </span>
                                    </div>
                                    {!collapsed && (
                                        <ChevronDown className={cn("w-4 h-4 transition-transform", openConfig ? "rotate-180" : "")} />
                                    )}
                                </button>

                                {/* Sub-menu */}
                                {openConfig && !collapsed && (
                                    <div className="ml-9 space-y-1 border-l-2 border-zinc-100 pl-2 animate-in slide-in-from-top-2 duration-200">
                                        {item.children.map(child => {
                                            const isChildActive = pathname === child.href;
                                            return (
                                                <button
                                                    key={child.title}
                                                    onClick={() => router.push(child.href!)}
                                                    className={cn(
                                                        "flex items-center w-full p-2 rounded-lg text-xs font-medium transition-colors",
                                                        isChildActive
                                                            ? "text-emerald-700 bg-emerald-50/50"
                                                            : "text-zinc-500 hover:text-zinc-900"
                                                    )}
                                                >
                                                    {child.title}
                                                    {isChildActive && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_2px_rgba(16,185,129,0.3)]" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <button
                            key={item.title}
                            className={cn(
                                "flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                isActive
                                    ? "bg-emerald-50 text-emerald-900 shadow-sm"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                                collapsed && "justify-center"
                            )}
                            onClick={() => router.push(item.href!)}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                            <span className={cn("ml-3 whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                                {item.title}
                            </span>
                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_2px_rgba(16,185,129,0.3)]" /> // Blinking Green Dot with Shadow
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
