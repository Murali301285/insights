"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, ArrowUpDown, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type Category = {
    slno: number; companyId: string | null; companyName: string; categoryName: string; description: string; isBlocked: boolean;
}

export default function CategoryConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<Category[]>([])
    const [companies, setCompanies] = useState<{id: string, name: string}[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isActive, setIsActive] = useState(true)
    const [editData, setEditData] = useState<Category | null>(null)

    const fetchData = async () => {
        try {
            const res = await fetch("/api/config/expense-category")
            if (res.ok) {
                const cats = await res.json()
                setData(cats.map((c: any) => ({
                    ...c,
                    companyName: c.company?.name || "Global",
                    isBlocked: !c.isActive
                })))
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        setHeaderInfo("Expense Category", "Configure and manage resource categories.")
        fetch("/api/companies").then(res => res.json()).then(setCompanies).catch(console.error)
        fetchData()
    }, [setHeaderInfo])

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault()
         const formData = new FormData(e.currentTarget)
         const payload = {
             slno: editData?.slno,
             categoryName: formData.get("categoryName") as string,
             companyId: formData.get("companyId") as string,
             description: formData.get("description") as string,
             isActive
         }

         try {
             const res = await fetch("/api/config/expense-category", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify(payload)
             })

             if (res.ok) {
                 toast.success("Category successfully saved.")
                 setIsAddOpen(false)
                 setEditData(null)
                 fetchData()
             } else {
                 const err = await res.json()
                 toast.error(err.error || "Failed to save category")
             }
         } catch (error) {
             toast.error("An error occurred")
         }
    }

    const handleDelete = async (slno: number) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            const res = await fetch(`/api/config/expense-category?slno=${slno}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Category deleted");
                fetchData();
            } else {
                toast.error("Failed to delete category");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    }

    const columns: ColumnDef<Category>[] = [
        { id: "index", header: "Sl No.", cell: ({ row }) => row.index + 1 },
        { accessorKey: "companyName", header: "Company" },
        { accessorKey: "categoryName", header: ({ column }) => (<Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Category Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button>), cell: ({row}) => <span className="font-semibold text-emerald-700">{row.original.categoryName}</span> },
        { accessorKey: "description", header: "Description" },
        { accessorKey: "isBlocked", header: "Status", cell: ({ row }) => <span className={!row.original.isBlocked ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>{!row.original.isBlocked ? "Active" : "Inactive"}</span> },
        { id: "actions", cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => { setEditData(row.original); setIsActive(!row.original.isBlocked); setIsAddOpen(true); }} className="text-blue-700">
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(row.original.slno)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ) }
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-900 border-r pr-4 border-zinc-200">Configuration</span>
                    <Select defaultValue="all"><SelectTrigger className="w-[200px] border-none bg-zinc-50"><SelectValue placeholder="Global / All Companies" /></SelectTrigger><SelectContent><SelectItem value="all">Global / All Companies</SelectItem>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) setEditData(null); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setEditData(null); setIsActive(true); }} className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all font-semibold rounded-lg"><Plus className="w-4 h-4" /> Entry</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl hidden-scrollbar">
                        <DialogHeader><DialogTitle className="text-xl">{editData ? "Edit Expense Category" : "Add New Expense Category"}</DialogTitle></DialogHeader>
                        <form key={editData ? editData.slno : 'new'} onSubmit={handleAdd} className="space-y-5 py-2">
                            <div className="space-y-2"><Label>Company Context <span className="text-red-500">*</span></Label>
                                <Select name="companyId" defaultValue={editData?.companyId || "global"}><SelectTrigger><SelectValue placeholder="Global Mapping" /></SelectTrigger><SelectContent><SelectItem value="global">Global (All Companies)</SelectItem>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2"><Label>Category Name <span className="text-red-500">*</span></Label><Input name="categoryName" defaultValue={editData?.categoryName} required /></div>
                            </div>
                            <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={editData?.description} rows={3} className="resize-none" /></div>
                            
                            <div className="flex items-center justify-between border-t pt-4 mt-2"><Label className="font-semibold text-sm">Active Status</Label><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
                            <div className="flex justify-end pt-2"><Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">Save Category</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-2">
               <DataTable 
                columns={columns} 
                data={data} 
                searchKey="categoryName" 
                reportName="Config - Category Report" 
                fileName="insight-config" 
            />
            </div>
        </div>
    )
}
