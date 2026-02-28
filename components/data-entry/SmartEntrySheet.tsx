"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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

// Schema Definitions
type FieldDef = { label: string, key: string, type: string, width?: string, groupTitle?: string, bgColor?: string };
const SCHEMA_DEFINITIONS: Record<string, FieldDef[]> = {
    finance: [
        { label: "Cash Inflow", key: "inflow", type: "number", width: "min-w-[120px]" },
        { label: "Cash Outflow", key: "outflow", type: "number", width: "min-w-[120px]" },
        { label: "Cash Balance", key: "balance", type: "number", width: "min-w-[130px]" },
        { label: "Total", key: "apTotal", type: "number", width: "min-w-[120px]", groupTitle: "Accounts Payable", bgColor: "bg-blue-50/50" },
        { label: "Current", key: "apCurrent", type: "number", width: "min-w-[120px]", groupTitle: "Accounts Payable", bgColor: "bg-blue-50/50" },
        { label: "0-30 Days", key: "ap0to30", type: "number", width: "min-w-[120px]", groupTitle: "Accounts Payable", bgColor: "bg-blue-50/50" },
        { label: "30-60 Days", key: "ap30to60", type: "number", width: "min-w-[120px]", groupTitle: "Accounts Payable", bgColor: "bg-blue-50/50" },
        { label: "61-90+ Days", key: "ap60to90plus", type: "number", width: "min-w-[130px]", groupTitle: "Accounts Payable", bgColor: "bg-blue-50/50" },
        { label: "Total", key: "arTotal", type: "number", width: "min-w-[120px]", groupTitle: "Accounts Receivable", bgColor: "bg-green-50/50" },
        { label: "Current", key: "arCurrent", type: "number", width: "min-w-[120px]", groupTitle: "Accounts Receivable", bgColor: "bg-green-50/50" },
        { label: "0-30 Days", key: "ar0to30", type: "number", width: "min-w-[120px]", groupTitle: "Accounts Receivable", bgColor: "bg-green-50/50" },
        { label: "30-60 Days", key: "ar30to60", type: "number", width: "min-w-[120px]", groupTitle: "Accounts Receivable", bgColor: "bg-green-50/50" },
        { label: "60-90+ Days", key: "ar60to90plus", type: "number", width: "min-w-[130px]", groupTitle: "Accounts Receivable", bgColor: "bg-green-50/50" },
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

    // Scroll Sync Refs
    const topScrollRef = useRef<HTMLDivElement>(null)
    const tableScrollRef = useRef<HTMLDivElement>(null)

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
        const newVal = log.details?.new?.[key] ?? log.details?.[key];
        return newVal !== undefined ? newVal : "-";
    }

    // Filter out completely empty/invalid logs
    const validLogs = useMemo(() => {
        return logs.filter(log => {
            // Check if there's any valid data in the mapped fields
            const hasData = fields.some(f => getLogValue(log, f.key) !== "-")
            const d = new Date(log.details?.date || log.timestamp)
            const hasValidDate = !isNaN(d.getTime())

            // Only keep rows that have either a valid date or actual data
            return hasData || (hasValidDate && Object.keys(log.details || {}).length > 0)
        })
    }, [logs, fields])

    const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (tableScrollRef.current) {
            tableScrollRef.current.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
        }
    }

    const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (topScrollRef.current) {
            topScrollRef.current.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
        }
    }

    // Calculate total table width roughly for the top scrollbar
    // Date (150) + Period (120) + (13 fields * 120 avg. Width) + Action (96)
    const totalWidthPx = 150 + 120 + (fields.length * 130) + 96;

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
                <div className="flex-1 overflow-hidden bg-zinc-50 p-6 flex flex-col">

                    {/* Top Scrollbar Dummy Element */}
                    <div
                        ref={topScrollRef}
                        onScroll={handleTopScroll}
                        className="w-full overflow-x-auto overflow-y-hidden mb-1 rounded-t-lg bg-zinc-100 border-x border-t border-zinc-200"
                        style={{ height: '16px' }}
                    >
                        <div style={{ width: `${totalWidthPx}px`, height: '1px' }} />
                    </div>

                    <div
                        ref={tableScrollRef}
                        onScroll={handleTableScroll}
                        className="border border-zinc-200 rounded-b-lg bg-white shadow-sm overflow-auto flex-1 h-full [&::-webkit-scrollbar]:hidden"
                    >
                        <table className="text-sm text-left border-collapse whitespace-nowrap table-fixed" style={{ width: totalWidthPx }}>
                            <thead className="bg-zinc-100/80 text-zinc-600 sticky top-0 z-30 shadow-sm backdrop-blur-sm">
                                {/* Top Header Row for Grouping */}
                                {category === 'finance' && (
                                    <tr className="bg-zinc-100">
                                        <th className="p-3 font-semibold border-b border-r border-zinc-200 sticky left-0 z-20 shadow-[1px_0_0_0_#e4e4e7]" style={{ width: 150, minWidth: 150, maxWidth: 150 }}></th>
                                        <th className="p-3 font-semibold border-b border-r border-zinc-200 sticky left-[150px] z-20 shadow-[1px_0_0_0_#e4e4e7]" style={{ width: 120, minWidth: 120, maxWidth: 120 }}></th>
                                        <th colSpan={3} className="p-3 font-semibold border-b border-r border-zinc-200 text-center"></th>
                                        <th colSpan={5} className="p-2 font-bold text-center border-b border-r border-zinc-300 bg-blue-100/90 text-blue-900 leading-tight">Accounts Payable</th>
                                        <th colSpan={5} className="p-2 font-bold text-center border-b border-r border-zinc-300 bg-green-100/90 text-green-900 leading-tight">Accounts Receivable</th>
                                        <th className="p-3 font-semibold border-b border-zinc-200 sticky right-0 z-20 shadow-[-1px_0_0_0_#e4e4e7]" style={{ width: 96, minWidth: 96, maxWidth: 96 }}></th>
                                    </tr>
                                )}

                                {/* Sub Header Row with individual columns */}
                                <tr>
                                    <th className="p-3 font-semibold border-b border-zinc-200 sticky left-0 z-20 bg-zinc-100 shadow-[1px_0_0_0_#e4e4e7]" style={{ width: 150, minWidth: 150, maxWidth: 150 }}>Date</th>
                                    <th className="p-3 font-semibold border-b border-zinc-200 sticky left-[150px] z-20 bg-zinc-100 shadow-[1px_0_0_0_#e4e4e7]" style={{ width: 120, minWidth: 120, maxWidth: 120 }}>Period</th>
                                    {fields.map((f: any) => {
                                        const w = parseInt(f.width?.match(/\d+/)?.[0] || '120');
                                        return (
                                            <th key={f.key} className={cn("p-3 font-semibold border-b border-zinc-200 border-x border-dashed border-zinc-100", f.bgColor)} style={{ width: w, minWidth: w, maxWidth: w }}>
                                                {f.label}
                                            </th>
                                        );
                                    })}
                                    <th className="p-3 font-semibold border-b border-zinc-200 sticky right-0 z-20 bg-zinc-100 shadow-[-1px_0_0_0_#e4e4e7] border-l border-zinc-200" style={{ width: 96, minWidth: 96, maxWidth: 96 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 relative z-0">

                                {/* New Entry Row (Always Top) */}
                                <tr className="bg-emerald-50/30">
                                    <td className="p-2 sticky left-0 z-10 bg-emerald-50 shadow-[1px_0_0_0_#e4e4e7]">
                                        <Input
                                            type="date"
                                            value={newEntryDate}
                                            onChange={(e) => setNewEntryDate(e.target.value)}
                                            className="h-8 bg-white w-full"
                                        />
                                    </td>
                                    <td className="p-2 sticky left-[150px] z-10 bg-emerald-50 shadow-[1px_0_0_0_#e4e4e7]">
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
                                    {fields.map((f: any) => (
                                        <td key={f.key} className={cn("p-2 border-x border-dashed border-zinc-100", f.bgColor)}>
                                            <Input
                                                type="number"
                                                placeholder="-"
                                                value={newEntryData[f.key] || ''}
                                                onChange={(e) => setNewEntryData({ ...newEntryData, [f.key]: e.target.value })}
                                                className="h-8 bg-white border-emerald-200 text-zinc-900 focus-visible:ring-emerald-500 w-full min-w-[100px]"
                                            />
                                        </td>
                                    ))}
                                    <td className="p-2 sticky right-0 z-10 bg-emerald-50 shadow-[-1px_0_0_0_#e4e4e7] border-l border-zinc-200">
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
                                {validLogs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="p-3 text-zinc-600 font-medium sticky left-0 z-10 bg-white group-hover:bg-zinc-50 shadow-[1px_0_0_0_#e4e4e7]">
                                            {(() => {
                                                const d = new Date(log.details?.date || log.timestamp)
                                                return isNaN(d.getTime()) ? '-' : d.toLocaleDateString()
                                            })()}
                                        </td>
                                        <td className="p-3 text-zinc-500 sticky left-[150px] z-10 bg-white group-hover:bg-zinc-50 shadow-[1px_0_0_0_#e4e4e7]">
                                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-xs border border-zinc-200 inline-block truncate max-w-[100px]">
                                                {log.details?.period || "Monthly"}
                                            </span>
                                        </td>
                                        {fields.map((f: any) => (
                                            <td key={f.key} className={cn("p-3 text-zinc-900 border-x border-dashed border-zinc-100", f.bgColor && f.bgColor.replace('/50', '/20'))}>
                                                {getLogValue(log, f.key)}
                                            </td>
                                        ))}
                                        <td className="p-3 text-zinc-400 text-xs sticky right-0 z-10 bg-white group-hover:bg-zinc-50 shadow-[-1px_0_0_0_#e4e4e7] border-l border-zinc-200">
                                            Locked
                                        </td>
                                    </tr>
                                ))}
                                {validLogs.length === 0 && (
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
