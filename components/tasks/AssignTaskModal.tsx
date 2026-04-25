"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssignTaskModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    companyId: string
    onTaskCreated: () => void
}

export function AssignTaskModal({ open, onOpenChange, companyId, onTaskCreated }: AssignTaskModalProps) {
    const [users, setUsers] = useState<any[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [opportunities, setOpportunities] = useState<any[]>([])
    
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [assignedToId, setAssignedToId] = useState("")
    const [bucket, setBucket] = useState("Business Acquisition")
    const [projectId, setProjectId] = useState("")
    const [otherProject, setOtherProject] = useState("")
    const [fromDate, setFromDate] = useState("")
    const [fromTime, setFromTime] = useState("")
    const [toDate, setToDate] = useState("")
    const [toTime, setToTime] = useState("")
    const [priority, setPriority] = useState("MEDIUM")
    
    const [loading, setLoading] = useState(false)
    const [resolvedCompanyId, setResolvedCompanyId] = useState(companyId)

    const [userOpen, setUserOpen] = useState(false)
    const [projectOpen, setProjectOpen] = useState(false)

    useEffect(() => {
        async function init() {
            if (open) {
                // Fetch using original broadly scoped companyId to ensure ALL items matching current view are accessible
                fetch(`/api/config/user?companyId=${companyId}`).then(res => res.json()).then(data => setUsers(Array.isArray(data) ? data : []));
                fetch(`/api/manufacturing/orders?companyId=${companyId}`).then(res => res.json()).then(data => setOrders(Array.isArray(data) ? data : []));
                fetch(`/api/sales/opportunities?companyId=${companyId}`).then(res => res.json()).then(data => setOpportunities(Array.isArray(data) ? data : []));

                let targetId = companyId;
                if (!targetId || targetId === 'all') {
                    try {
                        const cmpRes = await fetch('/api/companies').then(r => r.json());
                        if (cmpRes && cmpRes.length > 0) targetId = cmpRes[0].id;
                    } catch (e) {}
                }
                setResolvedCompanyId(targetId);
            }
        }
        init();
    }, [open, companyId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            let finalStartDate = null;
            if (fromDate && fromTime) {
                finalStartDate = new Date(`${fromDate}T${fromTime}`);
            }

            let finalDueDate = null;
            if (toDate && toTime) {
                finalDueDate = new Date(`${toDate}T${toTime}`);
            }

            const body = {
                companyId: resolvedCompanyId,
                title,
                description,
                assignedToId,
                function: "sales", // default function since it's removed from UI
                projectId: projectId === 'others' ? null : projectId,
                otherProject: projectId === 'others' ? otherProject : null,
                startDate: finalStartDate ? finalStartDate.toISOString() : null,
                dueDate: finalDueDate ? finalDueDate.toISOString() : null,
                priority,
                estimatedHrs: 7 // default as per screenshot
            };

            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                // Reset form
                setTitle("")
                setDescription("")
                setAssignedToId("")
                setBucket("Business Acquisition")
                setProjectId("")
                setOtherProject("")
                setFromDate("")
                setFromTime("")
                setToDate("")
                setToTime("")
                setPriority("MEDIUM")
                
                onTaskCreated()
                onOpenChange(false)
            } else {
                const data = await res.json()
                alert(data.error || "Failed to create task")
            }
        } catch (error) {
            console.error(error)
            alert("Network error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Assign New Task</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 flex flex-col pt-1">
                            <label className="text-sm font-semibold text-zinc-700">Assign To <span className="text-red-500">*</span></label>
                            <Popover open={userOpen} onOpenChange={setUserOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={userOpen}
                                        className="w-full justify-between border-zinc-200 bg-zinc-50 font-normal rounded-xl h-10 px-3"
                                    >
                                        {assignedToId
                                            ? users.find((u) => u.id === assignedToId)?.profileName || users.find((u) => u.id === assignedToId)?.email
                                            : "Select team member..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[240px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map((u) => (
                                                    <CommandItem
                                                        key={u.id}
                                                        value={u.profileName || u.email}
                                                        onSelect={() => {
                                                            setAssignedToId(u.id === assignedToId ? "" : u.id)
                                                            setUserOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                assignedToId === u.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {u.profileName || u.email}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1 pt-1">
                            <label className="text-sm font-semibold text-zinc-700">Title <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="text"
                                placeholder="Task title"
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm h-10"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-zinc-700">Description</label>
                        <textarea 
                            rows={3}
                            placeholder="Task details..."
                            className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1 pt-1">
                            <label className="text-sm font-semibold text-zinc-700">Priority</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm h-10"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                            </select>
                        </div>
                        <div className="space-y-1 pt-1">
                            <label className="text-sm font-semibold text-zinc-700">Project <span className="text-red-500">*</span></label>
                            <select 
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm h-10"
                                value={bucket}
                                onChange={(e) => {
                                    setBucket(e.target.value)
                                    setProjectId("")
                                }}
                            >
                                <option value="Order Fulfillment">Order Fulfillment</option>
                                <option value="Business Acquisition">Business Acquisition</option>
                            </select>
                        </div>
                        <div className="space-y-1 flex flex-col pt-1">
                            <label className="text-sm font-semibold text-zinc-700">Project Reference <span className="text-red-500">*</span></label>
                            <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={projectOpen}
                                        className="w-full justify-between border-zinc-200 bg-zinc-50 font-normal rounded-xl h-10 px-3"
                                    >
                                        {projectId
                                            ? projectId === 'others' 
                                                ? "Others (Specific Entry)" 
                                                : bucket === 'Order Fulfillment'
                                                    ? orders.find((o) => o.id === projectId)?.orderNo + ' - ' + (orders.find((o) => o.id === projectId)?.opportunity?.opportunityName || "N/A")
                                                    : opportunities.find((o) => o.id === projectId)?.oppNumber + ' - ' + (opportunities.find((o) => o.id === projectId)?.opportunityName || "N/A")
                                            : "Select Reference..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[450px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search project or order no..." />
                                        <CommandList>
                                            <CommandEmpty>No project found.</CommandEmpty>
                                            <CommandGroup>
                                                {bucket === 'Order Fulfillment' && orders.map((o) => {
                                                    const displayString = `${o.orderNo} - ${o.opportunity?.opportunityName || "N/A"}`;
                                                    return (
                                                        <CommandItem
                                                            key={o.id}
                                                            value={displayString}
                                                            onSelect={() => {
                                                                setProjectId(o.id === projectId ? "" : o.id)
                                                                setProjectOpen(false)
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", projectId === o.id ? "opacity-100" : "opacity-0")} />
                                                            {displayString}
                                                        </CommandItem>
                                                    )
                                                })}
                                                {bucket === 'Business Acquisition' && opportunities.map((o) => {
                                                    const displayString = `${o.oppNumber || o.slno} - ${o.opportunityName || "N/A"}`;
                                                    return (
                                                        <CommandItem
                                                            key={o.id}
                                                            value={displayString}
                                                            onSelect={() => {
                                                                setProjectId(o.id === projectId ? "" : o.id)
                                                                setProjectOpen(false)
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", projectId === o.id ? "opacity-100" : "opacity-0")} />
                                                            {displayString}
                                                        </CommandItem>
                                                    )
                                                })}
                                                <CommandItem value="Others (Specific Entry)" onSelect={() => { setProjectId('others'); setProjectOpen(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", projectId === 'others' ? "opacity-100" : "opacity-0")} />
                                                    <span className="font-bold text-violet-600">Others (Specific Entry)</span>
                                                </CommandItem>
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        
                        {projectId && projectId !== 'others' && (
                            <div className="col-span-3">
                                {bucket === 'Order Fulfillment' && (() => {
                                    const matchedOrder = orders.find(o => o.id === projectId);
                                    if (!matchedOrder) return null;
                                    return (
                                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-xs leading-relaxed text-indigo-900 grid grid-cols-2 gap-y-3 gap-x-4 uppercase font-semibold">
                                            <div className="col-span-2">
                                                <span className="text-indigo-950 font-bold">PROJECT BRIEF:</span> <span className="italic font-medium text-indigo-700 normal-case">{matchedOrder.opportunity?.opportunityName || 'No project metadata recorded.'}</span>
                                            </div>
                                            <div>
                                                <span className="text-indigo-950 font-bold">CUSTOMER NAME:</span> <span className="italic font-medium text-indigo-700 normal-case">{matchedOrder.opportunity?.customer?.customerName || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-indigo-950 font-bold">CURRENT STAGE:</span> <span className="italic font-medium text-indigo-700 normal-case">{matchedOrder.currentStage?.stageName || 'Unassigned'}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-indigo-950 font-bold">INCHARGE:</span> <span className="italic font-medium text-indigo-700 normal-case">{users.find(u => u.id === matchedOrder.orderIncharge)?.profileName || users.find(u => u.id === matchedOrder.orderIncharge)?.name || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    )
                                })()}
                                {bucket === 'Business Acquisition' && (() => {
                                    const matchedOpp = opportunities.find(o => o.id === projectId);
                                    if (!matchedOpp) return null;
                                    return (
                                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-xs leading-relaxed text-indigo-900 grid grid-cols-2 gap-y-3 gap-x-4 uppercase font-semibold">
                                            <div className="col-span-2">
                                                <span className="text-indigo-950 font-bold">PROJECT BRIEF:</span> <span className="italic font-medium text-indigo-700 normal-case">{matchedOpp.opportunityName || 'App'}</span>
                                            </div>
                                            <div>
                                                <span className="text-indigo-950 font-bold">CUSTOMER NAME:</span> <span className="italic font-medium text-indigo-700 normal-case">{matchedOpp.customer?.customerName || 'SiloTech'}</span>
                                            </div>
                                            <div>
                                                <span className="text-indigo-950 font-bold">CURRENT STAGE:</span> <span className="italic font-medium text-indigo-700 normal-case">{matchedOpp.status?.statusName || 'Unassigned'}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-indigo-950 font-bold">INCHARGE:</span> <span className="italic font-medium text-indigo-700 normal-case">{matchedOpp.incharge?.profileName || matchedOpp.incharge?.name || 'Murali K'}</span>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                        
                        {projectId === 'others' && (
                            <div className="space-y-1 col-span-3 animate-in slide-in-from-top-2">
                                <label className="text-sm font-semibold text-zinc-700">Specify Other Project</label>
                                <input 
                                    required
                                    type="text"
                                    placeholder="Enter Project Name..."
                                    className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                    value={otherProject}
                                    onChange={(e) => setOtherProject(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-zinc-700">From Date <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="date"
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm h-10"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-zinc-700">From Time <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="time"
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm h-10"
                                value={fromTime}
                                onChange={(e) => setFromTime(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-zinc-700">To Date <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="date"
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm h-10"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-zinc-700">To Time <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="time"
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm h-10"
                                value={toTime}
                                onChange={(e) => setToTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-[#f0f7ff] border border-blue-100 rounded-xl p-3 flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-blue-700 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Estimated working time: <span className="font-bold text-base ml-1">7h</span>
                        </div>
                        <div className="text-blue-400">
                            (excl. weekends & breaks)
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-zinc-700">Attachments <span className="font-normal text-zinc-400">(max 5)</span></label>
                        <div className="w-full h-16 border-2 border-dashed rounded-xl border-zinc-200 flex items-center justify-center text-zinc-400 bg-zinc-50/50 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
                        <Button type="submit" disabled={loading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                            {loading ? "Assigning..." : "Assign Task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
