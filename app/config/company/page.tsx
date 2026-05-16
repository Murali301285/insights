"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash, ArrowUpDown, Check, X, Eye, Layout, FileJson, Settings2, CheckCircle, Landmark } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DocumentTemplateBuilder } from "@/components/ops/shared/DocumentTemplateBuilder"
import { CompanyBankManager } from "@/components/ops/shared/CompanyBankManager"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type DynamicField = {
    id: string;
    fieldName: string;
    isMultiline: boolean;
    details: string;
}

type Company = {
    id: string
    name: string
    code: string
    description?: string
    logo?: string
    colorIndicator?: string
    contactPerson?: string
    address?: string
    contactEmail?: string
    contactPhone?: string
    registrationNumber?: string
    dynamicDetails?: DynamicField[] | any
    signature?: string
    seal?: string
    conditions?: string
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    branch?: string
    accountName?: string
    DocumentTemplates?: any[]
    isBlocked: boolean
    createdAt: string
}

const TEMPLATE_PRESETS = [
    { id: 'industrial', name: 'Industrial Pro', style: 'traditional', color: 'slate' },
    { id: 'modern', name: 'Modern Minimal', style: 'clean', color: 'emerald' },
    { id: 'corporate', name: 'Corporate Blue', style: 'structured', color: 'blue' },
    { id: 'compact', name: 'Compact Grid', style: 'dense', color: 'zinc' },
    { id: 'executive', name: 'Executive Gold', style: 'premium', color: 'amber' }
];

