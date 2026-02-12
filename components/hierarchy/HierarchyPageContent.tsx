"use client"

import { useFilter } from "@/components/providers/FilterProvider"
import HierarchyEditor from "@/components/hierarchy/HierarchyEditor"
import { AlertCircle } from "lucide-react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useEffect } from "react"

interface HierarchyPageContentProps {
    role: string;
}

export default function HierarchyPageContent({ role }: HierarchyPageContentProps) {
    const { selectedCompanyIds } = useFilter()
    const { setHeaderInfo } = useHeader()
    const companyId = selectedCompanyIds[0]

    // Admin check
    const isReadOnly = role !== 'admin';

    useEffect(() => {
        setHeaderInfo("Company Hierarchy", "Manage organizational structure and positions.")
    }, [setHeaderInfo])

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header moved to global Shell */}

            {companyId ? (
                <div className="flex-1 min-h-[600px] border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <HierarchyEditor companyId={companyId} isReadOnly={isReadOnly} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] border border-dashed border-zinc-300 rounded-xl bg-zinc-50/50">
                    <AlertCircle className="w-10 h-10 text-zinc-400 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-900">No Company Selected</h3>
                    <p className="text-sm text-zinc-500 max-w-sm text-center mt-2">
                        Please select a company from the global filter bar (top-left) to view and manage its hierarchy.
                    </p>
                </div>
            )}
        </div>
    )
}
