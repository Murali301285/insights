"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, ArrowUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type Category = {
    id: string; companyName: string; categoryName: string; parentCategory: string; description: string; isBlocked: boolean;
}

export default function CategoryConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<Category[]>([])
    const [companies, setCompanies] = useState<{id: string, name: string}[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)

    useEffect(() => {
        setHeaderInfo("Expense Category", "Configure and manage resource categories.")
        fetch("/api/config/company").then(res => res.json()).then(setCompanies).catch(console.error)
    }, [setHeaderInfo])

    const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault()
         toast.success("Category successfully saved.")
         setIsAddOpen(false)
    }

    const columns: ColumnDef<Category>[] = [
        { id: "index", header: "Sl No.", cell: ({ row }) => row.index + 1 },
        { accessorKey: "companyName", header: "Company" },
        { accessorKey: "categoryName", header: ({ column }) => (<Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Category Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button>), cell: ({row}) => <span className="font-semibold text-emerald-700">{row.original.categoryName}</span> },
        { accessorKey: "description", header: "Description" },
        { accessorKey: "isBlocked", header: "Status", cell: ({ row }) => <span className={!row.original.isBlocked ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>{!row.original.isBlocked ? "Active" : "Inactive"}</span> },
        { id: "actions", cell: () => (<Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>) }
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-900 border-r pr-4 border-zinc-200">Configuration</span>
                    <Select defaultValue="all"><SelectTrigger className="w-[200px] border-none bg-zinc-50"><SelectValue placeholder="Global / All Companies" /></SelectTrigger><SelectContent><SelectItem value="all">Global / All Companies</SelectItem>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all font-semibold rounded-lg"><Plus className="w-4 h-4" /> Entry</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl hidden-scrollbar">
                        <DialogHeader><DialogTitle className="text-xl">Add New Expense Category</DialogTitle></DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-5 py-2">
                            <div className="space-y-2"><Label>Company Context <span className="text-red-500">*</span></Label>
                                <Select name="companyId" defaultValue="global"><SelectTrigger><SelectValue placeholder="Global Mapping" /></SelectTrigger><SelectContent><SelectItem value="global">Global (All Companies)</SelectItem>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2"><Label>Category Name <span className="text-red-500">*</span></Label><Input required /></div>
                            </div>
                            <div className="space-y-2"><Label>Description</Label><Textarea rows={3} className="resize-none" /></div>
                            
                            <div className="flex items-center justify-between border-t pt-4 mt-2"><Label className="font-semibold text-sm">Active Status</Label><Switch defaultChecked /></div>
                            <div className="flex justify-end pt-2"><Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">Save Category</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-2">
               <DataTable columns={columns} data={data} searchKey="categoryName" />
            </div>
        </div>
    )
}
