"use client"

import { MessageCircle, Search } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function FloatingChatButton() {
    const router = useRouter()
    const pathname = usePathname()

    return (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
            {/* Search System Button */}
            <button
                onClick={() => console.log("Open global search command palette")}
                className="h-12 w-12 mx-auto rounded-full bg-white outline-none text-zinc-600 shadow-[0_4px_15px_rgb(0,0,0,0.1)] hover:text-violet-600 hover:shadow-[0_8px_25px_rgb(0,0,0,0.15)] hover:bg-violet-50 hover:border-violet-200 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center border border-zinc-200"
                title="Search System"
            >
                <Search className="h-5 w-5" />
            </button>

            {/* Chat Button */}
            {pathname !== '/messages' && pathname !== '/chat' && (
                <button
                    onClick={() => router.push('/messages')}
                    className="h-14 w-14 rounded-full bg-emerald-600 outline-none text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-emerald-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center border-none"
                    title="Open Chat"
                >
                    <MessageCircle className="h-6 w-6" />
                </button>
            )}
        </div>
    )
}