export default function CompanyConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    
    // Template Builder States
    const [isTemplateOpen, setIsTemplateOpen] = useState(false)
    const [activeTemplateCompany, setActiveTemplateCompany] = useState<Company | null>(null)

    // Bank Management States
    const [isBankOpen, setIsBankOpen] = useState(false)
    const [activeBankCompany, setActiveBankCompany] = useState<Company | null>(null)

    // Dynamic Fields state for Add/Edit Form
    const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([])
    const [tempKey, setTempKey] = useState('')
    const [tempMultiline, setTempMultiline] = useState(false)
    const [tempValue, setTempValue] = useState('')
    const [editingDynamicId, setEditingDynamicId] = useState<string | null>(null)

    useEffect(() => {
        setHeaderInfo("Company Management", "Configure and manage organization entities.")
        fetchCompanies()
    }, [setHeaderInfo])

    async function fetchCompanies() {
        setLoading(true)
        try {
            const res = await fetch("/api/companies")
            if (res.ok) {
                const companies = await res.json()
                setData(companies)
            }
        } catch (error) {
            toast.error("Failed to fetch companies")
        } finally {
            setLoading(false)
        }
    }

    const handleAddDynamicField = (e: React.MouseEvent) => {
        e.preventDefault()
        if (!tempKey.trim() || !tempValue.trim()) return;

        if (editingDynamicId) {
            setDynamicFields(prev => prev.map(f => f.id === editingDynamicId ? {
                ...f, fieldName: tempKey, isMultiline: tempMultiline, details: tempValue
            } : f))
            setEditingDynamicId(null)
        } else {
            setDynamicFields(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                fieldName: tempKey,
                isMultiline: tempMultiline,
                details: tempValue
            }])
        }
        
        // Reset
        setTempKey('')
        setTempValue('')
        setTempMultiline(false)
    }

    const editDynamicField = (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        const field = dynamicFields.find(f => f.id === id)
        if (field) {
            setTempKey(field.fieldName)
            setTempMultiline(field.isMultiline)
            setTempValue(field.details)
            setEditingDynamicId(field.id)
        }
    }

    const deleteDynamicField = (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        setDynamicFields(prev => prev.filter(f => f.id !== id))
    }

    const openAddDialog = () => {
        setDynamicFields([])
        setIsAddOpen(true)
    }

    const openEditDialog = (company: Company) => {
        let parsedDetails = []
        try {
            if (company.dynamicDetails) {
                parsedDetails = typeof company.dynamicDetails === 'string' 
                    ? JSON.parse(company.dynamicDetails) 
                    : company.dynamicDetails;
            }
        } catch(e) {}
        
        setDynamicFields(parsedDetails || [])
        setEditingCompany(company)
        setIsEditOpen(true)
    }

    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const payload: any = Object.fromEntries(formData)
        
        payload.dynamicDetails = dynamicFields;
        payload.isBlocked = payload.isActive !== 'on';
        if (typeof payload.isBlocked !== 'boolean') {
            payload.isBlocked = payload.isBlocked === 'true';
        }
        delete payload.isActive; // frontend only

        try {
            const res = await fetch("/api/companies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success("Company created")
                setIsAddOpen(false)
                fetchCompanies()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to create company")
            }
        } catch (error) {
            toast.error("Error creating company: Connection lost or request too large")
        }
    }

    async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!editingCompany) return;
        const formData = new FormData(e.currentTarget)
        const payload: any = Object.fromEntries(formData)

        payload.dynamicDetails = dynamicFields;
        payload.isBlocked = payload.isActive !== 'on';
        if (typeof payload.isBlocked !== 'boolean') {
            payload.isBlocked = payload.isBlocked === 'true';
        }
        delete payload.isActive;

        try {
            const res = await fetch("/api/companies", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingCompany.id, ...payload })
            })
            if (res.ok) {
                toast.success("Company updated successfully")
                setIsEditOpen(false)
                setEditingCompany(null)
                fetchCompanies()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to update company")
            }
        } catch (error) {
            toast.error("Error updating company: Connection lost or request too large")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            const res = await fetch(`/api/companies?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Company deleted")
                fetchCompanies()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const FormContent = ({ defaultData }: { defaultData?: Company }) => {
        const [logoPreview, setLogoPreview] = useState(defaultData?.logo || "")
        const [sigPreview, setSigPreview] = useState(defaultData?.signature || "")
        const [sealPreview, setSealPreview] = useState(defaultData?.seal || "")

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
            const file = e.target.files?.[0]
            if (file) {
                if (file.size > 3 * 1024 * 1024) {
                    toast.error("File size must be less than 3MB (Server limit)")
                    e.target.value = ""
                    return
                }
                const reader = new FileReader()
                reader.onloadend = () => {
                    setter(reader.result as string)
                }
                reader.readAsDataURL(file)
            }
        }

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Company Name <span className="text-red-500">*</span></Label>
                        <Input name="name" required defaultValue={defaultData?.name} />
                    </div>
                    <div className="space-y-2">
                        <Label>Code <span className="text-red-500">*</span></Label>
                        <Input name="code" required defaultValue={defaultData?.code} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>Registration Number (GST/Tax ID)</Label>
                        <Input name="registrationNumber" defaultValue={defaultData?.registrationNumber} placeholder="e.g. 29AAAAA0000A1Z5" />
                    </div>
                    
                    <div className="space-y-2 col-span-2 mt-4">
                        <Label>Description</Label>
                        <Textarea name="description" className="resize-none" rows={2} defaultValue={defaultData?.description} />
                    </div>
                </div>

                {/* Bank Details Section */}
                <div className="space-y-4 border-t pt-4">
                    <Label className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Bank Account Details (For Invoicing)</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Bank Name</Label>
                            <Input name="bankName" defaultValue={defaultData?.bankName} placeholder="e.g. HDFC Bank" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Account Name</Label>
                            <Input name="accountName" defaultValue={defaultData?.accountName} placeholder="As per bank records" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Account Number</Label>
                            <Input name="accountNumber" defaultValue={defaultData?.accountNumber} placeholder="0000 0000 0000" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">IFSC Code</Label>
                            <Input name="ifscCode" defaultValue={defaultData?.ifscCode} placeholder="HDFC0001234" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label className="text-xs">Branch Address</Label>
                            <Input name="branch" defaultValue={defaultData?.branch} placeholder="Branch name and city" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                    {/* Upload Section */}
                    <div className="grid grid-cols-3 gap-4 border p-4 rounded-xl bg-zinc-50/30">
                        <div className="space-y-2">
                            <Label className="text-xs">Company Logo</Label>
                            <Input type="file" accept="image/png,image/jpeg" onChange={(e) => handleFileChange(e, setLogoPreview)} className="h-8 text-[10px]" />
                            <input type="hidden" name="logo" value={logoPreview} />
                            {logoPreview && (
                                <div className="mt-2 h-16 w-16 border rounded bg-white p-1 flex items-center justify-center overflow-hidden">
                                    <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Authorized Signature</Label>
                            <Input type="file" accept="image/png,image/jpeg" onChange={(e) => handleFileChange(e, setSigPreview)} className="h-8 text-[10px]" />
                            <input type="hidden" name="signature" value={sigPreview} />
                            {sigPreview && (
                                <div className="mt-2 h-16 w-16 border rounded bg-white p-1 flex items-center justify-center overflow-hidden">
                                    <img src={sigPreview} alt="Signature" className="max-h-full max-w-full object-contain" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Official Seal</Label>
                            <Input type="file" accept="image/png,image/jpeg" onChange={(e) => handleFileChange(e, setSealPreview)} className="h-8 text-[10px]" />
                            <input type="hidden" name="seal" value={sealPreview} />
                            {sealPreview && (
                                <div className="mt-2 h-16 w-16 border rounded bg-white p-1 flex items-center justify-center overflow-hidden">
                                    <img src={sealPreview} alt="Seal" className="max-h-full max-w-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Conditions (Terms & Conditions)</Label>
                        <Textarea 
                            name="conditions" 
                            className="min-h-[120px] font-mono text-sm" 
                            placeholder="Enter conditions here... Use **text** for bold and # for headings."
                            defaultValue={defaultData?.conditions} 
                        />
                        <p className="text-[10px] text-zinc-500 italic">Supports basic formatting like bold and headings.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Color Indicator</Label>
                            <Input name="colorIndicator" type="color" className="h-10 p-1 cursor-pointer w-full" defaultValue={defaultData?.colorIndicator || "#10b981"} />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Person</Label>
                            <Input name="contactPerson" defaultValue={defaultData?.contactPerson} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label>Contact Email</Label>
                             <Input name="contactEmail" type="email" defaultValue={defaultData?.contactEmail} />
                        </div>
                        <div className="space-y-2">
                             <Label>Contact Phone</Label>
                             <Input name="contactPhone" type="text" defaultValue={defaultData?.contactPhone} />
                        </div>
                    </div>

                    <div className="space-y-2">
                         <Label>Address</Label>
                         <Textarea name="address" className="min-h-[80px]" rows={3} defaultValue={defaultData?.address} />
                    </div>
                    
                    <div className="space-y-2 flex items-center gap-4 border p-4 rounded-xl bg-zinc-50/50">
                        <Label className="mt-2 text-sm font-medium">Status Active?</Label>
                        <Switch name="isActive" defaultChecked={defaultData ? !defaultData.isBlocked : true} />
                    </div>

                    {/* Dynamic Details block */}
                    <div className="mt-6 border-t pt-6 space-y-4">
                        <Label className="text-sm font-medium">Additional Details (Dynamic)</Label>
                        <div className="flex gap-2 items-start border p-3 rounded-xl bg-zinc-50 border-zinc-200 shadow-sm relative">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Input placeholder="Field Name" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="h-8 text-sm" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">Multiline?</Label>
                                        <Switch checked={tempMultiline} onCheckedChange={setTempMultiline} />
                                    </div>
                                </div>
                                <div>
                                    {tempMultiline ? (
                                        <Textarea placeholder="Details" rows={2} value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="text-sm min-h-[60px]" />
                                    ) : (
                                        <Input placeholder="Details" value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="h-8 text-sm" />
                                    )}
                                </div>
                            </div>
                            <Button type="button" size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 mt-0.5" onClick={handleAddDynamicField}>
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>

                        {dynamicFields.length > 0 && (
                            <div className="space-y-2 mt-4 max-h-[150px] overflow-y-auto pr-2 rounded-lg scrollbar-thin">
                                {dynamicFields.map(field => (
                                    <div key={field.id} className="flex gap-4 items-center p-2.5 bg-white border border-zinc-200 shadow-sm rounded-lg relative group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs uppercase font-bold text-zinc-500">{field.fieldName}</p>
                                            <p className="text-sm text-zinc-900 truncate">{field.details}</p>
                                        </div>
                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={(e) => editDynamicField(field.id, e)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600 bg-red-50 hover:bg-red-100" onClick={(e) => deleteDynamicField(field.id, e)}>
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const columns: ColumnDef<Company>[] = [
        { id: "index", header: "Sl No.", cell: ({ row }) => row.index + 1 },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Company Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const isBlocked = row.original.isBlocked
                return (
                <HoverCard>
                    <HoverCardTrigger asChild>
                        <span className="cursor-pointer font-medium hover:underline text-emerald-700">{row.original.name}</span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64" side="right">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                {/* Color indicator */}
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.original.colorIndicator || '#10b981' }} />
                                <h4 className="text-sm font-semibold">{row.original.name}</h4>
                            </div>
                            <div className="text-xs text-muted-foreground pb-2 border-b border-zinc-100">
                                <p><span className="font-semibold text-zinc-700">Code:</span> {row.original.code || "N/A"}</p>
                                <p><span className="font-semibold text-zinc-700">Email:</span> {row.original.contactEmail || "N/A"}</p>
                                <p><span className="font-semibold text-zinc-700">Status:</span> 
                                    <span className={isBlocked ? "text-red-500 ml-1 font-medium" : "text-emerald-500 ml-1 font-medium"}>
                                        {isBlocked ? "Inactive" : "Active"}
                                    </span>
                                </p>
                            </div>
                            {row.original.description && (
                                <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed mt-2">{row.original.description}</p>
                            )}
                        </div>
                    </HoverCardContent>
                </HoverCard>
            )}
        },
        { accessorKey: "code", header: "Code" },
        { accessorKey: "contactPerson", header: "Contact Person" },
        { accessorKey: "contactEmail", header: "Email" },
        {
            accessorKey: "isBlocked",
            accessorFn: (row) => row.isBlocked ? "Inactive" : "Active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = !row.original.isBlocked
                return (
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className={isActive ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>
                        {isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            )}
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const company = row.original
                return (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="View Details" onClick={() => openEditDialog(company)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Edit" onClick={() => openEditDialog(company)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Manage Templates" onClick={() => { setActiveTemplateCompany(company); setIsTemplateOpen(true); }}>
                            <Layout className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Bank Details" onClick={() => { setActiveBankCompany(company); setIsBankOpen(true); }}>
                            <Landmark className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Delete" onClick={() => handleDelete(company.id)}>
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center">
                {/* Header label 'Companies' successfully removed from UI as requested (removed from top-left mapping) */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openAddDialog}>
                            <Plus className="mr-2 h-4 w-4" /> Add Company
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto hidden-scrollbar">
                        <DialogHeader>
                            <DialogTitle>Add New Company</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-6 pb-2">
                            <FormContent />
                            <div className="flex justify-end border-t pt-4">
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto mt-2">
                                    Save Company Entry
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto hidden-scrollbar">
                    <DialogHeader>
                        <DialogTitle>Edit Company Documentation</DialogTitle>
                    </DialogHeader>
                    {editingCompany && (
                        <form onSubmit={handleEdit} className="space-y-6 pb-2">
                            <FormContent defaultData={editingCompany} />
                            <div className="flex justify-end border-t pt-4">
                                <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 mt-2">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <DataTable 
                columns={columns} 
                data={data} 
                searchKey="name" 
                reportName="Config - Company Report" 
                fileName="insight-config" 
            />

            {activeTemplateCompany && (
                <DocumentTemplateBuilder 
                    open={isTemplateOpen} 
                    onOpenChange={setIsTemplateOpen} 
                    company={activeTemplateCompany} 
                />
            )}

            {activeBankCompany && (
                <CompanyBankManager 
                    open={isBankOpen} 
                    onOpenChange={setIsBankOpen} 
                    company={activeBankCompany} 
                />
            )}
        </div>
    )
}
