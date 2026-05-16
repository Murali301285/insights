"use client"

import { useState, useEffect, useMemo } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import { useUser } from "@/components/providers/UserProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Wallet, FileText, BarChart2, Download, Clock, Pencil, Trash2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ExpenseTrackerPage() {
    const { setHeaderInfo } = useHeader()
    const { selectedCompanyIds } = useFilter()
    const user = useUser()
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Filters
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const [fromDate, setFromDate] = useState(() => {
        // Adjust for timezone offset to get local YYYY-MM-DD
        const offset = startOfMonth.getTimezoneOffset()
        const d = new Date(startOfMonth.getTime() - (offset*60*1000))
        return d.toISOString().split('T')[0]
    })
    const [toDate, setToDate] = useState(() => {
        const offset = today.getTimezoneOffset()
        const d = new Date(today.getTime() - (offset*60*1000))
        return d.toISOString().split('T')[0]
    })
    const [employeeFilter, setEmployeeFilter] = useState("all")

    // Employees
    const [employees, setEmployees] = useState<any[]>([])

    // Project Dropdown State
    const [projectType, setProjectType] = useState<"na" | "acquisition" | "fulfillment">("na")
    const [projectList, setProjectList] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [projectsLoading, setProjectsLoading] = useState(false)

    useEffect(() => {
        if (projectType === "na") {
            setProjectList([])
            setSelectedProject("")
            return
        }
        
        const fetchProjects = async () => {
            setProjectsLoading(true)
            try {
                const ep = projectType === "acquisition" ? "/api/sales/opportunities" : "/api/manufacturing/orders"
                const res = await fetch(ep)
                const data = await res.json()
                setProjectList(Array.isArray(data) ? data : [])
            } catch(e) {
                console.error(e)
            } finally {
                setProjectsLoading(false)
            }
        }
        fetchProjects()
    }, [projectType])

    useEffect(() => {
        setHeaderInfo("Expense Manager", "Log exactly what you spent and track reimbursements")
    }, [setHeaderInfo])

    const fetchExpenses = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (selectedCompanyIds.length > 0) params.append('companyId', selectedCompanyIds.join(','))
            if (employeeFilter !== 'all') params.append('employeeId', employeeFilter)
            if (fromDate) params.append('fromDate', fromDate)
            if (toDate) params.append('toDate', toDate)

            const res = await fetch(`/api/expense?${params.toString()}`)
            const data = await res.json()
            setEntries(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const allUsers = await res.json()
                if (!user) return
                
                let filtered = allUsers
                if ((user as any).hasGlobalAccess || user.userType === 'Group') {
                    // Admin or System level user -> All users
                } else {
                    // Manager sees assigned users + self. Normal user sees only self.
                    filtered = allUsers.filter((u: any) => 
                        u.id === user.id || 
                        u.primaryManagerId === user.id || 
                        u.secondaryManagerId === user.id
                    )
                    
                    // If they only have themselves in the filtered array, set filter to their ID explicitly
                    if (filtered.length === 1 && filtered[0].id === user.id) {
                        setEmployeeFilter(user.id || "all")
                    }
                }
                setEmployees(filtered)
            }
        } catch (e) {
            console.error("Failed to fetch employees")
        }
    }

    useEffect(() => {
        if (user) {
            fetchEmployees()
        }
    }, [user])

    useEffect(() => {
        fetchExpenses()
    }, [selectedCompanyIds, employeeFilter, fromDate, toDate])

    // Derived Logic Placeholders
    const stats = useMemo(() => {
        if (!entries || entries.length === 0) {
            return {
                totalMonthExpense: "₹ 0.00",
                pendingReimbursement: "₹ 0.00",
                avgDailyExpense: "₹ 0.00",
            }
        }
        
        let total = 0;
        let pending = 0;
        
        entries.forEach(e => {
            const amount = parseFloat(e.amount) || 0;
            total += amount;
            if (e.status === 'Pending') pending += amount;
        });

        const avg = total / 30;

        return {
            totalMonthExpense: `₹ ${total.toFixed(2)}`,
            pendingReimbursement: `₹ ${pending.toFixed(2)}`,
            avgDailyExpense: `₹ ${avg.toFixed(2)}`,
        }
    }, [entries])

    const chartData = [
        { name: 'Travel', value: 45, fill: '#3b82f6' },
        { name: 'Meals', value: 25, fill: '#f59e0b' },
        { name: 'Supplies', value: 20, fill: '#ec4899' },
        { name: 'Other', value: 10, fill: '#10b981' }
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
            accessorFn: (row: any) => row.user?.profileName || "-",
            cell: ({ row }) => row.original.user?.profileName || "-"
        },
        {
            id: "bucket",
            header: "Project / Bucket",
            accessorFn: (row: any) => row.bucketReference || row.bucketType || "NA",
            cell: ({ row }) => row.original.bucketReference || row.original.bucketType || "NA"
        },
        {
            id: "details",
            header: "Category / Description",
            accessorFn: (row: any) => row.category?.categoryName || "Expense",
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
                const sym = row.original.currency?.symbol || "₹"
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
                <div className="flex items-center gap-1 text-sm">
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="text-indigo-500 hover:text-indigo-700 font-medium p-1.5 rounded hover:bg-indigo-50 transition-colors" onClick={() => alert('Edit not implemented yet')}>
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Entry</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="text-red-500 hover:text-red-700 font-medium p-1.5 rounded hover:bg-red-50 transition-colors" onClick={() => handleDelete(row.original.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Entry</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            ),
        },
    ]

    const handleGenerateReport = () => {
        alert("Generating report PDF...")
        // Implemented PDF generation logic here using jsPDF or similar
    }

    const selectedProjectDetails = useMemo(() => {
        if (!selectedProject || projectType === "na") return null;
        const project = projectList.find(p => p.id === selectedProject);
        if (!project) return null;

        if (projectType === "acquisition") {
            return `Opp No: ${project.oppNumber || 'N/A'} | Customer: ${project.customer?.customerName || 'N/A'} | Stage: ${project.status?.statusName || 'N/A'} | Incharge: ${project.incharge?.profileName || 'N/A'}`;
        } else {
            return `Order No: ${project.orderNo || 'N/A'} | Customer: ${project.opportunity?.customer?.customerName || 'N/A'} | Stage: ${project.currentStage?.stageName || 'N/A'} | Incharge: ${project.orderIncharge || project.opportunity?.incharge?.profileName || 'N/A'}`;
        }
    }, [selectedProject, projectList, projectType]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const payload = {
            companyId: selectedCompanyIds[0] || 'all',
            userId: user?.id,
            date: formData.get('date'),
            categoryId: formData.get('categoryId'), // Using id string
            amount: formData.get('amount'),
            currencyId: formData.get('currencyId'), // Using id string
            description: formData.get('description'),
            bucketType: projectType,
            bucketReference: projectType !== 'na' ? selectedProject : null
        }

        try {
            const res = await fetch('/api/expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setIsAddOpen(false)
                fetchExpenses()
            } else {
                alert("Failed to submit expense")
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return

        try {
            const res = await fetch('/api/expense', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })

            if (res.ok) {
                fetchExpenses()
            } else {
                alert("Failed to delete expense")
            }
        } catch (e) {
            console.error(e)
        }
    }

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
                                {((user as any)?.hasGlobalAccess || user?.userType === 'Group' || employees.length > 1) && <SelectItem value="all">All Employees</SelectItem>}
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.profileName || emp.firstName || emp.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={fetchExpenses} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 ml-auto shadow-sm">Show</Button>
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

            {/* Data Table */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative w-full">
                <div className="absolute top-4 right-4 z-10 flex gap-4">
                    <Button onClick={handleGenerateReport} variant="outline" size="sm" className="h-9 gap-2 shadow-sm font-semibold">
                        <Download className="w-4 h-4" />
                        Generate Report
                    </Button>
                    {user?.userType !== 'Group' && (
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all h-9 rounded-full px-5">
                                    <Plus className="w-4 h-4" />
                                    Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                                <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Log New Expense</DialogTitle>
                                <p className="text-zinc-500 text-sm">Upload receipts and categorize amounts appropriately</p>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Date <span className="text-rose-500">*</span></Label>
                                        <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Expense Category <span className="text-rose-500">*</span></Label>
                                        <Select name="categoryId" required defaultValue="1"><SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger><SelectContent><SelectItem value="1">Travel</SelectItem><SelectItem value="2">Meals</SelectItem><SelectItem value="3">Supplies</SelectItem></SelectContent></Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Amount <span className="text-rose-500">*</span></Label>
                                        <Input name="amount" type="number" step="0.01" placeholder="e.g. 150.00" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Currency <span className="text-rose-500">*</span></Label>
                                        <Select name="currencyId" defaultValue="1"><SelectTrigger><SelectValue placeholder="Currency..." /></SelectTrigger><SelectContent><SelectItem value="1">INR (₹)</SelectItem><SelectItem value="2">USD ($)</SelectItem><SelectItem value="3">EUR (€)</SelectItem></SelectContent></Select>
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <Label>Description</Label>
                                    <textarea name="description" className="w-full min-h-[80px] p-3 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Transportation logs, hotel name, purpose of expense..."></textarea>
                                </div>
                                
                                <div className="space-y-4 border rounded-xl p-4 bg-zinc-50/50">
                                    <div className="space-y-1.5">
                                        <Label>Bucket <span className="text-zinc-400 font-normal">(optional)</span></Label>
                                        <Select value={projectType} onValueChange={(val: any) => { setProjectType(val); setSelectedProject(""); }}>
                                            <SelectTrigger><SelectValue placeholder="Select project type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="na">Na</SelectItem>
                                                <SelectItem value="acquisition">Business Acquisition</SelectItem>
                                                <SelectItem value="fulfillment">Order Fulfillment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {projectType !== "na" && (
                                        <div className="space-y-1.5">
                                            <Label>Reference <span className="text-rose-500">*</span></Label>
                                            <Select 
                                                value={selectedProject} 
                                                onValueChange={setSelectedProject}
                                                disabled={projectsLoading}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={projectsLoading ? "Loading..." : "Select reference..."} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {projectList.map(p => {
                                                        const label = projectType === "acquisition" ? `${p.oppNumber || 'No# '} - ${p.opportunityName} - ${p.customer?.customerName || ''}` : `${p.orderNo} - ${p.opportunity?.customer?.customerName || ''}`;
                                                        return (
                                                            <SelectItem key={p.id} value={p.id} title={label}>
                                                                {label}
                                                            </SelectItem>
                                                        )
                                                    })}
                                                    {projectList.length === 0 && <SelectItem value="none" disabled>No items found</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                            {selectedProjectDetails && (
                                                <p className="text-xs text-zinc-500 italic mt-1 bg-white p-2 rounded border">{selectedProjectDetails}</p>
                                            )}
                                        </div>
                                    )}
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
                    )}
                </div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-800">
                    <Wallet className="w-5 h-5 text-indigo-500" /> Recent Expenses
                </h3>
                <div className="text-sm text-zinc-500 mb-4 bg-zinc-50 p-2 rounded max-w-fit">
                    Last synced: {new Date().toLocaleString('en-GB')}
                </div>
                <DataTable 
                    columns={columns} 
                    data={entries} 
                    searchKey="details" 
                    reportName="Finance - Expense Report"
                    fileName="insight-finance"
                />
            </div>

            {/* Dashboard Visualizer (Bar Chart) */}
            <div className="w-full bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold w-full text-left mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-500"/> Expenses by Category
                </h3>
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a'}} />
                            <RechartsTooltip cursor={{fill: '#f4f4f5'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
