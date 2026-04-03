"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

// strict 5 minute timeout in milliseconds
const TIMEOUT_MS = 5 * 60 * 1000;

export function SessionManager({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Ignore public routes
    const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/api')

    const resetTimer = () => {
        if (isPublicRoute) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        // Auto-logout if this timer ever executes
        timerRef.current = setTimeout(async () => {
            try {
                // Call an API internally to delete the cookie if possible, but 
                // navigating to login with a special sign-out parameter is safer 
                // since the server handles the cookie destruction accurately.
                await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { })
                window.location.href = '/login?timeout=true'
            } catch (e) {
                window.location.href = '/login'
            }
        }, TIMEOUT_MS)
    }

    useEffect(() => {
        if (isPublicRoute) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        // Initialize the first timer
        resetTimer()

        // List of events that characterize "activity"
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']

        // Debounce the reset to not overload the event loop
        let throttleTimer: NodeJS.Timeout | null = null;

        const handleActivity = () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
                resetTimer();
                throttleTimer = null;
            }, 1000); // only reset the huge 5 min timer at most once per second
        }

        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true })
        })

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            if (throttleTimer) clearTimeout(throttleTimer)
            events.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [pathname])

    return <>{children}</>
}
