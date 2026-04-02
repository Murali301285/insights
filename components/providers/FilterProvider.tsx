"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface FilterContextType {
    selectedCompanyIds: string[];
    setSelectedCompanyIds: (ids: string[]) => void;
    period: string; // "Weekly" | "Monthly" | "Quarterly" | "Annual"
    setPeriod: (period: string) => void;
    currency: string; // "INR" | "USD"
    setCurrency: (currency: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
    const [period, setPeriod] = useState("Weekly")
    const [currency, setCurrency] = useState("INR")

    return (
        <FilterContext.Provider value={{
            selectedCompanyIds, setSelectedCompanyIds,
            period, setPeriod,
            currency, setCurrency
        }}>
            {children}
        </FilterContext.Provider>
    )
}

export function useFilter() {
    const context = useContext(FilterContext)
    if (context === undefined) {
        throw new Error("useFilter must be used within a FilterProvider")
    }
    return context
}
