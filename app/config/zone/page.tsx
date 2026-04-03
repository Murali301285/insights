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

type Zone = {
    slno: number
    companyId: string | null
    zoneName: string
    remarks: string | null
    isActive: boolean
    createdAt: string
}

export default function ZoneMasterPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<Zone[]>([])
    const [loading, setLoading] = useState(true)
    const [companies, setCompanies] = useState<any[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editItem, setEditItem] = useState<Zone | null>(null)

    useEffect(() => {
        setHeaderInfo("Zone Master", "Configure and manage geographical zones.")
        
    }, [setHeaderInfo])

    useEffect(() => {
        async function loadCompanies() {
            try {
                const res = await fetch("/api/companies")
                if (res.ok) { const data = await res.json(); setCompanies(data); }
            } catch (e) {}
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
            const res = await fetch(`/api/config/zone${qs}`)
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
        const payload = {
            slno: editItem ? editItem.slno : undefined,
            zoneName: formData.get("zoneName"),
            remarks: formData.get("remarks"),
            isActive: formData.get("isActive") === "on",
            companyId: formData.get("companyId") === "global" ? null : (formData.get("companyId") || null),
        }

        try {
            const res = await fetch("/api/config/zone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success(editItem ? "Zone updated" : "Zone created")
                setIsAddOpen(false)
                setEditItem(null)
                fetchData()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to save zone")
            }
        } catch (error) {
            toast.error("Error saving zone")
        }
    }

    async function handleDelete(slno: number) {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            const res = await fetch(`/api/config/zone?slno=${slno}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Zone deleted")
                fetchData()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const columns: ColumnDef<Zone>[] = [
        {
            id: "index",
            header: "Sl No.",
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "zoneName",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Zone
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <span className="cursor-pointer font-medium hover:underline text-emerald-700">{item.zoneName}</span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64" side="right">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">{item.zoneName}</h4>
                                <div className="text-xs text-muted-foreground">
                                    <p><span className="font-semibold text-zinc-700">Remarks:</span> {item.remarks || "N/A"}</p>
                                    <p><span className="font-semibold text-zinc-700">Status:</span> {item.isActive ? "Active" : "Inactive"}</p>
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                )
            }
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
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <span className={row.original.isActive ? "text-emerald-500 font-medium" : "text-zinc-500 font-medium"}>
                    {row.original.isActive ? "Active" : "Inactive"}
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
                <h2 className="text-lg font-medium">Zones</h2>
                <Dialog open={isAddOpen} onOpenChange={(open) => {
                    setIsAddOpen(open)
                    if (!open) setEditItem(null)
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Zone
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit Zone" : "Add New Zone"}</DialogTitle>
                            <DialogDescription>
                                Enter the details of the zone.
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
                                <Label htmlFor="zoneName">Zone Name</Label>
                                <Input id="zoneName" name="zoneName" defaultValue={editItem?.zoneName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Input id="remarks" name="remarks" defaultValue={editItem?.remarks || ''} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isActive">Active Status</Label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" className="sr-only peer" defaultChecked={editItem ? editItem.isActive : true} />
                                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editItem ? "Update" : "Create"} Zone</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable columns={columns} data={data} searchKey="zoneName" />
        </div>
    )
}
