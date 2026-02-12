"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Save, Plus, Trash2, Calendar } from "lucide-react"
import { toast } from "sonner"

// Schema Definitions mapping the Database Models to UI Fields
const SCHEMA_DEFINITIONS: Record<string, { label: string, key: string, type: string }[]> = {
    finance: [
        { label: "Revenue", key: "revenue", type: "number" },
        { label: "Expenses", key: "expenses", type: "number" },
        { label: "Profit Info", key: "netProfit", type: "number" },
        { label: "Cash Balance", key: "cashBalance", type: "number" },
        { label: "Inflow", key: "cashInflow", type: "number" },
        { label: "Outflow", key: "cashOutflow", type: "number" },
    ],
    sales: [
        { label: "Leads", key: "leadsCount", type: "number" },
        { label: "Orders", key: "orderCount", type: "number" },
        { label: "Won Value", key: "winValue", type: "number" },
        { label: "Pipeline", key: "quotesValue", type: "number" },
        { label: "Target", key: "targetAmount", type: "number" },
    ],
    manufacturing: [
        { label: "Efficiency %", key: "efficiency", type: "number" },
        { label: "New RFQs", key: "rfqNew", type: "number" },
        { label: "Projects On Track", key: "projectOnTrack", type: "number" },
        { label: "Projects Delayed", key: "projectDelayed", type: "number" },
    ],
    supplyChain: [
        { label: "Inventory Val", key: "inventoryValue", type: "number" },
        { label: "On-Time %", key: "onTimeDelivery", type: "number" },
        { label: "Active Suppliers", key: "activeSuppliers", type: "number" },
    ],
    support: [
        { label: "Open Tickets", key: "openTickets", type: "number" },
        { label: "Resolved", key: "resolvedTickets", type: "number" },
        { label: "CSAT Score", key: "csatScore", type: "number" },
        { label: "Critical Issues", key: "criticalIssues", type: "number" },
    ],
    hr: [
        { label: "Total Staff", key: "totalEmployees", type: "number" },
        { label: "New Hires", key: "newHires", type: "number" },
        { label: "Open Roles", key: "openPositions", type: "number" },
        { label: "Attrition %", key: "attritionRate", type: "number" },
    ]
}

export function SmartSheet() {
    const [category, setCategory] = useState("finance")
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Initialize a blank row
    const addRow = () => {
        setRows([...rows, { period: "Monthly", date: new Date().toISOString().split('T')[0] }])
    }

    // Handle Input Change
    const handleChange = (index: number, key: string, value: any) => {
        const newRows = [...rows]
        newRows[index] = { ...newRows[index], [key]: value }
        setRows(newRows)
    }

    // Handle Save
    const handleSave = async () => {
        setLoading(true)
        try {
            // Here we would perform the API call
            // await fetch('/api/metrics', { method: 'POST', body: JSON.stringify({ category, data: rows }) })

            // Simulating delay
            await new Promise(r => setTimeout(r, 1000))

            toast.success(`Successfully saved ${rows.length} records to ${category.toUpperCase()}`)
            // setRows([]) // Optionally clear or keep
        } catch (error) {
            toast.error("Failed to save data")
        } finally {
            setLoading(false)
        }
    }

    const fields = SCHEMA_DEFINITIONS[category] || []

    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            {/* Toolbar */}
            <div className="p-4 border-b border-zinc-200 flex items-center gap-4 bg-zinc-50/50">
                <div className="w-64">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Module</label>
                    <Select value={category} onValueChange={(v) => { setCategory(v); setRows([]); }}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select Module" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="finance">Finance & Accounting</SelectItem>
                            <SelectItem value="sales">Sales & Marketing</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="supplyChain">Supply Chain</SelectItem>
                            <SelectItem value="support">Field Support</SelectItem>
                            <SelectItem value="hr">HR & Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1" />

                <Button variant="outline" onClick={addRow} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Row
                </Button>
                <Button onClick={handleSave} disabled={loading || rows.length === 0} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-auto">
                {rows.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-zinc-300" />
                        </div>
                        <p>No new entries. Click "Add Row" to begin inputting data.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 border-b border-r border-zinc-200 font-medium w-16 text-center">#</th>
                                <th className="px-4 py-3 border-b border-r border-zinc-200 font-medium w-32">Period</th>
                                <th className="px-4 py-3 border-b border-r border-zinc-200 font-medium w-40">Date</th>
                                {fields.map(f => (
                                    <th key={f.key} className="px-4 py-3 border-b border-r border-zinc-200 font-medium min-w-[120px]">
                                        {f.label}
                                    </th>
                                ))}
                                <th className="px-4 py-3 border-b border-zinc-200 w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx} className="group hover:bg-emerald-50/10">
                                    <td className="px-4 py-2 border-b border-r border-zinc-100 text-center text-zinc-400 font-mono text-xs">
                                        {idx + 1}
                                    </td>
                                    <td className="p-1 border-b border-r border-zinc-100">
                                        <select
                                            className="w-full bg-transparent p-2 outline-none focus:bg-white rounded"
                                            value={row.period}
                                            onChange={(e) => handleChange(idx, 'period', e.target.value)}
                                        >
                                            <option>Weekly</option>
                                            <option>Monthly</option>
                                            <option>Quarterly</option>
                                            <option>Annual</option>
                                        </select>
                                    </td>
                                    <td className="p-1 border-b border-r border-zinc-100">
                                        <input
                                            type="date"
                                            className="w-full bg-transparent p-2 outline-none focus:bg-white rounded font-mono text-xs"
                                            value={row.date}
                                            onChange={(e) => handleChange(idx, 'date', e.target.value)}
                                        />
                                    </td>
                                    {fields.map(f => (
                                        <td key={f.key} className="p-1 border-b border-r border-zinc-100">
                                            <input
                                                type={f.type}
                                                className="w-full bg-transparent p-2 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded text-right font-mono"
                                                placeholder="0"
                                                value={row[f.key] || ''}
                                                onChange={(e) => handleChange(idx, f.key, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                    <td className="px-2 py-2 border-b border-zinc-100 text-center">
                                        <button
                                            onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                                            className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
