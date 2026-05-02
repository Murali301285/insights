"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash, ArrowUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type RoleEntity = {
    id: string
    name: string
    userType: string
    remarks: string
    companyId: string | null
    isActive: boolean
    company?: { name: string }
}

export default function RoleConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<RoleEntity[]>([])
    const [loading, setLoading] = useState(true)
    const [companies, setCompanies] = useState<any[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editItem, setEditItem] = useState<RoleEntity | null>(null)

    useEffect(() => {
        setHeaderInfo("Role Master", "Configure and define global system access roles.")
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
            const res = await fetch(`/api/config/roles${qs}`)
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
            id: editItem ? editItem.id : undefined,
            name: formData.get("roleName"),
            userType: formData.get("userType") || "Entity",
            remarks: formData.get("description"),
            isActive: formData.get("isActive") === "on",
            companyId: formData.get("companyId") === "global" ? null : (formData.get("companyId") || null),
        }

        try {
            const res = await fetch("/api/config/roles", {
                method: editItem ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success(editItem ? "Role updated" : "Role created")
                setIsAddOpen(false)
                setEditItem(null)
                fetchData()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to save")
            }
        } catch (error) {
            toast.error("Error saving role")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            const res = await fetch(`/api/config/roles?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Role deleted")
                fetchData()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const columns: ColumnDef<RoleEntity>[] = [
        { id: "index", header: "Sl No.", cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.index + 1}</span> },
        {
            accessorKey: "companyId",
            accessorFn: (row: any) => row.company?.name || "Global",
            header: "Company",
            cell: ({ row }) => {
                const item = row.original as any;
                const companyName = item.company?.name;
                if (!companyName) return <span className="text-zinc-700 bg-zinc-100 px-2 py-1 rounded text-xs font-medium border border-zinc-200">Global</span>;
                return <span className="text-slate-700 font-medium">{companyName}</span>;
            }
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Role Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-semibold text-emerald-700">{row.original.name}</span>
        },
        {
            accessorKey: "userType",
            header: "User Type",
            cell: ({ row }) => {
                const userType = row.original.userType;
                return <span className={`font-medium ${userType === 'Group' ? 'text-indigo-600' : 'text-emerald-600'}`}>{userType}</span>;
            }
        },
        { accessorKey: "remarks", header: "Description" },
        {
            accessorKey: "isActive",
            accessorFn: (row: any) => row.isActive ? "Active" : "Inactive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.original.isActive
                return <span className={isActive ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>{isActive ? "Active" : "Inactive"}</span>
            }
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditItem(row.original); setIsAddOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(row.original.id)}><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-900 border-r pr-4 border-zinc-200">Configuration</span>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger className="w-[200px] border-none bg-zinc-50 font-medium">
                            <SelectValue placeholder="Select Company" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Global / All Companies</SelectItem>
                            {companies.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={isAddOpen} onOpenChange={(v) => { setIsAddOpen(v); if (!v) setEditItem(null); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-4 font-semibold text-white shadow-sm"><Plus className="mr-2 h-4 w-4" /> Add Role</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md hidden-scrollbar">
                        <DialogHeader><DialogTitle className="text-xl">{editItem ? "Edit Role" : "Create New Role"}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-2">
                            <div className="space-y-2"><Label>Company Context</Label>
                                <Select name="companyId" defaultValue={editItem?.companyId || "global"}>
                                    <SelectTrigger><SelectValue placeholder="Global Mapping" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">Global / All Companies</SelectItem>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Role Name <span className="text-red-500">*</span></Label>
                                <Input name="roleName" defaultValue={editItem?.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label>User Type <span className="text-red-500">*</span></Label>
                                <Select name="userType" defaultValue={editItem?.userType || "Entity"}>
                                    <SelectTrigger><SelectValue placeholder="Select User Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Entity">Entity User</SelectItem>
                                        <SelectItem value="Group">Group User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Role Protocol / Description</Label>
                                <Textarea name="description" defaultValue={editItem?.remarks || ""} className="resize-none" rows={3} />
                            </div>
                            <div className="flex items-center justify-between border-t pt-4"><Label className="font-semibold text-sm">Active Status</Label><Switch name="isActive" defaultChecked={editItem ? editItem.isActive : true} /></div>
                            <div className="flex justify-end pt-4"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">{editItem ? "Update Role" : "Save Role"}</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-2 shadow-sm">
                <DataTable columns={columns} data={data} searchKey="name" />
            </div>
        </div>
    )
}
