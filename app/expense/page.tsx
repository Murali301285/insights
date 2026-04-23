"use client"

import { useState, useEffect, useMemo } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Wallet, FileText, PieChart as PieChartIcon, CheckSquare, Clock } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

export default function ExpenseTrackerPage() {
    const { setHeaderInfo } = useHeader()
    const { selectedCompanyIds } = useFilter()
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Filters
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [employeeFilter, setEmployeeFilter] = useState("all")

    useEffect(() => {
        setHeaderInfo("Expense Manager", "Log exactly what you spent and track reimbursements")
    }, [setHeaderInfo])

    const fetchExpenses = async () => {
        setLoading(true)
        try {
            const companyParam = selectedCompanyIds.length > 0 ? `?companyId=${selectedCompanyIds.join(',')}` : '?companyId=all';
            const res = await fetch(`/api/expense${companyParam}`)
            const data = await res.json()
            setEntries(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // fetchExpenses()
        // Mocking for now structurally
        setLoading(false)
        setEntries([
            { id: 1, date: new Date().toISOString(), user: { profileName: "Murali" }, category: { categoryName: "Travel" }, description: "Flight to NY", amount: 450.00, currency: { symbol: "$" }, bucketType: "Order", bucketReference: "ORD-1200", status: "Pending" }
        ])
    }, [selectedCompanyIds])

    // Derived Logic Placeholders
    const stats = useMemo(() => {
        return {
            totalMonthExpense: "$ 1,240.00",
            pendingReimbursement: "$ 450.00",
            avgDailyExpense: "$ 41.33",
        }
    }, [entries])

    const pieData = [
        { name: 'Travel', value: 45, color: '#3b82f6' },
        { name: 'Meals', value: 25, color: '#f59e0b' },
        { name: 'Supplies', value: 20, color: '#ec4899' },
        { name: 'Other', value: 10, color: '#10b981' }
    ]

    const columns: ColumnDef<any>[] = [
        {
            id: "index",
            header: "#",
            cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                if(!row.original.date) return "-"
                return new Date(row.original.date).toLocaleDateString('en-GB')
            }
        },
        {
            accessorKey: "user.profileName",
            header: "Employee",
            cell: ({ row }) => row.original.user?.profileName || "-"
        },
        {
            id: "bucket",
            header: "Project / Bucket",
            cell: ({ row }) => row.original.bucketReference || row.original.bucketType || "NA"
        },
        {
            id: "details",
            header: "Category / Description",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-zinc-800">{row.original.category?.categoryName || "Expense"}</span>
                    <span className="text-xs text-zinc-500 truncate max-w-[200px]">{row.original.description}</span>
                </div>
            )
        },
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => {
                const sym = row.original.currency?.symbol || "$"
                return <span className="font-bold text-zinc-800">{sym}{(row.original.amount || 0).toFixed(2)}</span>
            }
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status || "Pending"
                let bCls = "bg-zinc-100 text-zinc-700"
                if (status === 'Approved') bCls = "bg-emerald-100 text-emerald-700"
                if (status === 'Pending') bCls = "bg-amber-100 text-amber-700"
                
                return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${bCls}`}>{status}</span>
            }
        },
        {
            accessorKey: "documentPath",
            header: "Receipt",
            cell: ({ row }) => {
                 return row.original.documentPath ? (
                     <a href={row.original.documentPath} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-xs">
                         <FileText className="w-3 h-3"/> View
                     </a>
                 ) : <span className="text-zinc-400">—</span>
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-3 text-sm">
                    <button className="text-indigo-600 hover:underline font-medium">Edit</button>
                    <button className="text-rose-600 hover:underline font-medium">Delete</button>
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-4 w-full">
                    <div className="relative flex items-center gap-2">
                        <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-[150px] h-9" />
                        <span className="text-zinc-500 text-sm">to</span>
                        <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-[150px] h-9" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                            <SelectTrigger className="w-[200px] h-9">
                                <SelectValue placeholder="All Employees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {/* Populate mapped employees here */}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 ml-auto shadow-sm">Show</Button>
                </div>
            </div>

            {/* Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border text-center border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-500 mb-1">Total Expenses (Month)</div>
                    <div className="text-3xl font-bold text-indigo-700">{stats.totalMonthExpense}</div>
                </div>
                <div className="bg-white border text-center border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-500 mb-1">Pending Reimbursement</div>
                    <div className="text-3xl font-bold text-amber-600">{stats.pendingReimbursement}</div>
                </div>
                <div className="bg-white border text-center border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-500 mb-1">Avg Daily Expense</div>
                    <div className="text-3xl font-bold text-emerald-700">{stats.avgDailyExpense}</div>
                </div>
            </div>

            {/* Dashboard Visualizer & Data */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visualizer */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex flex-col items-center justify-center">
                   <h3 className="text-lg font-bold w-full text-left mb-4 flex items-center gap-2">
                     <PieChartIcon className="w-5 h-5 text-indigo-500"/> Expenses by Category
                   </h3>
                   <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                   </div>
                   <div className="grid grid-cols-2 gap-4 w-full mt-2">
                       {pieData.map(d => (
                           <div key={d.name} className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                               {d.name} ({d.value}%)
                           </div>
                       ))}
                   </div>
                </div>

                {/* Table & Logs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative">
                        <div className="absolute top-4 right-4 z-10 flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-600">Record Date:</span>
                                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-8 text-sm py-0 w-[140px]" />
                            </div>
                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-sm h-8"><Plus className="w-4 h-4 mr-2" /> Log Expense</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold">Log New Expense</DialogTitle>
                                        <p className="text-zinc-500 text-sm">Upload receipts and categorize amounts appropriately</p>
                                    </DialogHeader>
                                    <form className="space-y-5 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>Date <span className="text-rose-500">*</span></Label>
                                                <Input type="date" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Expense Category <span className="text-rose-500">*</span></Label>
                                                <Select><SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger><SelectContent><SelectItem value="travel">Travel</SelectItem><SelectItem value="meals">Meals</SelectItem><SelectItem value="supplies">Supplies</SelectItem></SelectContent></Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>Amount <span className="text-rose-500">*</span></Label>
                                                <Input type="number" step="0.01" placeholder="e.g. 150.00" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Currency <span className="text-rose-500">*</span></Label>
                                                <Select defaultValue="usd"><SelectTrigger><SelectValue placeholder="Currency..." /></SelectTrigger><SelectContent><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="eur">EUR (€)</SelectItem><SelectItem value="inr">INR (₹)</SelectItem></SelectContent></Select>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <Label>Description</Label>
                                            <textarea className="w-full min-h-[80px] p-3 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Transportation logs, hotel name, purpose of expense..."></textarea>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <Label>Bucket (Project) <span className="text-zinc-400 font-normal">(optional)</span></Label>
                                            <Select defaultValue="na"><SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger><SelectContent><SelectItem value="na">NA</SelectItem></SelectContent></Select>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <Label>Receipt Attachment <span className="text-zinc-500 text-xs">(max 5MB)</span></Label>
                                            <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                                                <FileText className="w-6 h-6 mb-2 text-zinc-400" />
                                                <span className="text-sm font-medium">Click to attach receipt</span>
                                                <span className="text-xs text-zinc-400 mt-1">Image or PDF format</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8">Submit Expense</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-800">
                            <Wallet className="w-5 h-5 text-indigo-500" /> Recent Expenses
                        </h3>
                        <div className="text-sm text-zinc-500 mb-4 bg-zinc-50 p-2 rounded max-w-fit">
                            Last synced: {new Date().toLocaleString('en-GB')}
                        </div>
                        <DataTable columns={columns} data={entries} searchKey="details" />
                    </div>
                </div>
            </div>
        </div>
    )
}
