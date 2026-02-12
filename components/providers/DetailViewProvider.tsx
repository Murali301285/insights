"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { DetailViewModal } from "@/components/modals/DetailViewModal"

interface DetailViewContextType {
    isOpen: boolean
    title: string
    category?: string
    openDetailView: (title: string, category?: string) => void
    closeDetailView: () => void
}

const DetailViewContext = createContext<DetailViewContextType | undefined>(undefined)

export function DetailViewProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState<string | undefined>(undefined)

    const openDetailView = (title: string, category?: string) => {
        setTitle(title)
        setCategory(category)
        setIsOpen(true)
    }

    const closeDetailView = () => {
        setIsOpen(false)
    }

    return (
        <DetailViewContext.Provider value={{ isOpen, title, category, openDetailView, closeDetailView }}>
            {children}
            <DetailViewModal
                isOpen={isOpen}
                onClose={closeDetailView}
                title={title}
                category={category}
            />
        </DetailViewContext.Provider>
    )
}

export function useDetailView() {
    const context = useContext(DetailViewContext)
    if (context === undefined) {
        throw new Error("useDetailView must be used within a DetailViewProvider")
    }
    return context
}
