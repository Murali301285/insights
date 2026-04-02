"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, History, Save, RotateCcw } from "lucide-react"

// Schema Definitions (Shared with previous smart sheet but adapted)
const SCHEMA_DEFINITIONS: Record<string, { label: string, key: string, type: string }[]> = {
    finance: [
        { label: "Revenue", key: "revenue", type: "number" },
        { label: "Expenses", key: "expenses", type: "number" },
        { label: "Net Profit", key: "profit", type: "number" },
        { label: "Cash Inflow", key: "inflow", type: "number" },
        { label: "Cash Outflow", key: "outflow", type: "number" },
    ],
    sales: [
        { label: "Annual Target ($)", key: "annualTarget", type: "number" },
        { label: "Orders YTD ($)", key: "ordersYtd", type: "number" },
        { label: "Invoiced YTD ($)", key: "invoiceYtd", type: "number" },
        // Funnel Counts
        { label: "Leads (Qty)", key: "leadsCount", type: "number" },
        { label: "RFQs (Qty)", key: "rfqCount", type: "number" },
        { label: "Quotes (Qty)", key: "quotesCount", type: "number" },
        { label: "Negotiations (Qty)", key: "negotiationCount", type: "number" },
        { label: "Orders Won (Qty)", key: "orderCount", type: "number" },
        // Funnel Values
        { label: "Quotes Value ($)", key: "quotesValue", type: "number" },
        { label: "Negotiation Value ($)", key: "negotiationValue", type: "number" },
        { label: "Won Value ($)", key: "winValue", type: "number" },
        { label: "Lost Value ($)", key: "lossValue", type: "number" },
    ],
    manufacturing: [
        { label: "Efficiency %", key: "efficiency", type: "number" },
        { label: "New RFQs", key: "rfqNew", type: "number" },
        { label: "Standard RFQs", key: "rfqStandard", type: "number" },
        { label: "Custom RFQs", key: "rfqCustom", type: "number" },
        { label: "Projects On Track", key: "projectOnTrack", type: "number" },
        { label: "Projects Delayed", key: "projectDelayed", type: "number" },
        { label: "Projects Critical", key: "projectCritical", type: "number" },
    ],
    supplyChain: [
        { label: "Inventory Value ($)", key: "inventoryValue", type: "number" },
        { label: "On-Time Delivery %", key: "onTimeDelivery", type: "number" },
        { label: "Active Suppliers", key: "activeSuppliers", type: "number" },
        // Payment Terms (Counts)
        { label: "Pay Term: Cash", key: "cashTerms", type: "number" },
        { label: "Pay Term: Net 15", key: "net15Terms", type: "number" },
        { label: "Pay Term: Net 30", key: "net30Terms", type: "number" },
        { label: "Pay Term: Net 60", key: "net60Terms", type: "number" },
        // Sourcing
        { label: "Domestic Source %", key: "domesticSource", type: "number" },
        { label: "Intl Source %", key: "intlSource", type: "number" },
    ],
    support: [
        { label: "Total Tickets", key: "totalTickets", type: "number" },
        { label: "Open Tickets", key: "openTickets", type: "number" },
        { label: "Resolved Tickets", key: "resolvedTickets", type: "number" },
        { label: "Critical Issues", key: "criticalIssues", type: "number" },
        { label: "CSAT Score (0-5)", key: "csatScore", type: "number" },
        { label: "Avg Response (Hrs)", key: "avgResponseTime", type: "number" },
    ],
    hr: [
        { label: "Total Employees", key: "totalEmployees", type: "number" },
        { label: "Net Change", key: "netChange", type: "number" },
        { label: "Open Positions", key: "openPositions", type: "number" },
        { label: "Filled Positions", key: "filledPositions", type: "number" },
        { label: "Attrition Rate %", key: "attritionRate", type: "number" },
        // Recruiting Pipeline
        { label: "Applied", key: "recruitedApplied", type: "number" },
        { label: "Screening", key: "recruitedScreening", type: "number" },
        { label: "Interview", key: "recruitedInterview", type: "number" },
        { label: "Offer", key: "recruitedOffer", type: "number" },
        { label: "Hired", key: "recruitedHired", type: "number" },
    ]
}

interface DataEntryModalProps {
    isOpen: boolean
    onClose: () => void
    category: string // 'finance', 'sales', etc.
}

export function DataEntryModal({ isOpen, onClose, category }: DataEntryModalProps) {
    const [activeTab, setActiveTab] = useState("entry")
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [period, setPeriod] = useState("Weekly")
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [logs, setLogs] = useState<any[]>([])

    const fields = SCHEMA_DEFINITIONS[category] || []

    // Fetch Logs when tab changes
    useEffect(() => {
        if (activeTab === "history" && isOpen) {
            fetchLogs()
        }
    }, [activeTab, isOpen])

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/audit?entityType=${category}`)
            const data = await res.json()
            setLogs(data)
        } catch (e) {
            console.error("Failed to fetch logs")
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // Convert strings to numbers
            const processedData: any = {}
            for (const key in formData) {
                processedData[key] = Number(formData[key])
            }

            const res = await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    data: processedData,
                    date,
                    period
                })
            })

            if (!res.ok) throw new Error("Failed")

            toast.success("Data Saved Successfully")
            fetchLogs() // Refresh logs if needed
            // onClose() // Optional: Close or keep open for more entry
        } catch (error) {
            toast.error("Failed to save data")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="capitalize flex items-center gap-2">
                        {category} Data Entry
                    </DialogTitle>
                    <DialogDescription>
                        Update metrics for {category} module. Changes are logged for audit.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="entry">Update Data</TabsTrigger>
                        <TabsTrigger value="history">Audit Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="entry" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Period</Label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                >
                                    <option>Weekly</option>
                                    <option>Monthly</option>
                                    <option>Quarterly</option>
                                    <option>Annual</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                            {fields.map((f) => (
                                <div key={f.key} className="space-y-2">
                                    <Label>{f.label}</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData[f.key] || ''}
                                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="h-[300px] overflow-auto border rounded-md">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-50 text-zinc-500 sticky top-0">
                                    <tr>
                                        <th className="p-3 font-medium">Date</th>
                                        <th className="p-3 font-medium">User</th>
                                        <th className="p-3 font-medium">Action</th>
                                        <th className="p-3 font-medium">Summary</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan={4} className="p-4 text-center text-zinc-500">No logs found</td></tr>
                                    ) : logs.map((log: any) => (
                                        <tr key={log.id} className="border-t border-zinc-100">
                                            <td className="p-3">{new Date(log.timestamp).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <div className="font-medium">{log.user?.name || 'Unknown'}</div>
                                                <div className="text-xs text-zinc-400">{log.user?.email}</div>
                                            </td>
                                            <td className="p-3 font-mono text-xs">{log.action}</td>
                                            <td className="p-3 text-xs text-zinc-500 max-w-[200px] truncate">
                                                {/* Simple diff summary */}
                                                {Object.keys(log.details.new || {}).length} fields updated
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {activeTab === 'entry' && (
                        <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
