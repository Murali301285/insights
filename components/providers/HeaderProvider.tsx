"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface HeaderContextType {
    title: string;
    subtitle: string;
    setHeaderInfo: (title: string, subtitle: string) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState("")
    const [subtitle, setSubtitle] = useState("")

    const setHeaderInfo = (newTitle: string, newSubtitle: string) => {
        // Prevent infinite loops or unnecessary updates
        if (newTitle !== title || newSubtitle !== subtitle) {
            setTitle(newTitle)
            setSubtitle(newSubtitle)
        }
    }

    return (
        <HeaderContext.Provider value={{ title, subtitle, setHeaderInfo }}>
            {children}
        </HeaderContext.Provider>
    )
}

export function useHeader() {
    const context = useContext(HeaderContext)
    if (context === undefined) {
        throw new Error("useHeader must be used within a HeaderProvider")
    }
    return context
}
