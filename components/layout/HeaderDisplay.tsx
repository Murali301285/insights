"use client"

import { useHeader } from "@/components/providers/HeaderProvider"

export function HeaderDisplay() {
    const { title, subtitle } = useHeader()

    if (!title) return null

    return (
        <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">
                {title}
            </h1>
            {subtitle && (
                <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>
            )}
        </div>
    )
}
