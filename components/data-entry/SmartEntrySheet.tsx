"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Plus, Save, Table as TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Schema Definitions (Reused)
const SCHEMA_DEFINITIONS: Record<string, { label: string, key: string, type: string, width?: string }[]> = {
    finance: [
        { label: "Revenue", key: "revenue", type: "number", width: "w-32" },
        { label: "Expenses", key: "expenses", type: "number", width: "w-32" },
        { label: "Net Profit", key: "profit", type: "number", width: "w-32" },
        { label: "Cash Inflow", key: "inflow", type: "number", width: "w-32" },
        { label: "Cash Outflow", key: "outflow", type: "number", width: "w-32" },
    ],
    sales: [
        { label: "Annual Target", key: "annualTarget", type: "number", width: "w-32" },
        { label: "Orders YTD", key: "ordersYtd", type: "number", width: "w-32" },
        { label: "Leads", key: "leadsCount", type: "number", width: "w-24" },
        { label: "Quotes", key: "quotesCount", type: "number", width: "w-24" },
        { label: "Won Deals", key: "orderCount", type: "number", width: "w-24" },
        { label: "Won Value", key: "winValue", type: "number", width: "w-32" },
    ],
    manufacturing: [
        { label: "Efficiency %", key: "efficiency", type: "number", width: "w-24" },
        { label: "New RFQs", key: "rfqNew", type: "number", width: "w-24" },
        { label: "Projects On Track", key: "projectOnTrack", type: "number", width: "w-32" },
        { label: "Projects Critical", key: "projectCritical", type: "number", width: "w-32" },
    ],
    supplyChain: [
        { label: "Inventory Val", key: "inventoryValue", type: "number", width: "w-32" },
        { label: "On-Time %", key: "onTimeDelivery", type: "number", width: "w-24" },
        { label: "Active Suppliers", key: "activeSuppliers", type: "number", width: "w-28" },
    ],
    support: [
        { label: "Total Tickets", key: "totalTickets", type: "number", width: "w-28" },
        { label: "Open Tickets", key: "openTickets", type: "number", width: "w-28" },
        { label: "CSAT Score", key: "csatScore", type: "number", width: "w-24" },
    ],
    hr: [
        { label: "Headcount", key: "totalEmployees", type: "number", width: "w-28" },
        { label: "Open Roles", key: "openPositions", type: "number", width: "w-28" },
        { label: "Hired", key: "recruitedHired", type: "number", width: "w-24" },
        { label: "Attrition %", key: "attritionRate", type: "number", width: "w-28" },
    ]
}

interface SmartEntrySheetProps {
    isOpen: boolean
    onClose: () => void
    category: string
}

export function SmartEntrySheet({ isOpen, onClose, category }: SmartEntrySheetProps) {
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<any[]>([])

    // New Entry State
    const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().split('T')[0])
    const [newEntryPeriod, setNewEntryPeriod] = useState("Monthly")
    const [newEntryData, setNewEntryData] = useState<Record<string, any>>({})

    const fields = SCHEMA_DEFINITIONS[category] || []

    useEffect(() => {
        if (isOpen) {
            fetchLogs()
        }
    }, [isOpen, category])

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/audit?entityType=${category}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setLogs(data)
            } else {
                setLogs([])
                console.error("Fetched logs is not an array:", data)
            }
        } catch (e) {
            console.error("Failed to fetch logs")
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Process numbers
            const processedData: any = {}
            for (const key in newEntryData) {
                processedData[key] = Number(newEntryData[key])
            }

            const res = await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    data: processedData,
                    date: newEntryDate,
                    period: newEntryPeriod
                })
            })

            if (!res.ok) throw new Error("Failed")

            toast.success("Entry Added to Smart Sheet")

            // Allow immediate next entry - clear data but keep date/period potentially or reset?
            // Usually smart sheets keep you in context. Let's clear data values.
            setNewEntryData({})
            fetchLogs()
        } catch (error) {
            toast.error("Failed to save entry")
        } finally {
            setLoading(false)
        }
    }

    // Helper to get value from log (assuming log.details.new contains the snapshot)
    const getLogValue = (log: any, key: string) => {
        const newVal = log.details?.new?.[key];
        return newVal !== undefined ? newVal : "-";
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-full h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-50">

                {/* Header Section */}
                <div className="p-6 border-b border-zinc-200 bg-white flex justify-between items-start">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <TableIcon className="w-5 h-5 text-emerald-600" />
                            {category.charAt(0).toUpperCase() + category.slice(1)} Smart Sheet
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            View historical context and add new performance records.
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-zinc-500 mr-2 bg-zinc-100 px-2 py-1 rounded">
                            Auto-save: Off
                        </div>
                    </div>
                </div>

                {/* Sheet / Table Area */}
                <div className="flex-1 overflow-auto bg-zinc-50 p-6">
                    <div className="border border-zinc-200 rounded-lg bg-white shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-zinc-100/80 text-zinc-600 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
                                <tr>
                                    <th className="p-3 font-semibold border-b border-zinc-200 min-w-[120px]">Date</th>
                                    <th className="p-3 font-semibold border-b border-zinc-200 min-w-[100px]">Period</th>
                                    {fields.map(f => (
                                        <th key={f.key} className={cn("p-3 font-semibold border-b border-zinc-200", f.width)}>
                                            {f.label}
                                        </th>
                                    ))}
                                    <th className="p-3 font-semibold border-b border-zinc-200 w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">

                                {/* New Entry Row (Always Top) */}
                                <tr className="bg-emerald-50/30">
                                    <td className="p-2">
                                        <Input
                                            type="date"
                                            value={newEntryDate}
                                            onChange={(e) => setNewEntryDate(e.target.value)}
                                            className="h-8 bg-white"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            className="h-8 w-full rounded-md border border-input bg-white px-2 py-1 text-xs"
                                            value={newEntryPeriod}
                                            onChange={(e) => setNewEntryPeriod(e.target.value)}
                                        >
                                            <option>Weekly</option>
                                            <option>Monthly</option>
                                            <option>Quarterly</option>
                                            <option>Annual</option>
                                        </select>
                                    </td>
                                    {fields.map(f => (
                                        <td key={f.key} className="p-2">
                                            <Input
                                                type="number"
                                                placeholder="-"
                                                value={newEntryData[f.key] || ''}
                                                onChange={(e) => setNewEntryData({ ...newEntryData, [f.key]: e.target.value })}
                                                className="h-8 bg-white border-emerald-200 focus-visible:ring-emerald-500"
                                            />
                                        </td>
                                    ))}
                                    <td className="p-2">
                                        <Button
                                            size="sm"
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                        >
                                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                                            Add
                                        </Button>
                                    </td>
                                </tr>

                                {/* Historical Rows */}
                                {logs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="p-3 text-zinc-600 font-medium">
                                            {new Date(log.details?.date || log.timestamp).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 text-zinc-500">
                                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-xs border border-zinc-200">
                                                {log.details?.period || "Monthly"}
                                            </span>
                                        </td>
                                        {fields.map(f => (
                                            <td key={f.key} className="p-3 text-zinc-900">
                                                {getLogValue(log, f.key)}
                                            </td>
                                        ))}
                                        <td className="p-3 text-zinc-400 text-xs">
                                            {/* Could add valid Edit/Delete later */}
                                            Locked
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={fields.length + 3} className="p-8 text-center text-zinc-400">
                                            No previous entries found. Start by adding one above.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-200 bg-white flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Close Sheet</Button>
                </div>

            </DialogContent>
        </Dialog>
    )
}
