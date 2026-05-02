"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Globe, BrainCircuit } from "lucide-react"
import { AIReportModal } from "@/components/modals/AIReportModal"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useFilter } from "@/components/providers/FilterProvider"


import { IndianRupee, DollarSign, Search as SearchIcon } from "lucide-react"

export function FilterBar({ navContext }: { navContext?: any }) {
    const { selectedCompanyIds, setSelectedCompanyIds, currency, setCurrency } = useFilter()
    const [open, setOpen] = React.useState(false)
    const [isAIReportOpen, setIsAIReportOpen] = React.useState(false)

    // Companies state
    const [companies, setCompanies] = React.useState<{ value: string, label: string }[]>([])
    const [currentTime, setCurrentTime] = React.useState<string | null>(null)

    React.useEffect(() => {
        // Hydration fix for date
        setCurrentTime(new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))

        const fetchCompanies = async () => {
            try {
                const res = await fetch('/api/companies?active=true')
                if (res.ok) {
                    const data = await res.json()
                    const mapped = data.map((c: any) => ({
                        value: c.id,
                        label: c.name
                    }))
                    setCompanies(mapped)
                }
            } catch (error) {
                console.error("Failed to fetch companies for filter", error)
            }
        }
        fetchCompanies()
    }, [])


    const toggleCompany = (value: string) => {
        if (selectedCompanyIds.includes(value)) {
            setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== value))
        } else {
            setSelectedCompanyIds([...selectedCompanyIds, value])
        }
    }

    return (
        <div className="flex items-center gap-2">
            {/* Last Updated Info */}
            <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Last Updated</span>
                <span className="text-xs font-bold text-zinc-700">
                    {currentTime ? currentTime : "..."} by <span className="text-indigo-600">Admin</span>
                </span>
            </div>

            {/* Multi-Select Company Dropdown */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between h-8 bg-emerald-50/50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    >
                        {selectedCompanyIds.length > 0 ? (
                            <span className="truncate">
                                {selectedCompanyIds.length === 1
                                    ? companies.find(c => c.value === selectedCompanyIds[0])?.label
                                    : `${selectedCompanyIds.length} selected`}
                            </span>
                        ) : (
                            <span className="text-zinc-500">All Companies</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandInput placeholder="Search company..." />
                        <CommandList>
                            <CommandEmpty>No company found.</CommandEmpty>
                            <CommandGroup>
                                {companies.map((company) => (
                                    <CommandItem
                                        key={company.value}
                                        value={company.value}
                                        onSelect={() => toggleCompany(company.value)}
                                    >
                                        <div className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            selectedCompanyIds.includes(company.value)
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                        )}>
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        {company.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {selectedCompanyIds.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => setSelectedCompanyIds([])}
                                            className="justify-center text-center"
                                        >
                                            Clear filters
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {/* Currency Toggle */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrency(currency === "INR" ? "USD" : "INR")}
                className="ml-2 gap-1.5 h-8 bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
            >
                {currency === "INR" ? <IndianRupee className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-xs font-semibold">{currency}</span>
            </Button>

            {/* Search Button */}
            {navContext?.utilities?.includes('Search') && (
                <Button
                    variant="outline"
                    size="icon"
                    className="ml-2 h-8 w-8 bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-sm"
                >
                    <SearchIcon className="w-4 h-4" />
                </Button>
            )}

            {/* AI Report Button */}
            {navContext?.utilities?.includes('Generate Report') && (
                <Button
                    onClick={() => setIsAIReportOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-8 shadow-sm hover:shadow transition-all ml-2"
                >
                    <BrainCircuit className="w-4 h-4" />
                    <span className="hidden md:inline">Generate Report</span>
                </Button>
            )}

            <AIReportModal isOpen={isAIReportOpen} onClose={() => setIsAIReportOpen(false)} />
        </div>
    )
}
