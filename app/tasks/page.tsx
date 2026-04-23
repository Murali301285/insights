"use client"

import { useState, useEffect, useMemo } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
// No next-auth import
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Plus, FileText, CheckCircle, Clock, AlertTriangle, AlertCircle, Search } from "lucide-react"

export default function TasksPage() {
    const { setHeaderInfo } = useHeader()
    const { selectedCompanyIds } = useFilter()
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [viewMode, setViewMode] = useState<"All" | "AssignedToMe" | "AssignedByMe" | "WaitingApproval">("All")
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("All Statuses")

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false)

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
        setHeaderInfo("Tasks", "Manage assignments across all modules")
    }, [setHeaderInfo])

    const fetchTasks = async () => {
        setLoading(true)
        try {
            const companyParam = selectedCompanyIds.length > 0 ? `?companyId=${selectedCompanyIds.join(',')}` : '?companyId=all';
            const res = await fetch(`/api/tasks${companyParam}`)
            const data = await res.json()
            setTasks(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [selectedCompanyIds])

    // Derive filtered tasks
    const filteredTasks = useMemo(() => {
        // Implement filtering depending on state
        return tasks // basic placeholder
    }, [tasks, viewMode, searchQuery, statusFilter])

    // Calculate aggregated KPIs based on FILTERED tasks
    const stats = useMemo(() => {
        let total = filteredTasks.length;
        let completed = 0;
        let pending = 0;
        let overdue = 0;
        let pendingApproval = 0;
        const now = new Date();

        filteredTasks.forEach(t => {
            if (t.status === 'Completed') {
                completed++;
            } else if (t.status === 'Pending Approval') {
                pendingApproval++;
            } else {
                pending++;
                if (t.dueDate && new Date(t.dueDate) < now) {
                    overdue++;
                }
            }
        });

        return { total, completed, pending, overdue, pendingApproval };
    }, [filteredTasks]);

    const handleApply = () => {
        // trigger re-filter if needed, already happens due to useMemo dynamically usually. 
        // We'll leave this functional hook for explicit triggers if we break out state.
    }

    const handleReset = () => {
        setViewMode("All")
        setSearchQuery("")
        setStatusFilter("All Statuses")
    }

    const columns: ColumnDef<any>[] = [
        {
            id: "index",
            header: "#",
            cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => (
                <div className="space-y-0.5 max-w-sm">
                    <div className="font-bold text-zinc-800">{row.original.title || row.original.function || "Untitled Task"}</div>
                    <div className="text-xs text-zinc-500 truncate">{row.original.description}</div>
                </div>
            )
        },
        {
            accessorKey: "priority",
            header: "Priority",
            cell: ({ row }) => {
                const map: any = { low: "bg-blue-100 text-blue-700", medium: "bg-amber-100 text-amber-700", high: "bg-rose-100 text-rose-700", critical: "bg-red-200 text-red-800" }
                const val = row.original.priority || "medium"
                return <span className={`uppercase text-[10px] px-2 py-0.5 rounded-full font-bold ${map[val.toLowerCase()] || map.medium}`}>{val}</span>
            }
        },
        {
            id: "assignedTo",
            header: "Assigned To",
            cell: ({ row }) => row.original.assignedTo?.profileName || "-"
        },
        {
            id: "assignedBy",
            header: "Assigned By",
            cell: ({ row }) => row.original.assignedBy?.profileName || "-"
        },
        {
            accessorKey: "startDate",
            header: "Start",
            cell: ({ row }) => row.original.startDate ? new Date(row.original.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"
        },
        {
            accessorKey: "dueDate",
            header: "Deadline",
            cell: ({ row }) => {
                const dDate = new Date(row.original.dueDate);
                const isOverdue = dDate < new Date() && row.original.status !== 'Completed';
                return (
                    <div className="flex flex-col">
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-zinc-700'}`}>{dDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {isOverdue && <span className="text-[10px] text-rose-500">Overdue</span>}
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status || "Pending"
                let bCls = "bg-zinc-100 text-zinc-700"
                if (status === 'Completed') bCls = "bg-emerald-100 text-emerald-700"
                if (status === 'Overdue') bCls = "bg-rose-100 text-rose-700"
                
                return <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${bCls}`}>{status}</span>
            }
        },
        {
            accessorKey: "estimatedHrs",
            header: "Est. Hrs",
            cell: ({ row }) => row.original.estimatedHrs ? `${row.original.estimatedHrs}h` : "-"
        },
        {
            accessorKey: "files",
            header: "Files",
            cell: () => <span className="text-zinc-400">—</span> 
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-3 text-sm">
                    <button className="text-indigo-600 hover:underline font-medium">Edit</button>
                    <button className="text-rose-600 hover:underline font-medium">Cancel</button>
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-3 rounded-xl border border-zinc-200">
                <div className="flex bg-zinc-50 p-1 rounded-lg border border-zinc-200">
                    {["All", "AssignedToMe", "AssignedByMe", "WaitingApproval"].map(m => {
                        const filterCounts: any = { All: stats.total, AssignedToMe: 0, AssignedByMe: 0, WaitingApproval: stats.pendingApproval };
                        return (
                            <button 
                                key={m}
                                onClick={() => setViewMode(m as any)}
                                className={`px-4 py-1 flex flex-col items-center justify-center min-w-[110px] rounded-md transition-all ${viewMode === m ? "bg-white shadow-sm border border-zinc-200/50" : "hover:bg-zinc-100"}`}
                            >
                                <span className={`text-[10px] sm:text-xs font-bold leading-none mb-0.5 ${viewMode === m ? "text-indigo-600" : "text-zinc-400"}`}>{filterCounts[m] || 0}</span>
                                <span className={`text-xs sm:text-sm font-medium leading-none ${viewMode === m ? "text-indigo-700" : "text-zinc-500"}`}>{m.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </button>
                        )
                    })}
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-[250px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input 
                            placeholder="Search tasks..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Statuses">All Statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 shadow-sm">Apply</Button>
                    <Button onClick={handleReset} variant="outline" className="h-9 px-4">Reset</Button>
                </div>
            </div>

            {/* Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col relative overflow-hidden">
                    <span className="text-sm font-semibold text-blue-700">Total Tasks</span>
                    <span className="text-3xl font-bold text-blue-800 mt-2">{stats.total}</span>
                    <FileText className="absolute bottom-4 right-4 text-blue-200 w-12 h-12" strokeWidth={1} />
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col relative overflow-hidden">
                    <span className="text-sm font-semibold text-emerald-700">Completed</span>
                    <span className="text-3xl font-bold text-emerald-800 mt-2">{stats.completed}</span>
                    <CheckCircle className="absolute bottom-4 right-4 text-emerald-200 w-12 h-12" strokeWidth={1} />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col relative overflow-hidden">
                    <span className="text-sm font-semibold text-amber-700">Pending</span>
                    <span className="text-3xl font-bold text-amber-800 mt-2">{stats.pending}</span>
                    <Clock className="absolute bottom-4 right-4 text-amber-200 w-12 h-12" strokeWidth={1} />
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col relative overflow-hidden">
                    <span className="text-sm font-semibold text-rose-700">Overdue</span>
                    <span className="text-3xl font-bold text-rose-800 mt-2">{stats.overdue}</span>
                    <AlertTriangle className="absolute bottom-4 right-4 text-rose-200 w-12 h-12" strokeWidth={1} />
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col relative overflow-hidden">
                    <span className="text-sm font-semibold text-purple-700">Pending Approval</span>
                    <span className="text-3xl font-bold text-purple-800 mt-2">{stats.pendingApproval}</span>
                    <Search className="absolute bottom-4 right-4 text-purple-200 w-12 h-12" strokeWidth={1} />
                </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative">
                <div className="absolute top-4 right-4 z-10">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all h-9 rounded-full px-5">
                                <Plus className="w-4 h-4" />
                                Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Assign New Task</DialogTitle>
                            </DialogHeader>
                            <form className="space-y-6 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Assign To <span className="text-rose-500">*</span></Label>
                                        <Select><SelectTrigger><SelectValue placeholder="Select team member..." /></SelectTrigger><SelectContent><SelectItem value="u1">Goutham</SelectItem><SelectItem value="u2">Murali</SelectItem></SelectContent></Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Title <span className="text-rose-500">*</span></Label>
                                        <Input placeholder="Task title" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <textarea className="w-full min-h-[100px] p-3 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Task details..."></textarea>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select defaultValue="medium"><SelectTrigger><SelectValue placeholder="Priority..." /></SelectTrigger><SelectContent><SelectItem value="low">LOW</SelectItem><SelectItem value="medium">MEDIUM</SelectItem><SelectItem value="high">HIGH</SelectItem></SelectContent></Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Project <span className="text-rose-500">*</span></Label>
                                        <Select value={projectType} onValueChange={(val: any) => { setProjectType(val); setSelectedProject(""); }}>
                                            <SelectTrigger><SelectValue placeholder="Select project type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="na">Na</SelectItem>
                                                <SelectItem value="acquisition">Business Acquisition</SelectItem>
                                                <SelectItem value="fulfillment">Order Fulfillment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Project Reference {projectType !== "na" && <span className="text-rose-500">*</span>}</Label>
                                        <Select 
                                            value={selectedProject} 
                                            onValueChange={setSelectedProject}
                                            disabled={projectType === "na" || projectsLoading}
                                            required={projectType !== "na"}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={projectsLoading ? "Loading..." : projectType === "na" ? "Disabled" : "Select reference..."} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projectList.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {projectType === "acquisition" ? `${p.oppNumber} - ${p.opportunityName}` : `${p.orderNo} - ${p.opportunity?.opportunityName || ''}`}
                                                    </SelectItem>
                                                ))}
                                                {projectList.length === 0 && <SelectItem value="none" disabled>No items found</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>From Date <span className="text-rose-500">*</span></Label>
                                        <Input type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>From Time <span className="text-rose-500">*</span></Label>
                                        <Input type="time" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To Date <span className="text-rose-500">*</span></Label>
                                        <Input type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To Time <span className="text-rose-500">*</span></Label>
                                        <Input type="time" required />
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between text-sm">
                                   <div className="flex items-center gap-2 text-blue-700 font-medium">
                                        <Clock className="w-4 h-4" /> Estimated working time: <span className="font-bold">7h</span>
                                   </div>
                                   <span className="text-blue-500">(excl. weekends & breaks)</span>
                                </div>

                                <div className="space-y-2">
                                    <Label>Attachments <span className="text-zinc-500 font-normal">(max 5)</span></Label>
                                    <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 flex flex-col items-center justify-center text-zinc-500 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                                        <FileText className="w-8 h-8 mb-2 text-zinc-400" />
                                        <span className="font-medium text-zinc-700">Click to attach files</span>
                                        <span className="text-xs mt-1">PDF, Word, Excel, Images (max 5MB each)</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8">Assign Task</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                
                <DataTable columns={columns} data={filteredTasks} searchKey="title" />
            </div>
        </div>
    )
}
