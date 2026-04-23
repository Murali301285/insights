"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Upload, X, MinusCircle } from "lucide-react"

export default function InventoryPage() {
    const { setHeaderInfo } = useHeader()

    useEffect(() => {
        setHeaderInfo("Inventory Settings", "Manage new items, composite items natively")
    }, [setHeaderInfo])

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Tabs defaultValue="new-item" className="w-full">
                <TabsList className="grid grid-cols-3 w-[500px] mb-6">
                    <TabsTrigger value="new-item">New item</TabsTrigger>
                    <TabsTrigger value="wip">Work In progress</TabsTrigger>
                    <TabsTrigger value="sub-assembly">Sub Assembly</TabsTrigger>
                </TabsList>

                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 lg:p-8 relative">
                    <TabsContent value="new-item" className="mt-0 outline-none">
                        <NewItemForm />
                    </TabsContent>

                    <TabsContent value="wip" className="mt-0 outline-none">
                        <CompositeItemForm title="Add new composite item" isWIP={true} />
                    </TabsContent>

                    <TabsContent value="sub-assembly" className="mt-0 outline-none">
                        <CompositeItemForm title="Add new Sub Assembly" isSubAssembly={true} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function NewItemForm() {
    return (
        <form className="space-y-5 animate-in fade-in duration-300 relative">
            <h2 className="text-[17px] font-semibold text-zinc-800 mb-6 border-b border-zinc-100 pb-4">Add new item</h2>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Item Name <span className="text-red-500">*</span></Label>
                <Input placeholder="Enter item name" required className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">HSN/SAC Code <span className="text-red-500">*</span></Label>
                <Input placeholder="" required className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Item Description</Label>
                <Textarea placeholder="Enter the item description here..." className="min-h-[100px] resize-y border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Quantity <span className="text-red-500">*</span></Label>
                <Input type="number" defaultValue="0" required className="h-10 border-zinc-200" />
                <p className="text-xs text-zinc-500 mt-1">Quantity is automatically managed through GRNs</p>
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Unit</Label>
                <Select>
                    <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select a unit" /></SelectTrigger>
                    <SelectContent><SelectItem value="pcs">Pieces</SelectItem><SelectItem value="kg">Kilograms</SelectItem><SelectItem value="ltr">Liters</SelectItem></SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Class/Category</Label>
                <Input placeholder="Select or type to create a category" className="h-10 border-zinc-200" />
            </div>

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
                    <Input placeholder="" required className="pl-7 h-10 border-zinc-200" />
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium">Tax Percentage</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">GST rate %</Label>
                        <Select>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent><SelectItem value="5">5%</SelectItem><SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">IGST rate %</Label>
                        <Select>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent><SelectItem value="5">5%</SelectItem><SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem></SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium">Location</Label>
                <Select defaultValue="unspecified">
                    <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Unspecified Location" /></SelectTrigger>
                    <SelectContent><SelectItem value="unspecified">Unspecified Location</SelectItem></SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium block">Annexure</Label>
                <span className="text-xs text-zinc-500 block mb-2">Click below to add, edit or view the annexure for this item.</span>
                <Button variant="outline" className="w-full text-zinc-700 border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm border-dashed">
                    <Plus className="w-4 h-4 mr-2" /> Add Annexure
                </Button>
            </div>

            <div className="space-y-1.5 pt-4">
                <Label className="text-sm font-medium block">Upload Item Images</Label>
                <span className="text-xs text-zinc-500 block mb-3 leading-relaxed">
                    Upload your product images here. Accepted formats: <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.png</span> and <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.jpg</span><br />
                    Maximum file size: <span className="text-blue-600 font-medium">10MB</span>
                </span>
                <Button variant="outline" className="w-full border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm">
                    <Upload className="w-4 h-4 mr-2 text-zinc-600" /> Upload
                </Button>
            </div>

            <div className="pt-6 flex justify-end">
                <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-8 font-semibold rounded-lg">Save Item</Button>
            </div>
        </form>
    )
}

function CompositeItemForm({ title, isWIP = false, isSubAssembly = false }: { title: string, isWIP?: boolean, isSubAssembly?: boolean }) {
    const [components, setComponents] = useState<{ id: number, name: string, qty: string, rate: string, total: string }[]>([])

    const addComponent = () => {
        setComponents([...components, { id: Date.now(), name: "", qty: "1", rate: "0.00", total: "0.00" }])
    }

    const removeComponent = (id: number) => {
        setComponents(components.filter(c => c.id !== id))
    }

    return (
        <form className="space-y-5 animate-in fade-in duration-300 relative">
            <h2 className="text-[17px] font-semibold text-zinc-800 mb-6 border-b border-zinc-100 pb-4">{title}</h2>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Item Name <span className="text-red-500">*</span></Label>
                <Input placeholder={isSubAssembly ? "Enter Sub Assembly name" : "Enter item name"} required className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">HSN/SAC Code <span className="text-red-500">*</span></Label>
                <Input placeholder="" required className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Item Description</Label>
                <Textarea placeholder="Enter the item description here..." className="min-h-[100px] resize-y border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Unit</Label>
                <Select>
                    <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select a unit" /></SelectTrigger>
                    <SelectContent><SelectItem value="pcs">Pieces</SelectItem></SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Class/Category</Label>
                <Input placeholder="Select or type to create a category" className="h-10 border-zinc-200" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Purchase Price</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                    <Input placeholder="" className="pl-7 h-10 border-zinc-200" />
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

            <div className="space-y-1.5">
                <Label className="text-sm font-medium">Selling Price <span className="text-red-500">*</span></Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                    <Input placeholder="" required className="pl-7 h-10 border-zinc-200" />
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium">Tax Percentage</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">GST rate %</Label>
                        <Select>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent><SelectItem value="18">18%</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-700">IGST rate %</Label>
                        <Select>
                            <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent><SelectItem value="18">18%</SelectItem></SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium">Location</Label>
                <Select defaultValue="unspecified">
                    <SelectTrigger className="h-10 border-zinc-200"><SelectValue placeholder="Unspecified Location" /></SelectTrigger>
                    <SelectContent><SelectItem value="unspecified">Unspecified Location</SelectItem></SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5 pt-2">
                <Label className="text-sm font-medium block">Annexure</Label>
                <span className="text-xs text-zinc-500 block mb-2">Click below to add, edit or view the annexure for this item.</span>
                <Button variant="outline" className="w-full text-zinc-700 border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm border-dashed">
                    <Plus className="w-4 h-4 mr-2" /> Add Annexure
                </Button>
            </div>

            <div className="space-y-1.5 pt-4">
                <Label className="text-sm font-medium block">Upload Item Images</Label>
                <span className="text-xs text-zinc-500 block mb-3 leading-relaxed">
                    Upload your product images here. Accepted formats: <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.png</span> and <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">.jpg</span><br />
                    Maximum file size: <span className="text-blue-600 font-medium">10MB</span>
                </span>
                <Button variant="outline" className="w-full border-zinc-200 h-10 font-medium bg-white hover:bg-zinc-50 shadow-sm">
                    <Upload className="w-4 h-4 mr-2 text-zinc-600" /> Upload
                </Button>
            </div>

            <div className="pt-6 flex justify-end">
                <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-8 font-semibold rounded-lg">
                    Save {isSubAssembly ? "Sub Assembly" : "Item"}
                </Button>
            </div>
        </form>
    )
}
