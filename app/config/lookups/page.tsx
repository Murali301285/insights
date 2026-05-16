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

type Lookup = {
    id: string;
    type: string;
    value: string;
    label: string | null;
    remarks: string | null;
    isActive: boolean;
}

export default function LookupsConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<Lookup[]>([])
    const [selectedType, setSelectedType] = useState<string>("UNIT")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Lookup | null>(null)

    const LOOKUP_TYPES = [
        { id: "UNIT", name: "Units of Measurement" },
        { id: "GST", name: "GST Rates (%)" },
        { id: "IGST", name: "IGST Rates (%)" },
    ]

    useEffect(() => {
        setHeaderInfo("System Lookups", "Configure standard lists like Units and Taxes across the application.")
    }, [setHeaderInfo])

    useEffect(() => {
        fetchLookups()
    }, [selectedType])

    const fetchLookups = async () => {
        try {
            const res = await fetch(`/api/config/lookups?type=${selectedType}`)
            if (res.ok) {
                setData(await res.json())
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const payload = {
            type: selectedType,
            value: formData.get("value"),
            label: formData.get("label"),
            remarks: formData.get("remarks")
        }

        try {
            const res = await fetch("/api/config/lookups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success("Entry saved successfully")
                setIsAddOpen(false)
                fetchLookups()
            } else {
                const errData = await res.json().catch(() => ({}))
                toast.error(`Failed to save: ${errData.details || errData.error || res.statusText}`)
            }
        } catch (e: any) {
            toast.error(`An error occurred: ${e.message}`)
        }
    }

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedItem) return
        const formData = new FormData(e.currentTarget)
        const payload = {
            id: selectedItem.id,
            value: formData.get("value"),
            label: formData.get("label"),
            remarks: formData.get("remarks"),
            isActive: formData.get("isActive") === "on"
        }

        try {
            const res = await fetch("/api/config/lookups", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success("Entry updated successfully")
                setIsEditOpen(false)
                fetchLookups()
            } else {
                toast.error("Failed to update entry")
            }
        } catch (e) {
            toast.error("An error occurred")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return
        try {
            const res = await fetch(`/api/config/lookups?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Entry deleted")
                fetchLookups()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const columns: ColumnDef<Lookup>[] = [
        { id: "index", header: "Sl No.", cell: ({ row }) => row.index + 1 },
        { accessorKey: "value", header: ({ column }) => (<Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Value <ArrowUpDown className="ml-2 h-4 w-4" /></Button>), cell: ({row}) => <span className="font-semibold text-emerald-700">{row.original.value}</span> },
        { accessorKey: "label", header: "Display Label" },
        { accessorKey: "remarks", header: "Remarks" },
        { accessorKey: "isActive", header: "Status", cell: ({ row }) => <span className={row.original.isActive ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>{row.original.isActive ? "Active" : "Inactive"}</span>, accessorFn: (row) => row.isActive ? "Active" : "Inactive" },
        { id: "actions", cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-white">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => { setSelectedItem(row.original); setIsEditOpen(true) }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => handleDelete(row.original.id)}><ArrowUpDown className="mr-2 h-4 w-4 rotate-90" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ) }
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-900 border-r pr-4 border-zinc-200">Lookup Type</span>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-[250px] bg-zinc-50 border-zinc-200 shadow-sm font-medium">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {LOOKUP_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all font-semibold rounded-lg"><Plus className="w-4 h-4" /> Add Entry</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md hidden-scrollbar">
                        <DialogHeader><DialogTitle className="text-xl">Add {LOOKUP_TYPES.find(t=>t.id===selectedType)?.name}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSave} className="space-y-5 py-2">
                            <div className="space-y-2"><Label>Value <span className="text-red-500">*</span></Label><Input name="value" placeholder="e.g. kg, 18" required /></div>
                            <div className="space-y-2"><Label>Display Label</Label><Input name="label" placeholder="e.g. Kilograms, 18%" /></div>
                            <div className="space-y-2"><Label>Remarks</Label><Textarea name="remarks" rows={2} className="resize-none" /></div>
                            <div className="flex justify-end pt-2"><Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">Save Entry</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-md hidden-scrollbar">
                        <DialogHeader><DialogTitle className="text-xl">Edit {LOOKUP_TYPES.find(t=>t.id===selectedType)?.name}</DialogTitle></DialogHeader>
                        {selectedItem && (
                            <form onSubmit={handleEdit} className="space-y-5 py-2">
                                <div className="space-y-2"><Label>Value <span className="text-red-500">*</span></Label><Input name="value" defaultValue={selectedItem.value} required /></div>
                                <div className="space-y-2"><Label>Display Label</Label><Input name="label" defaultValue={selectedItem.label || ""} /></div>
                                <div className="space-y-2"><Label>Remarks</Label><Textarea name="remarks" defaultValue={selectedItem.remarks || ""} rows={2} className="resize-none" /></div>
                                <div className="flex items-center justify-between border-t pt-4 mt-2"><Label className="font-semibold text-sm">Active Status</Label><Switch name="isActive" defaultChecked={selectedItem.isActive} /></div>
                                <div className="flex justify-end pt-2"><Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">Update Entry</Button></div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="bg-white rounded-xl border border-zinc-200 p-2">
               <DataTable 
                columns={columns} 
                data={data} 
                searchKey="value" 
                reportName="Config - Lookups Report" 
                fileName="insight-config" 
            />
            </div>
        </div>
    )
}
