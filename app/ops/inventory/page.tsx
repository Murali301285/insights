"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Upload, X, MinusCircle, Package, Layers, Grid, ChevronsUpDown, Check, ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { CreatableCategorySelect } from "@/components/ui/creatable-category-select"
import { useFilter } from "@/components/providers/FilterProvider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function InventoryPage() {
    const { setHeaderInfo } = useHeader()
    const { selectedCompanyIds } = useFilter()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [categoriesMaster, setCategoriesMaster] = useState<{ slno: number, categoryName: string }[]>([])
    const [companies, setCompanies] = useState<any[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
    const [units, setUnits] = useState<{value: string, label: string}[]>([])
    const [gstRates, setGstRates] = useState<{value: string, label: string}[]>([])
    const [igstRates, setIgstRates] = useState<{value: string, label: string}[]>([])
    
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setHeaderInfo("Inventory Management", "Manage individual items and sub assemblies natively")
        fetchCategories()
        fetchCompanies()
        fetchLookups()
    }, [setHeaderInfo])

    useEffect(() => {
        fetchInventory()
    }, [selectedCompanyIds])

    async function fetchInventory() {
        setIsLoading(true)
        try {
            let url = "/api/inventory"
            if (selectedCompanyIds.length > 0) {
                url += `?companyId=${selectedCompanyIds[0]}`
            }
            const res = await fetch(url)
            if (res.ok) {
                setEntries(await res.json())
            }
        } catch (e) {
            console.error("Failed to fetch inventory")
        } finally {
            setIsLoading(false)
        }
    }

    async function fetchLookups() {
        try {
            const [uRes, gRes, iRes] = await Promise.all([
                fetch("/api/config/lookups?type=UNIT&active=true"),
                fetch("/api/config/lookups?type=GST&active=true"),
                fetch("/api/config/lookups?type=IGST&active=true")
            ])
            if (uRes.ok) setUnits(await uRes.json())
            if (gRes.ok) setGstRates(await gRes.json())
            if (iRes.ok) setIgstRates(await iRes.json())
        } catch (e) {}
    }

    async function fetchCompanies() {
        try {
            const res = await fetch("/api/companies?active=true")
            if (res.ok) {
                const data = await res.json()
                setCompanies(data)
                if (data.length > 0) setSelectedCompanyId(data[0].id)
            }
        } catch (e) {}
    }

    async function fetchCategories() {
        try {
            const res = await fetch(`/api/config/category`)
            if (res.ok) {
                const items = await res.json()
                setCategoriesMaster(items)
            }
        } catch (e) { console.error("Failed to fetch categories") }
    }

    const handleSuccess = (newItem: any, isEdit: boolean = false) => {
        if (isEdit) {
            toast.success("Entry updated successfully")
            setIsEditOpen(false)
        } else {
            toast.success("Entry added successfully")
            setIsAddOpen(false)
        }
        fetchInventory()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return
        try {
            const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Entry deleted successfully")
                fetchInventory()
            }
        } catch (e) {
            toast.error("Failed to delete entry")
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            id: "index",
            header: "#",
            cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: "companyId",
            header: ({ column }) => <Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Company <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
            cell: ({ row }) => <span className="font-medium text-zinc-600">{companies.find(c => c.id === row.original.companyId)?.name || 'Global'}</span>,
            accessorFn: (row) => companies.find(c => c.id === row.companyId)?.name || 'Global'
        },
        {
            accessorKey: "name",
            header: ({ column }) => <Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Item Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
            cell: ({ row }) => <span className="font-bold text-zinc-800">{row.original.name}</span>
        },
        {
            accessorKey: "categoryId",
            header: "Category",
            cell: ({ row }) => <span>{categoriesMaster.find(c => c.slno === row.original.categoryId)?.categoryName || '-'}</span>,
            accessorFn: (row) => categoriesMaster.find(c => c.slno === row.categoryId)?.categoryName || '-'
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const t = row.original.type
                let bCls = "bg-zinc-100 text-zinc-700"
                if (t === 'Individual Item') bCls = "bg-indigo-100 text-indigo-700"
                if (t === 'Sub Assembly') bCls = "bg-emerald-100 text-emerald-700"
                
                return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${bCls}`}>{t}</span>
            }
        },
        {
            accessorKey: "quantity",
            header: "Quantity",
            cell: ({ row }) => <span className="font-medium text-zinc-800">{row.original.quantity} {row.original.unit}</span>
        },
        {
            accessorKey: "rate",
            header: "Rate",
            cell: ({ row }) => <span className="font-medium text-zinc-800">₹{(row.original.rate || 0).toFixed(2)}</span>
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-sm">
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => { setSelectedItem(row.original); setIsViewOpen(true); }} className="text-zinc-500 hover:text-zinc-900 font-medium p-1.5 rounded hover:bg-zinc-100 transition-colors">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => { setSelectedItem(row.original); setIsEditOpen(true); }} className="text-indigo-500 hover:text-indigo-700 font-medium p-1.5 rounded hover:bg-indigo-50 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Entry</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => handleDelete(row.original.id)} className="text-red-500 hover:text-red-700 font-medium p-1.5 rounded hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Entry</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-6">
            {/* Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border text-center border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-500 mb-1 flex items-center justify-center gap-2">
                        <Package className="w-4 h-4" /> Individual Items
                    </div>
                    <div className="text-3xl font-bold text-indigo-700">{entries.filter(e => e.type === "Individual Item").length}</div>
                </div>
                <div className="bg-white border text-center border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-500 mb-1 flex items-center justify-center gap-2">
                        <Layers className="w-4 h-4" /> Sub Assembly
                    </div>
                    <div className="text-3xl font-bold text-emerald-600">{entries.filter(e => e.type === "Sub Assembly").length}</div>
                </div>
                <div className="bg-white border text-center border-zinc-200 rounded-xl p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-500 mb-1 flex items-center justify-center gap-2">
                        <Grid className="w-4 h-4" /> Total Categories
                    </div>
                    <div className="text-3xl font-bold text-rose-600">{categoriesMaster.length || 12}</div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative w-full">
                <div className="absolute top-4 right-4 z-10 flex gap-4">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all h-9 rounded-full px-5">
                                <Plus className="w-4 h-4" />
                                Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Add New Entry</DialogTitle>
                                <p className="text-zinc-500 text-sm">Select the type of entry you want to log.</p>
                            </DialogHeader>
                            
                            <div className="mt-4 space-y-1.5">
                                <Label className="text-sm font-medium">Company Name <span className="text-red-500">*</span></Label>
                                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                                    <SelectTrigger className="w-full border-zinc-200 h-10">
                                        <SelectValue placeholder="Select Company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Tabs defaultValue="individual" className="w-full mt-4">
                                <TabsList className="grid grid-cols-2 w-full mb-6 bg-zinc-100">
                                    <TabsTrigger value="individual">Individual item</TabsTrigger>
                                    <TabsTrigger value="sub-assembly">Sub Assembly</TabsTrigger>
                                </TabsList>

                                <div className="relative">
                                    <TabsContent value="individual" className="mt-0 outline-none">
                                        <NewItemForm companyId={selectedCompanyId} onSuccess={(i) => handleSuccess(i, false)} categoriesMaster={categoriesMaster} setCategoriesMaster={setCategoriesMaster} units={units} gstRates={gstRates} igstRates={igstRates} />
                                    </TabsContent>

                                    <TabsContent value="sub-assembly" className="mt-0 outline-none">
                                        <CompositeItemForm companyId={selectedCompanyId} title="Add new Sub Assembly" isSubAssembly={true} onSuccess={(i) => handleSuccess(i, false)} categoriesMaster={categoriesMaster} setCategoriesMaster={setCategoriesMaster} units={units} gstRates={gstRates} igstRates={igstRates} />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-800">
                    <Package className="w-5 h-5 text-indigo-500" /> Inventory Register
                </h3>
                <div className="text-sm text-zinc-500 mb-4 bg-zinc-50 p-2 rounded max-w-fit">
                    Last synced: {new Date().toLocaleString('en-GB')}
                </div>
                <DataTable columns={columns} data={entries} searchKey="name" />
            </div>

            {/* View Details Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {selectedItem?.name} 
                            <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600 font-semibold">{selectedItem?.type}</span>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-6 mt-4 relative">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                    <Label className="text-xs text-zinc-500">Category</Label>
                                    <div className="font-semibold text-zinc-800">{selectedItem.category}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-500">HSN/SAC Code</Label>
                                    <div className="font-semibold text-zinc-800">{selectedItem.hsnCode || "-"}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-500">Quantity & Unit</Label>
                                    <div className="font-semibold text-zinc-800">{selectedItem.quantity} {selectedItem.unit}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-500">Selling Price</Label>
                                    <div className="font-semibold text-zinc-800">₹{parseFloat(selectedItem.rate).toFixed(2)}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-500">GST %</Label>
                                    <div className="font-semibold text-zinc-800">{selectedItem.gst || "-"}%</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-500">IGST %</Label>
                                    <div className="font-semibold text-zinc-800">{selectedItem.igst || "-"}%</div>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs text-zinc-500">Description</Label>
                                    <div className="font-semibold text-zinc-800 text-sm mt-1 bg-zinc-50 p-3 rounded-lg border border-zinc-100">{selectedItem.description || "No description provided."}</div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-zinc-200">
                                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Item Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Edit Entry</DialogTitle>
                    </DialogHeader>
                    {selectedItem && selectedItem.type === "Individual Item" && (
                        <NewItemForm 
                            companyId={selectedCompanyId}
                            initialData={selectedItem} 
                            onSuccess={(i) => handleSuccess(i, true)} 
                            categoriesMaster={categoriesMaster} 
                            setCategoriesMaster={setCategoriesMaster} 
                            units={units} gstRates={gstRates} igstRates={igstRates}
                        />
                    )}
                    {selectedItem && selectedItem.type === "Sub Assembly" && (
                        <CompositeItemForm 
                            companyId={selectedCompanyId}
                            initialData={selectedItem} 
                            title="Edit Sub Assembly" 
                            isSubAssembly={true} 
                            onSuccess={(i) => handleSuccess(i, true)} 
                            categoriesMaster={categoriesMaster} 
                            setCategoriesMaster={setCategoriesMaster} 
                            units={units} gstRates={gstRates} igstRates={igstRates}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function NewItemForm({ companyId, onSuccess, initialData, categoriesMaster, setCategoriesMaster, units, gstRates, igstRates }: { companyId: string, onSuccess: (item: any) => void, initialData?: any, categoriesMaster: any[], setCategoriesMaster: any, units: any[], gstRates: any[], igstRates: any[] }) {
    const [selectedCategories, setSelectedCategories] = useState<number[]>(initialData?.categoryId ? [initialData.categoryId] : [])
    const [annexureFiles, setAnnexureFiles] = useState<File[]>([])
    const [imageFiles, setImageFiles] = useState<File[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
        if (e.target.files) {
            setter(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const categoryName = selectedCategories.length > 0 
            ? categoriesMaster.find(c => c.slno === selectedCategories[0])?.categoryName || "General"
            : "General"

        const payload = {
            id: initialData?.id,
            companyId,
            name: formData.get("name") || "Unknown Item",
            categoryId: selectedCategories[0],
            hsnCode: formData.get("hsnCode"),
            description: formData.get("description"),
            quantity: formData.get("quantity") || 0,
            unit: formData.get("unit") || "pcs",
            rate: parseFloat(formData.get("price") as string) || 0,
            gst: formData.get("gst"),
            igst: formData.get("igst"),
            type: "Individual Item"
        }

        try {
            const res = await fetch('/api/inventory', {
                method: initialData?.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                data.category = categoryName // For UI update
                onSuccess(data)
            } else {
                toast.error("Failed to save entry")
            }
        } catch (e) {
            toast.error("An error occurred")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300 relative mt-4">
            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Item Name <span className="text-red-500">*</span></Label>
                <Input name="name" defaultValue={initialData?.name} placeholder="Enter item name" required className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">HSN/SAC Code <span className="text-red-500">*</span></Label>
                <Input name="hsnCode" defaultValue={initialData?.hsnCode} placeholder="" required className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Item Description</Label>
                <Textarea name="description" defaultValue={initialData?.description} placeholder="Enter the item description here..." className="min-h-[100px] resize-y border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Quantity <span className="text-red-500">*</span></Label>
                <Input name="quantity" type="number" defaultValue={initialData?.quantity || "0"} required className="h-10 border-zinc-200" />
                <p className="text-xs text-zinc-500 mt-1">Quantity is automatically managed through GRNs</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Unit</Label>
                    <Select name="unit" defaultValue={initialData?.unit || (units.length > 0 ? units[0].value : "")}>
                        <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select a unit" /></SelectTrigger>
                        <SelectContent>
                            {units.map(u => <SelectItem key={u.value} value={u.value}>{u.label || u.value}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5 relative z-50">
                    <Label className="text-sm font-medium">Class/Category</Label>
                    <CreatableCategorySelect
                        categories={categoriesMaster}
                        selectedIds={selectedCategories}
                        onChange={setSelectedCategories}
                        onCategoryCreated={(newCat) => setCategoriesMaster((prev: any) => [newCat, ...prev])}
                        companyId={companyId}
                        apiEndpoint="/api/config/category"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Purchase Price</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                        <Input placeholder="" className="pl-7 h-10 border-zinc-200" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Selling Price <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                        <Input name="price" type="number" step="0.01" defaultValue={initialData?.rate} placeholder="" required className="pl-7 h-10 border-zinc-200" />
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium">Tax Percentage</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">GST rate %</Label>
                        <Select name="gst" defaultValue={initialData?.gst || (gstRates.length > 0 ? gstRates[0].value : "")}>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent>
                                {gstRates.map(g => <SelectItem key={g.value} value={g.value}>{g.label || g.value}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">IGST rate %</Label>
                        <Select name="igst" defaultValue={initialData?.igst || (igstRates.length > 0 ? igstRates[0].value : "")}>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select IGST" /></SelectTrigger>
                            <SelectContent>
                                {igstRates.map(g => <SelectItem key={g.value} value={g.value}>{g.label || g.value}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium block">Annexure</Label>
                <span className="text-xs text-zinc-500 block mb-2">Click below to add, edit or view the annexure for this item.</span>
                <div className="flex flex-wrap gap-2 mb-2">
                    {annexureFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
                            <span className="text-xs text-zinc-700 truncate max-w-[150px]">{file.name}</span>
                            <button type="button" onClick={() => setAnnexureFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
                <Label className="cursor-pointer flex items-center justify-center w-full text-zinc-700 border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm border-dashed rounded-md border">
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, setAnnexureFiles)} />
                    <Plus className="w-4 h-4 mr-2" /> Add Annexure
                </Label>
            </div>

            <div className="space-y-1.5 pt-4">
                <Label className="text-sm font-medium block">Upload Item Images</Label>
                <span className="text-xs text-zinc-500 block mb-3 leading-relaxed">
                    Upload your product images here. Accepted formats: <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.png</span> and <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.jpg</span><br />
                    Maximum file size: <span className="text-blue-600 font-medium">10MB</span>
                </span>
                <div className="flex flex-wrap gap-3 mb-3">
                    {imageFiles.map((file, i) => (
                        <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-zinc-200">
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-white/80 p-0.5 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
                <Label className="cursor-pointer flex items-center justify-center w-full border border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm rounded-md">
                    <input type="file" accept="image/png, image/jpeg" multiple className="hidden" onChange={(e) => handleFileChange(e, setImageFiles)} />
                    <Upload className="w-4 h-4 mr-2 text-zinc-600" /> Upload Images
                </Label>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-zinc-200">
                {initialData && <Button type="button" variant="outline" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))}>Cancel</Button>}
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-8 font-semibold rounded-lg">{initialData ? "Save Changes" : "Save Item"}</Button>
            </div>
        </form>
    )
}

function CompositeItemForm({ companyId, title, isSubAssembly = false, onSuccess, initialData, categoriesMaster, setCategoriesMaster, units, gstRates, igstRates }: { companyId: string, title: string, isSubAssembly?: boolean, onSuccess: (item: any) => void, initialData?: any, categoriesMaster: any[], setCategoriesMaster: any, units: any[], gstRates: any[], igstRates: any[] }) {
    const [components, setComponents] = useState<{ id: number, name: string, qty: string, rate: string, total: string }[]>(
        initialData?.components?.map((c: any) => ({
            id: c.id,
            name: c.componentName,
            qty: String(c.qty),
            rate: String(c.rate),
            total: String(c.total)
        })) || []
    )
    const [selectedCategories, setSelectedCategories] = useState<number[]>(initialData?.categoryId ? [initialData.categoryId] : [])
    const [annexureFiles, setAnnexureFiles] = useState<File[]>([])
    const [imageFiles, setImageFiles] = useState<File[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
        if (e.target.files) {
            setter(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const addComponent = () => {
        setComponents([...components, { id: Date.now(), name: "", qty: "1", rate: "0.00", total: "0.00" }])
    }

    const updateComponent = (id: number, field: string, value: string) => {
        setComponents(components.map(c => {
            if (c.id === id) {
                const updated = { ...c, [field]: value };
                if (field === 'qty' || field === 'rate') {
                    const qty = parseFloat(updated.qty) || 0;
                    const rate = parseFloat(updated.rate) || 0;
                    updated.total = (qty * rate).toFixed(2);
                }
                return updated;
            }
            return c;
        }));
    }

    const removeComponent = (id: number) => {
        setComponents(components.filter(c => c.id !== id))
    }

    const totalQty = components.reduce((acc, c) => acc + (parseFloat(c.qty) || 0), 0);
    const totalAmount = components.reduce((acc, c) => acc + (parseFloat(c.total) || 0), 0);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const categoryName = selectedCategories.length > 0 
            ? categoriesMaster.find(c => c.slno === selectedCategories[0])?.categoryName || "Assemblies"
            : "Assemblies"

        const payload = {
            id: initialData?.id,
            companyId,
            name: formData.get("name") || "Unknown Assembly",
            categoryId: selectedCategories[0],
            hsnCode: formData.get("hsnCode"),
            description: formData.get("description"),
            quantity: initialData?.quantity || 1, // Defaulting to 1 for new assemblies
            unit: formData.get("unit") || "pcs",
            rate: parseFloat(formData.get("price") as string) || 0,
            gst: formData.get("gst"),
            igst: formData.get("igst"),
            type: "Sub Assembly",
            components: components.map(c => ({
                name: c.name,
                qty: c.qty,
                rate: c.rate,
                total: c.total
            }))
        }
        
        try {
            const res = await fetch('/api/inventory', {
                method: initialData?.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                data.category = categoryName // For UI update
                onSuccess(data)
            } else {
                toast.error("Failed to save entry")
            }
        } catch (e) {
            toast.error("An error occurred")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300 relative mt-4">
            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Item Name <span className="text-red-500">*</span></Label>
                <Input name="name" defaultValue={initialData?.name} placeholder={isSubAssembly ? "Enter Sub Assembly name" : "Enter item name"} required className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">HSN/SAC Code <span className="text-red-500">*</span></Label>
                <Input name="hsnCode" defaultValue={initialData?.hsnCode} placeholder="" required className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Item Description</Label>
                <Textarea name="description" defaultValue={initialData?.description} placeholder="Enter the item description here..." className="min-h-[100px] resize-y border-zinc-200" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Unit</Label>
                    <Select name="unit" defaultValue={initialData?.unit || (units.length > 0 ? units[0].value : "")}>
                        <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select a unit" /></SelectTrigger>
                        <SelectContent>
                            {units.map(u => <SelectItem key={u.value} value={u.value}>{u.label || u.value}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 relative z-50">
                    <Label className="text-sm font-medium">Class/Category</Label>
                    <CreatableCategorySelect
                        categories={categoriesMaster}
                        selectedIds={selectedCategories}
                        onChange={setSelectedCategories}
                        onCategoryCreated={(newCat) => setCategoriesMaster((prev: any) => [newCat, ...prev])}
                        companyId={companyId}
                        apiEndpoint="/api/config/category"
                    />
                </div>
            </div>

            {/* Components Section */}
            <div className="space-y-1.5 pt-4 pb-2 border-y border-zinc-100 my-6 py-6">
                <Label className="text-sm font-medium block">{isSubAssembly ? "Components" : "Item Composition"}</Label>
                <span className="text-xs text-zinc-500 block mb-4">Click below to add individual items {isSubAssembly && "and composite items "}that make up this {isSubAssembly ? "Sub Assembly" : "composite item"}.</span>

                {components.length > 0 && (
                    <div className="mb-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-inner">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-zinc-800">{isSubAssembly ? "Sub Assembly Components" : "Composite Items"}</h4>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setComponents([])} className="h-6 px-2 text-xs text-zinc-500 hover:text-red-500">
                                <X className="w-3 h-3 mr-1" /> Clear All
                            </Button>
                        </div>
                        <div className="w-full text-xs font-semibold text-zinc-500 flex items-center border-b border-zinc-200 pb-2 mb-2 px-2">
                            <div className="flex-1 text-left">Item Name</div>
                            <div className="w-24 text-left px-2">Qty</div>
                            <div className="w-28 text-left px-2">Rate</div>
                            <div className="w-28 text-left px-2">Total</div>
                            <div className="w-6"></div>
                        </div>
                        <div className="space-y-2">
                            {components.map(c => (
                                <div key={c.id} className="flex items-center gap-2 group">
                                    <div className="flex-1">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" className="w-full justify-between h-9 bg-white shadow-sm border-zinc-200 font-normal px-3 text-left">
                                                    {c.name ? c.name : <span className="text-zinc-500">Select Item...</span>}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search items..." />
                                                    <CommandList>
                                                        <CommandEmpty>No item found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {["Raw Material A", "Raw Material B", "Widget X"].map(item => (
                                                                <CommandItem
                                                                    key={item}
                                                                    value={item}
                                                                    onSelect={() => updateComponent(c.id, 'name', item)}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", c.name === item ? "opacity-100" : "opacity-0")} />
                                                                    {item}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="w-24">
                                        <Input type="number" min="0" value={c.qty} onChange={(e) => updateComponent(c.id, 'qty', e.target.value)} className="h-9 text-left bg-white shadow-sm border-zinc-200 px-3" />
                                    </div>
                                    <div className="w-28">
                                        <Input type="number" min="0" step="0.01" value={c.rate} onChange={(e) => updateComponent(c.id, 'rate', e.target.value)} className="h-9 text-left bg-white shadow-sm border-zinc-200 px-3" />
                                    </div>
                                    <div className="w-28 text-left px-3 font-bold text-sm text-zinc-800 block line-clamp-1">{c.total}</div>
                                    <div className="w-6 flex justify-end">
                                        <button type="button" onClick={() => removeComponent(c.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                            <MinusCircle className="w-5 h-5 fill-red-500 text-white" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-end gap-2 pr-8">
                            <div className="text-sm font-semibold text-zinc-600 mr-2">Summary:</div>
                            <div className="w-24 text-left px-3 font-bold text-sm text-indigo-700">{totalQty}</div>
                            <div className="w-28 text-left px-3"></div>
                            <div className="w-28 text-left px-3 font-bold text-sm text-indigo-700">₹{totalAmount.toFixed(2)}</div>
                        </div>

                        <Button type="button" variant="outline" className="w-full mt-4 bg-white border-dashed border-zinc-300 text-zinc-600 shadow-sm hover:bg-zinc-50" onClick={addComponent}>
                            <Plus className="w-4 h-4 mr-2" /> Add Another Component
                        </Button>
                    </div>
                )}

                {components.length === 0 && (
                    <Button type="button" variant="outline" className="w-full text-zinc-700 border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm" onClick={addComponent}>
                        <Plus className="w-4 h-4 mr-2" /> {isSubAssembly ? "Add Components" : "Add Items"}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Purchase Price</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                        <Input placeholder="" className="pl-7 h-10 border-zinc-200" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Selling Price <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                        <Input name="price" type="number" step="0.01" defaultValue={initialData?.rate} placeholder="" required className="pl-7 h-10 border-zinc-200" />
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium">Tax Percentage</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">GST rate %</Label>
                        <Select name="gst" defaultValue={initialData?.gst || "18"}>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent><SelectItem value="18">18%</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">IGST rate %</Label>
                        <Select name="igst" defaultValue={initialData?.igst || "18"}>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent><SelectItem value="18">18%</SelectItem></SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium block">Annexure</Label>
                <span className="text-xs text-zinc-500 block mb-2">Click below to add, edit or view the annexure for this item.</span>
                <div className="flex flex-wrap gap-2 mb-2">
                    {annexureFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
                            <span className="text-xs text-zinc-700 truncate max-w-[150px]">{file.name}</span>
                            <button type="button" onClick={() => setAnnexureFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
                <Label className="cursor-pointer flex items-center justify-center w-full text-zinc-700 border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm border-dashed rounded-md border">
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, setAnnexureFiles)} />
                    <Plus className="w-4 h-4 mr-2" /> Add Annexure
                </Label>
            </div>

            <div className="space-y-1.5 pt-4">
                <Label className="text-sm font-medium block">Upload Item Images</Label>
                <span className="text-xs text-zinc-500 block mb-3 leading-relaxed">
                    Upload your product images here. Accepted formats: <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.png</span> and <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.jpg</span><br />
                    Maximum file size: <span className="text-blue-600 font-medium">10MB</span>
                </span>
                <div className="flex flex-wrap gap-3 mb-3">
                    {imageFiles.map((file, i) => (
                        <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-zinc-200">
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-white/80 p-0.5 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
                <Label className="cursor-pointer flex items-center justify-center w-full border border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm rounded-md">
                    <input type="file" accept="image/png, image/jpeg" multiple className="hidden" onChange={(e) => handleFileChange(e, setImageFiles)} />
                    <Upload className="w-4 h-4 mr-2 text-zinc-600" /> Upload Images
                </Label>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-zinc-200">
                {initialData && <Button type="button" variant="outline" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))}>Cancel</Button>}
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-8 font-semibold rounded-lg">
                    {initialData ? "Save Changes" : `Save ${isSubAssembly ? "Sub Assembly" : "Item"}`}
                </Button>
            </div>
        </form>
    )
}
