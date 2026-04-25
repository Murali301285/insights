"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Upload, X, MinusCircle, Package, Layers, Grid } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { CreatableCategorySelect } from "@/components/ui/creatable-category-select"

export default function InventoryPage() {
    const { setHeaderInfo } = useHeader()
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [categoriesMaster, setCategoriesMaster] = useState<{ slno: number, categoryName: string }[]>([])
    
    const [entries, setEntries] = useState<any[]>([
        { id: "1", name: "Raw Material A", category: "Raw Materials", quantity: 500, unit: "kg", rate: 120.0, type: "Individual Item", hsnCode: "HSN123", gst: "18", igst: "18", description: "Standard raw material." },
        { id: "2", name: "Sub Assembly Alpha", category: "Assemblies", quantity: 50, unit: "pcs", rate: 1500.0, type: "Sub Assembly", hsnCode: "HSN456", gst: "12", igst: "12", description: "Alpha tier assembly." },
    ])

    useEffect(() => {
        setHeaderInfo("Inventory Settings", "Manage individual items and sub assemblies natively")
        fetchCategories()
    }, [setHeaderInfo])

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
            setEntries(entries.map(e => e.id === newItem.id ? newItem : e))
            setIsEditOpen(false)
            toast.success("Entry updated successfully")
        } else {
            setEntries([newItem, ...entries])
            setIsAddOpen(false)
            toast.success("Entry added successfully")
        }
    }

    const handleDelete = (id: string) => {
        setEntries(entries.filter(e => e.id !== id))
        toast.success("Entry deleted successfully")
    }

    const columns: ColumnDef<any>[] = [
        {
            id: "index",
            header: "#",
            cell: ({ row }) => <span className="text-zinc-500 font-medium">{row.index + 1}</span>,
        },
        {
            accessorKey: "name",
            header: "Item Name",
            cell: ({ row }) => <span className="font-bold text-zinc-800">{row.original.name}</span>
        },
        {
            accessorKey: "category",
            header: "Category",
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
                <div className="flex items-center gap-3 text-sm">
                    <button onClick={() => { setSelectedItem(row.original); setIsViewOpen(true); }} className="text-zinc-600 hover:text-zinc-900 font-medium hover:underline">View</button>
                    <button onClick={() => { setSelectedItem(row.original); setIsEditOpen(true); }} className="text-indigo-600 hover:underline font-medium">Edit</button>
                    <button onClick={() => handleDelete(row.original.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                </div>
            ),
        },
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
                            
                            <Tabs defaultValue="individual" className="w-full mt-4">
                                <TabsList className="grid grid-cols-2 w-full mb-6 bg-zinc-100">
                                    <TabsTrigger value="individual">Individual item</TabsTrigger>
                                    <TabsTrigger value="sub-assembly">Sub Assembly</TabsTrigger>
                                </TabsList>

                                <div className="relative">
                                    <TabsContent value="individual" className="mt-0 outline-none">
                                        <NewItemForm onSuccess={(i) => handleSuccess(i, false)} categoriesMaster={categoriesMaster} setCategoriesMaster={setCategoriesMaster} />
                                    </TabsContent>

                                    <TabsContent value="sub-assembly" className="mt-0 outline-none">
                                        <CompositeItemForm title="Add new Sub Assembly" isSubAssembly={true} onSuccess={(i) => handleSuccess(i, false)} categoriesMaster={categoriesMaster} setCategoriesMaster={setCategoriesMaster} />
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
                            initialData={selectedItem} 
                            onSuccess={(i) => handleSuccess(i, true)} 
                            categoriesMaster={categoriesMaster} 
                            setCategoriesMaster={setCategoriesMaster} 
                        />
                    )}
                    {selectedItem && selectedItem.type === "Sub Assembly" && (
                        <CompositeItemForm 
                            initialData={selectedItem} 
                            title="Edit Sub Assembly" 
                            isSubAssembly={true} 
                            onSuccess={(i) => handleSuccess(i, true)} 
                            categoriesMaster={categoriesMaster} 
                            setCategoriesMaster={setCategoriesMaster} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function NewItemForm({ onSuccess, initialData, categoriesMaster, setCategoriesMaster }: { onSuccess: (item: any) => void, initialData?: any, categoriesMaster: any[], setCategoriesMaster: any }) {
    const [selectedCategories, setSelectedCategories] = useState<number[]>(initialData?.categoryId ? [initialData.categoryId] : [])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const categoryName = selectedCategories.length > 0 
            ? categoriesMaster.find(c => c.slno === selectedCategories[0])?.categoryName || "General"
            : "General"

        const newItem = {
            id: initialData?.id || Date.now().toString(),
            name: formData.get("name") || "Unknown Item",
            category: categoryName,
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
        onSuccess(newItem)
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
                    <Select name="unit" defaultValue={initialData?.unit || "pcs"}>
                        <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select a unit" /></SelectTrigger>
                        <SelectContent><SelectItem value="pcs">Pieces</SelectItem><SelectItem value="kg">Kilograms</SelectItem><SelectItem value="ltr">Liters</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5 relative z-50">
                    <Label className="text-sm font-medium">Class/Category</Label>
                    <CreatableCategorySelect
                        categories={categoriesMaster}
                        selectedIds={selectedCategories}
                        onChange={setSelectedCategories}
                        onCategoryCreated={(newCat) => setCategoriesMaster((prev: any) => [newCat, ...prev])}
                        companyId={null}
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
                        <Select name="gst" defaultValue={initialData?.gst || "18"}>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent><SelectItem value="5">5%</SelectItem><SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">IGST rate %</Label>
                        <Select name="igst" defaultValue={initialData?.igst || "18"}>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent><SelectItem value="5">5%</SelectItem><SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem></SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium block">Annexure</Label>
                <span className="text-xs text-zinc-500 block mb-2">Click below to add, edit or view the annexure for this item.</span>
                <Button type="button" variant="outline" className="w-full text-zinc-700 border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm border-dashed">
                    <Plus className="w-4 h-4 mr-2" /> Add Annexure
                </Button>
            </div>

            <div className="space-y-1.5 pt-4">
                <Label className="text-sm font-medium block">Upload Item Images</Label>
                <span className="text-xs text-zinc-500 block mb-3 leading-relaxed">
                    Upload your product images here. Accepted formats: <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.png</span> and <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.jpg</span><br />
                    Maximum file size: <span className="text-blue-600 font-medium">10MB</span>
                </span>
                <Button type="button" variant="outline" className="w-full border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm">
                    <Upload className="w-4 h-4 mr-2 text-zinc-600" /> Upload
                </Button>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-zinc-200">
                {initialData && <Button type="button" variant="outline" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))}>Cancel</Button>}
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-8 font-semibold rounded-lg">{initialData ? "Save Changes" : "Save Item"}</Button>
            </div>
        </form>
    )
}

