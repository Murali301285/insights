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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Save, Table as TableIcon, Pencil, Trash, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
// @ts-ignore
import { OpportunityManager } from "@/components/data-entry/OpportunityManager"
import { OrderManager } from "@/components/data-entry/OrderManager"
import { FundValueManager } from "@/components/data-entry/FundValueManager"

// Schema Definitions
type FieldDef = { label: string, key: string, type: string, width?: string, groupTitle?: string, bgColor?: string, tab?: string };
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
        { label: "Apr", key: "apr", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "May", key: "may", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Jun", key: "jun", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Jul", key: "jul", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Aug", key: "aug", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Sep", key: "sep", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Oct", key: "oct", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Nov", key: "nov", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Dec", key: "dec", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Jan", key: "jan", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Feb", key: "feb", type: "number", width: "min-w-[80px]", tab: "Targets" },
        { label: "Mar", key: "mar", type: "number", width: "min-w-[80px]", tab: "Targets" },
    ],
    manufacturing: [
        { label: "Efficiency %", key: "efficiency", type: "number", width: "min-w-[120px]" },
        { label: "New RFQs", key: "rfqNew", type: "number", width: "min-w-[100px]" },
        { label: "Projects On Track", key: "projectOnTrack", type: "number", width: "min-w-[150px]" },
        { label: "Projects Critical", key: "projectCritical", type: "number", width: "min-w-[150px]" },
    ],
    supplyChain: [
        { label: "Inventory Val", key: "inventoryValue", type: "number", width: "min-w-[150px]" },
        { label: "On-Time %", key: "onTimeDelivery", type: "number", width: "min-w-[120px]" },
        { label: "Active Suppliers", key: "activeSuppliers", type: "number", width: "min-w-[150px]" },
    ],
    support: [
        { label: "Total Tickets", key: "totalTickets", type: "number", width: "min-w-[120px]" },
        { label: "Open Tickets", key: "openTickets", type: "number", width: "min-w-[120px]" },
        { label: "CSAT Score", key: "csatScore", type: "number", width: "min-w-[120px]" },
    ],
    hr: [
        { label: "Headcount", key: "orgStrength", type: "number", width: "min-w-[120px]" },
        { label: "Roles (On Track)", key: "openPosOnTrack", type: "number", width: "min-w-[140px]" },
        { label: "Roles (Lagging)", key: "openPosLagging", type: "number", width: "min-w-[140px]" },
        { label: "Hired", key: "recruitedHired", type: "number", width: "min-w-[100px]" },
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
    
    // Scoped Company States
    const [companies, setCompanies] = useState<any[]>([])
    const [activeCompanyId, setActiveCompanyId] = useState<string>('')

    const [companiesLoading, setCompaniesLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setCompaniesLoading(true);
            fetch('/api/companies').then(r => r.json()).then(data => {
                setCompanies(data);
                if (data.length > 0 && !activeCompanyId) setActiveCompanyId(data[0].id);
                setCompaniesLoading(false);
            });
        }
    }, [isOpen])

    // Scroll Sync Refs
    const topScrollRef = useRef<HTMLDivElement>(null)
    const tableScrollRef = useRef<HTMLDivElement>(null)

    // New Entry State
    const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().split('T')[0])
    const [newEntryPeriod, setNewEntryPeriod] = useState("Weekly")
    const [newEntryData, setNewEntryData] = useState<Record<string, any>>({})
    
    // FY state for Targets
    const [activeFy, setActiveFy] = useState("2025-26")

    const fields = SCHEMA_DEFINITIONS[category] || []
    const availableTabs = useMemo(() => {
        let tabs = Array.from(new Set(fields.map((f: any) => f.tab).filter(Boolean))) as string[];
        if (category === "sales") {
            tabs = ["Entry", "Targets"];
        } else if (category === "finance") {
            tabs = ["Cash Statement", "Fund Value"];
        }
        return tabs;
    }, [fields, category])
    const [activeTab, setActiveTab] = useState<string>('')

    useEffect(() => {
        if (availableTabs.length > 0 && !activeTab) {
            setActiveTab(availableTabs[0] as string)
        } else if (availableTabs.length === 0) {
            setActiveTab('')
        }
    }, [availableTabs, activeTab])

    const displayedFields = useMemo(() => {
        if (!activeTab || (category === "finance" && activeTab === "Cash Statement")) return fields;
        return fields.filter((f: any) => f.tab === activeTab);
    }, [fields, activeTab, category])

    useEffect(() => {
        if (isOpen && activeCompanyId) {
            fetchRecords()
        }
    }, [isOpen, category, activeCompanyId, activeTab, activeFy])

    const activeTargetLog = useMemo(() => {
        if (activeTab !== "Targets") return null;
        return logs.find(l => l.financialYear === activeFy);
    }, [logs, activeTab, activeFy]);

    const formatCurrency = (val: string | number) => {
        if (val === undefined || val === null) return "";
        let numStr = String(val).replace(/[^0-9]/g, '');
        if (!numStr) return "";
        let lastThree = numStr.substring(numStr.length - 3);
        let otherDigits = numStr.substring(0, numStr.length - 3);
        if (otherDigits !== '') lastThree = ',' + lastThree;
        return otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    };

    useEffect(() => {
        if (activeTab === "Targets") {
            if (activeTargetLog) {
                const populated: any = {};
                displayedFields.forEach((f: any) => {
                    const val = activeTargetLog[f.key];
                    if (val !== undefined && val !== null && val !== 0) {
                        populated[f.key] = formatCurrency(val);
                    } else {
                        populated[f.key] = "";
                    }
                });
                setNewEntryData(populated);
            } else {
                setNewEntryData({});
            }
        }
    }, [activeTargetLog, activeTab, activeFy, displayedFields]);

    const totalTargetSum = useMemo(() => {
        if (activeTab !== "Targets") return 0;
        return displayedFields.reduce((sum: number, f: any) => {
            const val = Number(String(newEntryData[f.key] || '0').replace(/,/g, ''));
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    }, [newEntryData, activeTab, displayedFields]);

    const handleNumberChange = (key: string, value: string) => {
        let rawValue = value.replace(/[^0-9.]/g, '');
        const parts = rawValue.split('.');
        if (parts[0]) {
            let numStr = parts[0];
            let lastThree = numStr.substring(numStr.length - 3);
            let otherDigits = numStr.substring(0, numStr.length - 3);
            if (otherDigits !== '') lastThree = ',' + lastThree;
            let formattedInt = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
            let formattedValue = parts.length > 1 ? `${formattedInt}.${parts[1].substring(0, 2)}` : formattedInt;
            setNewEntryData({ ...newEntryData, [key]: formattedValue });
        } else {
            setNewEntryData({ ...newEntryData, [key]: rawValue });
        }
    }

    const fetchRecords = async () => {
        try {
            const periodParam = activeTab === "Targets" ? "Annual" : "";
            const isTarget = activeTab === "Targets" ? "&isTarget=true" : "";
            const res = await fetch(`/api/metrics?category=${category}&companyId=${activeCompanyId}${periodParam ? '&period=' + periodParam : ''}${isTarget}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setLogs(data)
            } else {
                setLogs([])
                if (data && data.error) {
                    toast.error(`Error: ${data.error}`)
                    console.error("API returned error:", data.error)
                } else {
                    console.error("Fetched records is not an array:", JSON.stringify(data))
                }
            }
        } catch (e) {
            setLogs([])
            console.error("Failed to fetch records:", e)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Process numbers
            const processedData: any = {}
            for (const key in newEntryData) {
                const cleanVal = String(newEntryData[key]).replace(/,/g, '')
                processedData[key] = cleanVal ? Number(cleanVal) : 0
            }

            const res = await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    data: processedData,
                    date: activeTab === "Targets" ? activeFy : newEntryDate,
                    period: activeTab === "Targets" ? "Annual" : (category === 'hr' ? 'Weekly' : newEntryPeriod),
                    companyId: activeCompanyId,
                    isTarget: activeTab === "Targets"
                })
            })

            if (!res.ok) throw new Error("Failed")

            toast.success("Entry Added to Smart Sheet")

            // Allow immediate next entry - clear data but keep date/period potentially or reset?
            // Usually smart sheets keep you in context. Let's clear data values.
            setNewEntryData({})
            fetchRecords()
        } catch (error) {
            toast.error("Failed to save entry")
        } finally {
            setLoading(false)
        }
    }

    // Helper to get value from actual record
    const getLogValue = (record: any, key: string) => {
        const newVal = record[key];
        return newVal !== undefined && newVal !== null ? newVal : "-";
    }

    // Filter out completely empty/invalid logs (now records)
    const validLogs = useMemo(() => {
        return logs.filter(log => {
            const hasData = fields.some(f => getLogValue(log, f.key) !== "-")
            const d = new Date(log.date)
            const hasValidDate = !isNaN(d.getTime())

            return hasData || hasValidDate
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

    // Calculate total table width accurately
    const exactFieldsWidth = displayedFields.reduce((acc: number, f: any) => {
        const w = parseInt(f.width?.match(/\d+/)?.[0] || '120');
        return acc + w;
    }, 0);
    const isTargetTab = activeTab === "Targets";
    const totalWidthPx = 150 + (isTargetTab ? 0 : 120) + exactFieldsWidth + 96;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn("w-full h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-50 transition-all duration-300", activeTab === "Fund Value" ? "max-w-5xl" : "max-w-[95vw]")}>

                {/* Header Section */}
                <div className="p-6 border-b border-zinc-200 bg-white flex justify-between items-start">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <TableIcon className="w-5 h-5 text-emerald-600" />
                            {category === 'sales' ? 'Business Acquisition' : category === 'manufacturing' ? 'Order fulfilment' : category.charAt(0).toUpperCase() + category.slice(1) + ' Smart Sheet'}
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            View historical context and add new performance records.
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        {companies.length > 0 && (
                            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 shadow-sm">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                <Select value={activeCompanyId} onValueChange={setActiveCompanyId}>
                                    <SelectTrigger className="w-[200px] h-8 border-0 bg-transparent shadow-none focus:ring-0 text-indigo-900 font-bold tracking-wide">
                                        <SelectValue placeholder="Select Enterprise" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {isTargetTab && (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-xs font-semibold text-emerald-800">FY Targets:</span>
                                <span className="text-sm font-bold text-emerald-900">{formatCurrency(totalTargetSum)}</span>
                                <div className="h-4 w-[1px] bg-emerald-200 mx-1"></div>
                                <select
                                    className="bg-transparent text-sm font-bold text-emerald-900 border-0 focus:ring-0 cursor-pointer outline-none"
                                    value={activeFy}
                                    onChange={(e) => setActiveFy(e.target.value)}
                                >
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const startYr = 2025 + i;
                                        const endYrStr = String(startYr + 1).slice(-2);
                                        const fy = `${startYr}-${endYrStr}`;
                                        return <option key={fy} value={fy}>{fy}</option>
                                    })}
                                </select>
                            </div>
                        )}
                        <div className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full font-medium">
                            Auto-save: Off
                        </div>
                    </div>
                </div>

                {/* Sheet / Table Area */}
                <div className="flex-1 overflow-hidden bg-zinc-50 p-6 flex flex-col">

                    {availableTabs.length > 0 && (
                        <div className="mb-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="bg-zinc-100 border border-zinc-200">
                                    {availableTabs.map((tab: any) => (
                                        <TabsTrigger key={tab} value={tab} className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            {tab}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    )}

                    {companiesLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                        </div>
                    ) : activeTab === "Entry" ? (
                        <OpportunityManager onClose={onClose} activeCompanyId={activeCompanyId} />
                    ) : activeTab === "Fund Value" ? (
                        <FundValueManager activeCompanyId={activeCompanyId} />
                    ) : category === "manufacturing" ? (
                        <OrderManager onClose={onClose} activeCompanyId={activeCompanyId} />
                    ) : isTargetTab ? (
                        <div className="flex-1 overflow-auto bg-white rounded-lg border border-zinc-200 shadow-sm p-8 flex flex-col items-start">
                            <div className="w-full max-w-[350px]">
                                <h3 className="text-lg font-bold text-zinc-800 mb-6 border-b pb-4 flex items-center justify-between">
                                    Set Monthly Targets
                                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">FY {activeFy}</span>
                                </h3>
                                <div className="space-y-4">
                                    {displayedFields.map((f: any) => {
                                        const fyStart = parseInt(activeFy.substring(0, 4));
                                        const fyEnd = fyStart + 1;
                                        const monthMap = { 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12, 'jan': 1, 'feb': 2, 'mar': 3 };
                                        const monthNum = monthMap[f.key as keyof typeof monthMap] || 1;
                                        const year = monthNum >= 4 ? fyStart : fyEnd;
                                        const shortYear = String(year).slice(-2);
                                        const label = `${f.label} '${shortYear}`;
                                        
                                        return (
                                            <div key={f.key} className="flex items-center justify-between group">
                                                <label className="text-sm font-semibold flex-1 text-zinc-600 group-hover:text-emerald-700 transition-colors">
                                                    {label}
                                                </label>
                                                <div className="w-2/3">
                                                    <Input
                                                        type="text"
                                                        placeholder="0"
                                                        value={newEntryData[f.key] || ''}
                                                        onChange={(e) => handleNumberChange(f.key, e.target.value)}
                                                        className="text-right font-medium focus-visible:ring-emerald-500 h-10 bg-zinc-50 hover:bg-white"
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 h-10 w-full"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Targets
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
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
                                            {displayedFields.map((f: any) => {
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
                                                    className="h-8 bg-white w-full border-emerald-200"
                                                />
                                            </td>
                                            <td className="p-2 sticky left-[150px] z-10 bg-emerald-50 shadow-[1px_0_0_0_#e4e4e7]">
                                                <select
                                                    className="h-8 w-full rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs disabled:opacity-50"
                                                    value={category === 'hr' ? 'Weekly' : newEntryPeriod}
                                                    onChange={(e) => setNewEntryPeriod(e.target.value)}
                                                    disabled={category === 'hr'}
                                                >
                                                    <option>Weekly</option>
                                                    <option>Monthly</option>
                                                    <option>Quarterly</option>
                                                    <option>Annual</option>
                                                </select>
                                            </td>
                                            {displayedFields.map((f: any) => (
                                                <td key={f.key} className={cn("p-2 border-x border-dashed border-zinc-100", f.bgColor)}>
                                                    <Input
                                                        type="text"
                                                        placeholder="-"
                                                        value={newEntryData[f.key] || ''}
                                                        onChange={(e) => handleNumberChange(f.key, e.target.value)}
                                                        className="h-8 bg-white border-emerald-200 text-zinc-900 focus-visible:ring-emerald-500 w-full"
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

                                        {validLogs.map((log) => (
                                            <tr key={log.id} className="group hover:bg-zinc-50 transition-colors">
                                                <td className="p-3 text-zinc-600 font-medium sticky left-0 z-10 bg-white group-hover:bg-zinc-50 shadow-[1px_0_0_0_#e4e4e7]">
                                                    {(() => {
                                                        const d = new Date(log.date)
                                                        if (isNaN(d.getTime())) return '-';
                                                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
                                                    })()}
                                                </td>
                                                <td className="p-3 text-zinc-500 sticky left-[150px] z-10 bg-white group-hover:bg-zinc-50 shadow-[1px_0_0_0_#e4e4e7]">
                                                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-xs border border-zinc-200 inline-block truncate max-w-[100px]">
                                                        {log.period || "Monthly"}
                                                    </span>
                                                </td>
                                                {displayedFields.map((f: any) => {
                                                    const rawVal = getLogValue(log, f.key);
                                                    let formattedVal = rawVal;
                                                    if (typeof rawVal === 'number') {
                                                        formattedVal = rawVal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                                    } else if (typeof rawVal === 'string' && !isNaN(Number(rawVal)) && rawVal !== "-") {
                                                        formattedVal = Number(rawVal).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                                    }
                                                    return (
                                                        <td key={f.key} className={cn("p-3 border-x border-dashed border-zinc-100 font-medium", f.bgColor && f.bgColor.replace('/50', '/20'))}>
                                                            {formattedVal}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-2 sticky right-0 z-10 bg-white shadow-[-1px_0_0_0_#e4e4e7] border-l border-zinc-200 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                                                            onClick={() => {
                                                                const d = new Date(log.date);
                                                                if (!isNaN(d.getTime())) {
                                                                    setNewEntryDate(d.toISOString().split('T')[0]);
                                                                }
                                                                setNewEntryPeriod(log.period || 'Annual');

                                                                const populated: any = {};
                                                                displayedFields.forEach((f: any) => {
                                                                    if (log[f.key] !== undefined && log[f.key] !== null) {
                                                                        const rawVal = String(log[f.key]);
                                                                        const parts = rawVal.split('.');
                                                                        let numStr = parts[0];
                                                                        let lastThree = numStr.substring(numStr.length - 3);
                                                                        let otherDigits = numStr.substring(0, numStr.length - 3);
                                                                        if (otherDigits !== '') lastThree = ',' + lastThree;
                                                                        let formattedInt = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
                                                                        let formattedValue = parts.length > 1 ? `${formattedInt}.${parts[1].substring(0, 2)}` : formattedInt;
                                                                        populated[f.key] = formattedValue;
                                                                    }
                                                                });
                                                                setNewEntryData(populated);

                                                                if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
                                                            }}
                                                        >
                                                            <Pencil className="w-3 h-3 mr-1" /> Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                            title="Delete"
                                                            onClick={async () => {
                                                                if (log.id.toString().startsWith("mock-")) {
                                                                    toast.error("Cannot delete simulated mock entries");
                                                                    return;
                                                                }
                                                                if (!confirm("Are you sure you want to delete this record?")) return;
                                                                try {
                                                                    const res = await fetch(`/api/metrics?category=${category}&id=${log.id}`, { method: 'DELETE' });
                                                                    if (res.ok) {
                                                                        toast.success("Record deleted");
                                                                        fetchRecords();
                                                                    } else {
                                                                        const data = await res.json();
                                                                        toast.error(data.error || "Failed to delete");
                                                                    }
                                                                } catch (e) {
                                                                    toast.error("Failed to delete record");
                                                                }
                                                            }}
                                                        >
                                                            <Trash className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {validLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={displayedFields.length + 3} className="p-8 text-center text-zinc-400">
                                                    No previous entries found. Start by adding one above.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-200 bg-white flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Close Sheet</Button>
                </div>

            </DialogContent>
        </Dialog>
    )
}
