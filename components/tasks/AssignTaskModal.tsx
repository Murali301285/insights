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
    
    const [description, setDescription] = useState("")
    const [assignedToId, setAssignedToId] = useState("")
    const [funcName, setFuncName] = useState("supply chain")
    const [projectId, setProjectId] = useState("")
    const [otherProject, setOtherProject] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [priority, setPriority] = useState("medium")
    
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
            const body = {
                companyId: resolvedCompanyId,
                description,
                assignedToId,
                function: funcName,
                projectId: projectId === 'others' ? null : projectId,
                otherProject: projectId === 'others' ? otherProject : null,
                dueDate,
                priority
            };

            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                // Reset form
                setDescription("")
                setAssignedToId("")
                setFuncName("supply chain")
                setProjectId("")
                setOtherProject("")
                setDueDate("")
                setPriority("medium")
                
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
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-zinc-700">Task Description</label>
                        <textarea 
                            required
                            rows={3}
                            placeholder="Describe what needs to be done..."
                            className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

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
                                            : "Select User..."}
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
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-zinc-700">Function</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                value={funcName}
                                onChange={(e) => setFuncName(e.target.value)}
                            >
                                <option value="supply chain">Supply Chain</option>
                                <option value="sales">Sales & Marketing</option>
                                <option value="admin">Admin</option>
                                <option value="accounting">Accounting</option>
                                <option value="management">Management</option>
                                <option value="field support">Field Support</option>
                                <option value="it">IT</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2 flex flex-col pt-1">
                            <label className="text-sm font-semibold text-zinc-700">Associated Project</label>
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
                                                : orders.find((o) => o.id === projectId)?.orderNo + ' - ' + (orders.find((o) => o.id === projectId)?.opportunity?.opportunityName || "N/A")
                                            : "Select Project / Order..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[450px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search project or order no..." />
                                        <CommandList>
                                            <CommandEmpty>No project found.</CommandEmpty>
                                            <CommandGroup>
                                                {orders.map((o) => {
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
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    projectId === o.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                            />
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
                        
                        {projectId === 'others' && (
                            <div className="space-y-1 col-span-2 animate-in slide-in-from-top-2">
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
                            <label className="text-sm font-semibold text-zinc-700">Due Date</label>
                            <input 
                                required
                                type="date"
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-zinc-700">Priority</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-xl bg-zinc-50 border-zinc-200 focus:outline-none focus:border-emerald-500 text-sm"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
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
