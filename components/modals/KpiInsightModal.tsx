import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { useFilter } from "@/components/providers/FilterProvider"
import { Info, Loader2 } from "lucide-react"

export interface KpiInsightModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string | null
    metricKey: string | null
    category: string | null
    formulaDesc: string | null
    formatType?: "currency" | "number" | "percent"
}

export function KpiInsightModal({ open, onOpenChange, title, metricKey, category, formulaDesc, formatType = "number" }: KpiInsightModalProps) {
    const { period: globalPeriod, currency, selectedCompanyIds } = useFilter()
    const [localPeriod, setLocalPeriod] = useState(globalPeriod)
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    
    // Data State
    const [historyData, setHistoryData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setLocalPeriod(globalPeriod)
            setFromDate("")
            setToDate("")
        }
    }, [open, globalPeriod])

    useEffect(() => {
        if (!open || !category || !metricKey) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                let url = `/api/metrics?category=${category}&period=${localPeriod}`
                if (selectedCompanyIds && selectedCompanyIds.length > 0) {
                    if (selectedCompanyIds.length === 1) {
                        url += `&companyId=${selectedCompanyIds[0]}`
                    } else {
                        url += `&companies=${selectedCompanyIds.join(',')}`
                    }
                }
                const res = await fetch(url)
                const data = await res.json()
                if (Array.isArray(data)) {
                    // Reverse the array so most recent (usually first) is first, OR maintain DB order
                    // Typically /api/metrics returns latest first. Let's process it safely.
                    
                    const processed = data.map((item: any, index: number) => {
                        const d = new Date(item.date);
                        const formattedDate = !isNaN(d.getTime()) 
                            ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
                            : "";
                            
                        return {
                            id: item.id,
                            slno: index + 1,
                            periodLabel: formattedDate,
                            value: item[metricKey] || 0,
                            // Previous value requires accessing the previous logical element or utilizing native prev fields if they exist.
                            // We will simply display the straight value for transparency.
                        }
                    })
                    setHistoryData(processed);
                } else {
                    setHistoryData([]);
                }
            } catch (err) {
                console.error("Error fetching detail metrics", err)
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [open, category, metricKey, localPeriod, selectedCompanyIds])

    if (!title || !metricKey) return null

    const formatValue = (val: number) => {
        if (formatType === 'currency') return formatCurrency(val, currency);
        if (formatType === 'percent') return `${val}%`;
        return val.toLocaleString();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        {title} <span className="text-xs bg-zinc-100 text-zinc-800 px-2 py-1 rounded-full uppercase tracking-wider">Source Analysis</span>
                    </DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                    
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <div className="flex items-center bg-white p-1 rounded-lg border border-zinc-200 shadow-sm">
                            {["Weekly", "Monthly", "Quarterly", "Annual"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setLocalPeriod(p)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${localPeriod === p
                                        ? "bg-zinc-900 text-white"
                                        : "text-zinc-500 hover:text-zinc-900"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-500 font-semibold mb-0.5 ml-1">From</span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="text-xs px-2 py-1.5 border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-500 font-semibold mb-0.5 ml-1">To</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="text-xs px-2 py-1.5 border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border border-zinc-200 rounded-xl overflow-hidden relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                            </div>
                        )}
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-zinc-500 w-16">Sl No</th>
                                    <th className="px-4 py-3 font-semibold text-zinc-500">Recorded Date</th>
                                    <th className="px-4 py-3 font-semibold text-zinc-500 text-right">Aggregated Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyData.filter(r => {
                                    if (fromDate && new Date(r.periodLabel) < new Date(fromDate)) return false;
                                    if (toDate && new Date(r.periodLabel) > new Date(toDate)) return false;
                                    return true;
                                }).map((row, i) => (
                                    <tr key={row.id || i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                                        <td className="px-4 py-3 font-medium text-zinc-700">{row.periodLabel}</td>
                                        <td className="px-4 py-3 text-zinc-900 font-bold text-right">{formatValue(row.value)}</td>
                                    </tr>
                                ))}
                                {!loading && historyData.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center text-zinc-500 font-medium bg-zinc-50/30">
                                            No recorded entries found for {localPeriod} period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
