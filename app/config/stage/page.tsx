"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash, ArrowUpDown } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type StageEntry = {
    slno: number
    companyId: string | null
    stageName: string
    order: number
    percentage: number
    remarks: string | null
    isActive: boolean
    createdAt: string
    company?: {
        id: string
        name: string
    }
}

export default function StageMasterPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<StageEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [companies, setCompanies] = useState<any[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editItem, setEditItem] = useState<StageEntry | null>(null)

    useEffect(() => {
        setHeaderInfo("Stage Master", "Configure sequential stage flows for CRM pipelines.")

    }, [setHeaderInfo])

    useEffect(() => {
        async function loadCompanies() {
            try {
                const res = await fetch("/api/companies")
                if (res.ok) { const data = await res.json(); setCompanies(data); }
            } catch (e) { }
        }
        loadCompanies()
    }, [])

    useEffect(() => {
        fetchData()
    }, [selectedCompanyId])

    async function fetchData() {
        setLoading(true)
        try {
            const qs = selectedCompanyId !== 'all' ? '?companyId=' + selectedCompanyId : '';
            const res = await fetch(`/api/config/stage${qs}`)
            if (res.ok) {
                const items = await res.json()
                setData(items)
            }
        } catch (error) {
            toast.error("Failed to fetch data")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const percentageInt = parseInt(formData.get("percentage") as string) || 0;
        const formCompanyId = formData.get("companyId") === "global" ? null : (formData.get("companyId") || null);

        if (formData.get("isActive") === "on") {
            const currentTotal = data.filter(d => d.isActive && d.companyId === formCompanyId && d.slno !== (editItem?.slno || -1)).reduce((sum, d) => sum + (d.percentage || 0), 0);
            if (currentTotal + percentageInt > 100) {
                toast.error(`Cumulative percentage cannot exceed 100%. Current active total for this company context is ${currentTotal}%. You can add at most ${100 - currentTotal}%.`);
                return;
            }
        }

        const payload = {
            slno: editItem ? editItem.slno : undefined,
            stageName: formData.get("stageName"),
            order: formData.get("order"),
            percentage: percentageInt,
            remarks: formData.get("remarks"),
            isActive: formData.get("isActive") === "on",
            companyId: formData.get("companyId") === "global" ? null : (formData.get("companyId") || null),
        }

        try {
            const res = await fetch("/api/config/stage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success(editItem ? "Stage updated" : "Stage created")
                setIsAddOpen(false)
                setEditItem(null)
                fetchData()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to save stage")
            }
        } catch (error) {
            toast.error("Error saving stage")
        }
    }

    async function handleDelete(slno: number) {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            const res = await fetch(`/api/config/stage?slno=${slno}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Stage deleted")
                fetchData()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const columns: ColumnDef<StageEntry>[] = [
        {
            id: "index",
            header: "Sl No.",
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "order",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Order
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="flex w-8 h-8 rounded-full bg-indigo-50 items-center justify-center font-bold text-indigo-700">
                    {row.original.order}
                </div>
            )
        },
        {
            id: "company",
            accessorFn: (row) => row.company?.name || "Global",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Company Context
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const company = row.original.company;
                if (!company) {
                    return <span className="px-2.5 py-1 rounded bg-zinc-100/80 text-zinc-500 font-semibold border border-zinc-200/50 text-xs shadow-sm uppercase tracking-wider">Global (All)</span>;
                }

                // Deterministic color assignment based on company name
                const colors = [
                    "bg-blue-100/80 text-blue-800 border-blue-200",
                    "bg-purple-100/80 text-purple-800 border-purple-200",
                    "bg-orange-100/80 text-orange-800 border-orange-200",
                    "bg-pink-100/80 text-pink-800 border-pink-200",
                    "bg-indigo-100/80 text-indigo-800 border-indigo-200",
                    "bg-teal-100/80 text-teal-800 border-teal-200",
                ];
                const charSum = company.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                const colorClass = colors[charSum % colors.length];

                return (
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-sm border ${colorClass}`}>
                        {company.name}
                    </span>
                )
            }
        },
        {
            accessorKey: "stageName",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Stage
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <span className="cursor-pointer font-medium hover:underline text-emerald-700">{item.stageName}</span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64" side="right">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">{item.stageName}</h4>
                                <div className="text-xs text-muted-foreground">
                                    <p><span className="font-semibold text-zinc-700">Company:</span> {item.company?.name || "Global"}</p>
                                    <p><span className="font-semibold text-zinc-700">Order:</span> {item.order}</p>
                                    <p><span className="font-semibold text-zinc-700">Weight:</span> {item.percentage || 0}%</p>
                                    <p><span className="font-semibold text-zinc-700">Remarks:</span> {item.remarks || "N/A"}</p>
                                    <p><span className="font-semibold text-zinc-700">State:</span> {item.isActive ? "Active" : "Inactive"}</p>
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                )
            }
        },
        {
            accessorKey: "percentage",
            accessorFn: (row: any) => `${row.percentage || 0}%`,
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Percentage
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="font-bold text-zinc-700">
                    {row.original.percentage || 0}%
                </div>
            )
        },
        {
            accessorKey: "remarks",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Remarks
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "isActive",
            accessorFn: (row: any) => row.isActive ? "Yes" : "No",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Active
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <span className={row.original.isActive ? "text-emerald-500 font-medium" : "text-zinc-500 font-medium"}>
                    {row.original.isActive ? "Yes" : "No"}
                </span>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const item = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="text-zinc-700" onClick={() => {
                                setEditItem(item)
                                setIsAddOpen(true)
                            }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.slno)} className="text-red-600">
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-zinc-800">Configuration</h2>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger className="w-[200px] h-9 bg-zinc-50 border-zinc-200">
                            <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Global / All Companies</SelectItem>
                            {companies.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {(() => {
                    const scopedCompanyId = selectedCompanyId === "all" ? null : selectedCompanyId;
                    const totalPercent = data.filter(d => d.isActive && d.companyId === scopedCompanyId).reduce((sum, d) => sum + (d.percentage || 0), 0);
                    return (
                        <div className="flex flex-col gap-1.5 items-center">
                            <h2 className="text-lg font-medium">Pipeline Stages</h2>
                            <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg shadow-inner cursor-help" title={`Displaying totals for ${scopedCompanyId ? "selected company only" : "Global stages only"}`}>
                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Weight Distribution</span>
                                <div className="w-32 h-2.5 bg-zinc-200 rounded-full overflow-hidden shadow-inner flex items-center">
                                    <div className={`h-full transition-all duration-500 ${totalPercent === 100 ? 'bg-emerald-500' : totalPercent > 100 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, Math.max(0, totalPercent))}%` }}></div>
                                </div>
                                <span className={`text-[11px] font-black ${totalPercent === 100 ? 'text-emerald-600' : totalPercent > 100 ? 'text-red-600' : 'text-blue-600'}`}>{totalPercent}% / 100%</span>
                            </div>
                        </div>
                    );
                })()}

                <Dialog open={isAddOpen} onOpenChange={(open) => {
                    setIsAddOpen(open)
                    if (!open) setEditItem(null)
                }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all font-semibold rounded-lg">
                            <Plus className="mr-2 h-4 w-4" /> Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit Stage" : "Add New Stage"}</DialogTitle>
                            <DialogDescription>
                                Establish the sequence of stages for the pipeline.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyId">Company Context</Label>
                                <Select name="companyId" defaultValue={editItem?.companyId || (selectedCompanyId !== "all" ? selectedCompanyId : "global")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Global (All Companies)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">Global (All Companies)</SelectItem>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stageName">Stage Name</Label>
                                <Input id="stageName" name="stageName" defaultValue={editItem?.stageName} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="order">Sequential Order No.</Label>
                                    <Input id="order" name="order" type="number" defaultValue={editItem?.order} required />
                                    <p className="text-xs text-zinc-500">Flow direction (e.g. 1, 2, 3).</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="percentage">Completion %</Label>
                                    <Input id="percentage" name="percentage" type="number" min="0" max="100" defaultValue={editItem?.percentage || 0} required />
                                    <p className="text-xs text-zinc-500">Adds towards 100% cap.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Input id="remarks" name="remarks" defaultValue={editItem?.remarks || ''} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isActive">Active Stage</Label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" className="sr-only peer" defaultChecked={editItem ? editItem.isActive : true} />
                                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editItem ? "Update" : "Create"} Stage</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable columns={columns} data={data} searchKey="stageName" />
        </div>
    )
}
