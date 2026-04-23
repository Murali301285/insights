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
import { Plus, Clock, Calendar, CheckSquare, Activity, FileText, PieChart as PieChartIcon } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

export default function TimeTrackerPage() {
    const { setHeaderInfo } = useHeader()
    const { selectedCompanyIds } = useFilter()
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

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

    // Filters
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [employeeFilter, setEmployeeFilter] = useState("all")

    useEffect(() => {
        setHeaderInfo("Time Tracker", "Log and monitor daily activities and working hours")
    }, [setHeaderInfo])

    const fetchTimeEntries = async () => {
        setLoading(true)
        try {
            const companyParam = selectedCompanyIds.length > 0 ? `?companyId=${selectedCompanyIds.join(',')}` : '?companyId=all';
            const res = await fetch(`/api/time-tracker${companyParam}`)
            const data = await res.json()
            setEntries(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTimeEntries()
    }, [selectedCompanyIds])

    // Derived Logic Placeholders
    const stats = useMemo(() => {
        return {
            avgWorkingHrs: "0h",
            totalMonthHrs: "0h",
            avgTaskCompletionHrs: "0h",
        }
    }, [entries])

    const pieData = [
        { name: 'Documentation', value: 3, color: '#3b82f6' },
        { name: 'Meeting', value: 2, color: '#f59e0b' },
        { name: 'Support', value: 1.5, color: '#ec4899' },
        { name: 'Deployment', value: 1.5, color: '#10b981' }
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
            accessorKey: "project",
            header: "Project",
            cell: ({ row }) => row.original.project?.orderNo || "NA"
        },
        {
            accessorKey: "activity",
            header: "Activity / Title",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-zinc-800">{row.original.activity || "Task"}</span>
                    <span className="text-xs text-zinc-500 truncate max-w-[200px]">{row.original.description}</span>
                </div>
            )
        },
        {
            accessorKey: "time",
            header: "Time (Start - End)",
            cell: ({ row }) => {
                if(!row.original.startTime || !row.original.endTime) return "-"
                const s = new Date(row.original.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                const e = new Date(row.original.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                return <span className="text-sm font-medium">{s} - {e}</span>
            }
        },
        {
            accessorKey: "hoursWorked",
            header: "Duration",
            cell: ({ row }) => <span className="font-bold text-zinc-700">{row.original.hoursWorked}h</span>
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
                    <div className="text-sm font-semibold text-zinc-500 mb-1">Avg Working Hrs / Day</div>
                    <div className="text-3xl font-bold text-indigo-700">{stats.avgWorkingHrs}</div>
                </div>
                <div className="bg-white border text-center border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-500 mb-1">Total Working Hours (Month)</div>
                    <div className="text-3xl font-bold text-emerald-700">{stats.totalMonthHrs}</div>
                </div>
                <div className="bg-white border text-center border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-500 mb-1">Avg Task Completion</div>
                    <div className="text-3xl font-bold text-amber-600">{stats.avgTaskCompletionHrs}</div>
                </div>
            </div>

            {/* Dashboard Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300">
                {!isExpanded && (
                <div className="lg:col-span-1 bg-white rounded-xl border border-zinc-200 p-5 shadow-sm flex flex-col items-center justify-center transition-all duration-300">
                   <h3 className="text-lg font-bold w-full text-left mb-4 flex items-center gap-2">
                     <PieChartIcon className="w-5 h-5 text-indigo-500"/> Activity Split Up
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
                               {d.name}
                           </div>
                       ))}
                   </div>
                </div>
                )}
                <div className={`transition-all duration-300 space-y-6 ${isExpanded ? "lg:col-span-3" : "lg:col-span-2"}`}>
                    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative">
                        <div className="absolute top-4 right-4 z-10 flex gap-4">
                            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 shadow-sm">
                                {isExpanded ? "Show Chart" : "Expand Table"}
                            </Button>
                            <div className="flex items-center gap-2 hidden md:flex">
                                <span className="text-sm font-medium text-zinc-600">Log Date:</span>
                                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-8 text-sm py-0 w-[140px]" />
                            </div>
                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all h-9 rounded-full px-5">
                                        <Plus className="w-4 h-4" />
                                        Entry
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold">Log Activity</DialogTitle>
                                        <p className="text-zinc-500 text-sm">Record what you worked on today</p>
                                    </DialogHeader>
                                    <form className="space-y-5 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>Date <span className="text-rose-500">*</span></Label>
                                                <Input type="date" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Category / Activity <span className="text-rose-500">*</span></Label>
                                                <Select><SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger><SelectContent><SelectItem value="meeting">Meeting</SelectItem><SelectItem value="documentation">Documentation</SelectItem><SelectItem value="support">Support</SelectItem></SelectContent></Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>From Time <span className="text-rose-500">*</span></Label>
                                                <Input type="time" required />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>To Time <span className="text-rose-500">*</span></Label>
                                                <Input type="time" required />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Title <span className="text-rose-500">*</span></Label>
                                            <Input placeholder="What did you work on?" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Description</Label>
                                            <textarea className="w-full min-h-[80px] p-3 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Additional details..."></textarea>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>Status</Label>
                                                <Select defaultValue="completed"><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
                                            </div>
                                            <div className="space-y-1.5">
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
                                            <div className="space-y-1.5">
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
                                        <div className="space-y-1.5">
                                            <Label>Attachments <span className="text-zinc-500 text-xs">(max 5 files, 5MB each)</span></Label>
                                            <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors">
                                                <FileText className="w-6 h-6 mb-2 text-zinc-400" />
                                                <span className="text-sm font-medium">Click to attach files</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-8">Save Activity</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-800">
                            <Clock className="w-5 h-5 text-indigo-500" /> Recent Logs
                        </h3>
                        {/* A tiny snippet/datatable of recent. Wait, user said "in the tracker near recent logs add date filter, section 3 data table" We just show the main datatable below */}
                        <div className="text-sm text-zinc-500 mb-4 bg-zinc-50 p-2 rounded max-w-fit">
                            Last logged on: {new Date().toLocaleString('en-GB')}
                        </div>
                        <DataTable columns={columns} data={entries} searchKey="activity" />
                    </div>
                </div>
            </div>
        </div>
    )
}
