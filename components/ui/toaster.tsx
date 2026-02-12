"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
    return (
        <Sonner
            position="top-right"
            toastOptions={{
                duration: 4000,
                classNames: {
                    toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-950 group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-lg font-sans",
                    description: "group-[.toast]:text-zinc-500",
                    actionButton: "group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-50",
                    cancelButton: "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500",
                },
            }}
            closeButton={true}
            richColors={true}
        />
    )
}