function CompositeItemForm({ title, isSubAssembly = false, onSuccess, initialData, categoriesMaster, setCategoriesMaster }: { title: string, isSubAssembly?: boolean, onSuccess: (item: any) => void, initialData?: any, categoriesMaster: any[], setCategoriesMaster: any }) {
    const [components, setComponents] = useState<{ id: number, name: string, qty: string, rate: string, total: string }[]>([])
    const [selectedCategories, setSelectedCategories] = useState<number[]>(initialData?.categoryId ? [initialData.categoryId] : [])

    const addComponent = () => {
        setComponents([...components, { id: Date.now(), name: "", qty: "1", rate: "0.00", total: "0.00" }])
    }

    const removeComponent = (id: number) => {
        setComponents(components.filter(c => c.id !== id))
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const categoryName = selectedCategories.length > 0 
            ? categoriesMaster.find(c => c.slno === selectedCategories[0])?.categoryName || "Assemblies"
            : "Assemblies"

        const newItem = {
            id: initialData?.id || Date.now().toString(),
            name: formData.get("name") || "Unknown Assembly",
            category: categoryName,
            categoryId: selectedCategories[0],
            hsnCode: formData.get("hsnCode"),
            description: formData.get("description"),
            quantity: initialData?.quantity || 1, // Defaulting to 1 for new assemblies
            unit: formData.get("unit") || "pcs",
            rate: parseFloat(formData.get("price") as string) || 0,
            gst: formData.get("gst"),
            igst: formData.get("igst"),
            type: "Sub Assembly"
        }
        onSuccess(newItem)
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
                    <Select name="unit" defaultValue={initialData?.unit || "pcs"}>
                        <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select a unit" /></SelectTrigger>
                        <SelectContent><SelectItem value="pcs">Pieces</SelectItem></SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5 relative z-50">
                    <Label className="text-sm font-medium">Class/Category</Label>
                    <CreatableCategorySelect
                        categories={categoriesMaster}
                        selectedIds={selectedCategories}
                        onChange={setSelectedCategories}
                        onCategoryCreated={(newCat) => setCategoriesMaster((prev: any) => [newCat, ...prev])}
                        companyId={null}
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
                            <div className="flex-1">Item Name</div>
                            <div className="w-20 text-center">Qty</div>
                            <div className="w-24 text-right">Rate</div>
                            <div className="w-24 text-right pr-6">Total</div>
                        </div>
                        <div className="space-y-2">
                            {components.map(c => (
                                <div key={c.id} className="flex items-center gap-2 group">
                                    <div className="flex-1">
                                        <Select>
                                            <SelectTrigger className="h-9 bg-white shadow-sm border-zinc-200"><SelectValue placeholder="Select Item" /></SelectTrigger>
                                            <SelectContent><SelectItem value="sub1">Raw Material A</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-20">
                                        <Input defaultValue={c.qty} className="h-9 text-center bg-white shadow-sm border-zinc-200" />
                                    </div>
                                    <div className="w-24 text-right pr-2 font-medium text-sm text-zinc-600 block line-clamp-1">{c.rate}</div>
                                    <div className="w-24 text-right pr-2 font-bold text-sm text-zinc-800 block line-clamp-1">{c.total}</div>
                                    <div className="w-6 flex justify-end">
                                        <button type="button" onClick={() => removeComponent(c.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                            <MinusCircle className="w-5 h-5 fill-red-500 text-white" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" className="w-full mt-4 bg-white border-dashed border-zinc-300 text-zinc-600 shadow-sm" onClick={addComponent}>
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
                <Button type="button" variant="outline" className="w-full text-zinc-700 border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm border-dashed">
                    <Plus className="w-4 h-4 mr-2" /> Add Annexure
                </Button>
            </div>

            <div className="space-y-1.5 pt-4">
                <Label className="text-sm font-medium block">Upload Item Images</Label>
                <span className="text-xs text-zinc-500 block mb-3 leading-relaxed">
                    Upload your product images here. Accepted formats: <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.png</span> and <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.jpg</span><br />
                    Maximum file size: <span className="text-blue-600 font-medium">10MB</span>
                </span>
                <Button type="button" variant="outline" className="w-full border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm">
                    <Upload className="w-4 h-4 mr-2 text-zinc-600" /> Upload
                </Button>
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
