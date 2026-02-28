import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { useFilter } from "@/components/providers/FilterProvider"

interface CashInsightsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    type: "Inflow" | "Outflow" | "Balance" | null
    defaultPeriod: string
}

export function CashInsightsModal({ open, onOpenChange, type, defaultPeriod }: CashInsightsModalProps) {
    const { currency } = useFilter()
    const [localPeriod, setLocalPeriod] = useState(defaultPeriod)
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")

    // Sync local period with default period when modal opens
    useMemo(() => {
        if (open) {
            setLocalPeriod(defaultPeriod)
            setFromDate("")
            setToDate("")
        }
    }, [open, defaultPeriod])

    // Generate mock data based on period
    const mockData = useMemo(() => {
        if (!open || !type) return []

        let count = 5
        if (localPeriod === "Weekly") count = 12
        if (localPeriod === "Monthly") count = 12
        if (localPeriod === "Quarterly") count = 8
        if (localPeriod === "Annual") count = 5

        const data = []
        let baseValue = type === "Inflow" ? 60000 : type === "Outflow" ? 30000 : 30000;

        const today = new Date()

        const formatDate = (date: Date) => {
            const d = date.getDate().toString().padStart(2, '0')
            const m = (date.getMonth() + 1).toString().padStart(2, '0')
            const y = date.getFullYear()
            return `${d}/${m}/${y}`
        }

        const getWeekNumber = (date: Date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
            const dayNum = d.getUTCDay() || 7
            d.setUTCDate(d.getUTCDate() + 4 - dayNum)
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
            return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
        }

        for (let i = 0; i < count; i++) {
            let periodLabel = ""

            if (localPeriod === "Weekly") {
                const targetDate = new Date(today)
                targetDate.setDate(today.getDate() - (i * 7))

                // Adjust to start of week (Monday)
                const day = targetDate.getDay()
                const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1)
                const startOfWeek = new Date(targetDate.setDate(diff))

                const endOfWeek = new Date(startOfWeek)
                endOfWeek.setDate(startOfWeek.getDate() + 6)

                const weekNum = getWeekNumber(startOfWeek)
                periodLabel = `Week ${weekNum} (${formatDate(startOfWeek)} - ${formatDate(endOfWeek)})`
            }
            else if (localPeriod === "Monthly") {
                const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
                periodLabel = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' })
            }
            else if (localPeriod === "Quarterly") {
                // Financial Year: Apr-Jun (Q1), Jul-Sep (Q2), Oct-Dec (Q3), Jan-Mar (Q4)
                const currentDate = new Date(today)
                // Go back 'i' quarters
                currentDate.setMonth(currentDate.getMonth() - (i * 3))

                const m = currentDate.getMonth() // 0-11
                const y = currentDate.getFullYear()

                let qName = ""
                let qLabel = ""
                let fyYear = y

                if (m >= 3 && m <= 5) {
                    qName = "Q1" // Apr-Jun
                    qLabel = `(Apr${y.toString().slice(-2)} - Jun${y.toString().slice(-2)})`
                } else if (m >= 6 && m <= 8) {
                    qName = "Q2" // Jul-Sep
                    qLabel = `(Jul${y.toString().slice(-2)} - Sep${y.toString().slice(-2)})`
                } else if (m >= 9 && m <= 11) {
                    qName = "Q3" // Oct-Dec
                    qLabel = `(Oct${y.toString().slice(-2)} - Dec${y.toString().slice(-2)})`
                } else {
                    qName = "Q4" // Jan-Mar
                    // If month is Jan-Mar, it actually belongs to the PREVIOUS year's Financial Year cycle start
                    fyYear = y - 1
                    qLabel = `(Jan${y.toString().slice(-2)} - Mar${y.toString().slice(-2)})`
                }

                periodLabel = `${qName} ${fyYear}-${(fyYear + 1).toString().slice(-2)} ${qLabel}`
            }
            else if (localPeriod === "Annual") {
                periodLabel = `FY ${today.getFullYear() - i}-${(today.getFullYear() - i + 1).toString().slice(-2)}`
            }

            const val = baseValue + (Math.random() * 20000 - 10000)
            const percent = (Math.random() * 20) - 10

            data.push({
                slno: i + 1,
                period: periodLabel,
                value: val,
                percentage: percent
            })
        }
        return data
    }, [open, type, localPeriod])

    if (!type) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        Cash {type} Insights <span className="text-xs bg-zinc-100 text-zinc-800 px-2 py-1 rounded-full uppercase tracking-wider">Details</span>
                    </DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <div className="flex items-center bg-white p-1 rounded-lg border border-zinc-200">
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
                                <span className="text-[10px] text-zinc-500 font-semibold mb-0.5 ml-1">From Date</span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="text-xs px-2 py-1.5 border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-500 font-semibold mb-0.5 ml-1">To Date</span>
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
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-zinc-500 w-16">Sl No</th>
                                    <th className="px-4 py-3 font-semibold text-zinc-500">{localPeriod === "Weekly" ? "Week" : localPeriod === "Monthly" ? "Month" : localPeriod === "Quarterly" ? "Quarter" : "Year"}</th>
                                    <th className="px-4 py-3 font-semibold text-zinc-500">Value</th>
                                    <th className="px-4 py-3 font-semibold text-zinc-500">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockData.map((row) => (
                                    <tr key={row.slno} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-4 py-3 text-zinc-500">{row.slno}</td>
                                        <td className="px-4 py-3 font-medium text-zinc-900">{row.period}</td>
                                        <td className="px-4 py-3 text-zinc-900 font-medium">{formatCurrency(row.value, currency)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${row.percentage > 0 ? 'text-emerald-700 bg-emerald-50' :
                                                row.percentage < 0 ? 'text-rose-700 bg-rose-50' :
                                                    'text-amber-700 bg-amber-50'
                                                }`}>
                                                {row.percentage > 0 ? '+' : ''}{row.percentage.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {mockData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">No data found</td>
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
