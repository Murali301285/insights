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
    Network,
    MessageSquareText,
    ClipboardList,
    Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"

import * as Icons from "lucide-react"

interface NavItem {
    id: string
    title: string
    iconStr?: string
    href?: string
    children?: NavItem[]
}

interface AppSidebarProps {
    user?: {
        name: string;
        email: string;
        role: string;
        userType?: string;
    } | null;
    navContext?: any;
}

export function AppSidebar({ user, navContext }: AppSidebarProps) {
    const [collapsed, setCollapsed] = React.useState(false)
    const [openMenu, setOpenMenu] = React.useState<string | null>(null)
    const [parseNav, setParseNav] = React.useState<NavItem[]>([])
    const pathname = usePathname()
    const router = useRouter()

    React.useEffect(() => {
        if (navContext && navContext.nav) {
            setParseNav(navContext.nav)
        }
    }, [navContext])

    // Auto-close menus if navigating away
    React.useEffect(() => {
        const currentActiveParent = parseNav.find(item =>
            item.children &&
            (pathname === item.href || item.children.some(child => child.href === pathname))
        )
        if (!currentActiveParent) {
            setOpenMenu(null)
        }
    }, [pathname, parseNav])

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
                    <div className="flex items-center gap-1.5">
                        {user?.userType === 'Group' ? (
                            <Icons.Users className={cn("w-6 h-6 text-purple-600 transition-all duration-300", collapsed ? "hidden" : "block")} strokeWidth={2.5} />
                        ) : (
                            <Icons.User className={cn("w-6 h-6 text-emerald-600 transition-all duration-300", collapsed ? "hidden" : "block")} strokeWidth={2.5} />
                        )}
                        <InsightLogo className={cn("text-xl transition-all duration-300", collapsed ? "!text-[0px] [&_span]:hidden" : "")} />
                    </div>
                    <span className={cn("text-emerald-600 font-bold tracking-[0.15em] text-[8px] -mt-0.5 uppercase transition-all duration-300", collapsed ? "opacity-0 hidden" : "opacity-100")}>Intelligence</span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 z-10"
                >
                    {collapsed ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.ChevronLeft className="w-4 h-4" />}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {parseNav.map((item) => {
                    const isParent = !!item.children && item.children.length > 0;
                    const isActive = item.href
                        ? (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))
                        : item.children?.some(child => child.href === pathname);

                    const IconComponent = (item.iconStr && Icons[item.iconStr as keyof typeof Icons]) || Icons.HelpCircle;

                    if (isParent && item.children) {
                        return (
                            <div key={item.id} className="space-y-1">
                                <button
                                    className={cn(
                                        "flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group text-sm font-medium justify-between",
                                        isActive && openMenu !== item.title // Highlight parent if active but closed
                                            ? "bg-zinc-50 text-zinc-900"
                                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                                        collapsed && "justify-center"
                                    )}
                                    onClick={() => !collapsed && setOpenMenu(openMenu === item.title ? null : item.title)}
                                >
                                    <div className="flex items-center">
                                        {/* @ts-ignore */}
                                        <IconComponent className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                                        <span className={cn("ml-3 whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                                            {item.title}
                                        </span>
                                    </div>
                                    {!collapsed && (
                                        <Icons.ChevronDown className={cn("w-4 h-4 transition-transform", openMenu === item.title ? "rotate-180" : "")} />
                                    )}
                                </button>

                                {/* Sub-menu */}
                                {openMenu === item.title && !collapsed && (
                                    <div className="ml-9 space-y-1 border-l-2 border-zinc-100 pl-2 animate-in slide-in-from-top-2 duration-200">
                                        {item.children.map(child => {
                                            const isChildActive = pathname === child.href;
                                            return (
                                                <button
                                                    key={child.id}
                                                    onClick={() => child.href && router.push(child.href)}
                                                    className={cn(
                                                        "flex items-center w-full p-2 rounded-lg text-xs font-medium transition-colors",
                                                        isChildActive
                                                            ? "text-emerald-700 bg-emerald-50/50"
                                                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                                                    )}
                                                >
                                                    {child.title}
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
                            key={item.id}
                            onClick={() => item.href && router.push(item.href)}
                            className={cn(
                                "flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                isActive
                                    ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm border border-emerald-100"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                                collapsed && "justify-center"
                            )}
                        >
                            {/* @ts-ignore */}
                            <IconComponent className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                            <span className={cn("ml-3 whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                                {item.title}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Fixed Action Menus at Bottom */}
            <div className="p-3 border-t border-zinc-100 bg-white space-y-2">

                {/* Email Button */}
                {navContext?.utilities?.includes('Email') && (
                    <button
                        className={cn(
                            "relative flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group text-sm font-semibold justify-center",
                            pathname === "/email"
                                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                : "bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-900 border border-violet-200"
                        )}
                        onClick={() => router.push('/email')}
                    >
                        <div className="relative flex items-center justify-center">
                            <Icons.Mail className={cn("w-5 h-5 shrink-0 transition-colors", pathname === "/email" ? "text-white" : "text-violet-600")} />
                        </div>
                        <span className={cn("ml-3 whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                            Email
                        </span>
                    </button>
                )}

                {/* Weekly Review Button */}
                {navContext?.utilities?.includes('Weekly Review') && (
                    <button
                        className={cn(
                            "relative flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group text-sm font-semibold justify-center",
                            pathname === "/weekly-review"
                                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                : "bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-900 border border-violet-200"
                        )}
                        onClick={() => router.push('/weekly-review')}
                    >
                        <div className="relative flex items-center justify-center">
                            <ClipboardList className={cn("w-5 h-5 shrink-0 transition-colors", pathname === "/weekly-review" ? "text-white" : "text-violet-600")} />
                        </div>
                        <span className={cn("ml-3 whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                            Weekly Review
                        </span>
                    </button>
                )}

                {/* Assistance Button */}
                {navContext?.utilities?.includes('Assistant') && (
                    <button
                        className={cn(
                            "relative flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group text-sm font-semibold justify-center",
                            pathname === "/chat"
                                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                : "bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-900 border border-violet-200"
                        )}
                        onClick={() => router.push('/chat')}
                    >
                        <div className="relative flex items-center justify-center">
                            <MessageSquareText className={cn("w-5 h-5 shrink-0 transition-colors", pathname === "/chat" ? "text-white" : "text-violet-600")} />
                            {pathname !== "/chat" && !collapsed && (
                                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                                </span>
                            )}
                        </div>
                        <span className={cn("ml-3 whitespace-nowrap transition-all duration-300", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                            Assistant
                        </span>
                        {pathname !== "/chat" && collapsed && (
                            <span className="absolute top-1 right-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                            </span>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
