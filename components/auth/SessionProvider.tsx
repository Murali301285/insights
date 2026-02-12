"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface SessionUser {
    id: string
    email: string
    name: string
    image?: string
    role: string
}

const SessionContext = createContext<{ user: SessionUser | null }>({ user: null })

export function SessionProvider({ children, initialUser }: { children: React.ReactNode, initialUser: SessionUser | null }) {
    return (
        <SessionContext.Provider value={{ user: initialUser }}>
            {children}
        </SessionContext.Provider>
    )
}

export function useSession() {
    return useContext(SessionContext)
}
