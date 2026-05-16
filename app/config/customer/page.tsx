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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { CreatableCategorySelect } from "@/components/ui/creatable-category-select"

type Customer = {
    slno: number;
    companyId: string | null;
    customerName: string;
    paymentType?: { slno: number, paymentType: string };
    paymentTypeId?: number;
    categories: any[];
    isActive: boolean;
    remarks: string;
    usb: string;
    company?: { name: string };
    contacts: any[];
    addresses: any[];
}

export default function CustomerConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [companies, setCompanies] = useState<any[]>([])
    const [categoriesMaster, setCategoriesMaster] = useState<{ slno: number, categoryName: string }[]>([])
    const [paymentTypes, setPaymentTypes] = useState<{ slno: number, paymentType: string }[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editItem, setEditItem] = useState<Customer | null>(null)

    // Dynamic arrays
    const [contacts, setContacts] = useState<any[]>([{ id: Date.now(), contactPerson: "", contactEmail: "", contactNumber: "" }])
    const [addresses, setAddresses] = useState<any[]>([{ id: Date.now(), addressName: "", address: "" }])
    const [selectedCategories, setSelectedCategories] = useState<number[]>([])
    const [selectedPaymentType, setSelectedPaymentType] = useState<string>("")

    useEffect(() => {
        setHeaderInfo("Customer Master", "Configure and manage customers.")
    }, [setHeaderInfo])

    useEffect(() => {
        async function loadLookups() {
            try {
                const [compRes, pmtRes] = await Promise.all([
                    fetch("/api/companies").then(res => res.json()),
                    fetch("/api/config/payment-type").then(res => res.json())
                ])
                setCompanies(compRes || [])
                setPaymentTypes(pmtRes || [])
            } catch (e) { }
        }
        loadLookups()
    }, [])

    useEffect(() => {
        fetchData()
        fetchCategories()
    }, [selectedCompanyId])

    async function fetchCategories() {
        try {
            const qs = selectedCompanyId !== 'all' ? '?companyId=' + selectedCompanyId : '';
            const res = await fetch(`/api/config/customer-category${qs}`)
            if (res.ok) {
                const items = await res.json()
                setCategoriesMaster(items)
            }
        } catch (e) { }
    }

    async function fetchData() {
        setLoading(true)
        try {
            const qs = selectedCompanyId !== 'all' ? '?companyId=' + selectedCompanyId : '';
            const res = await fetch(`/api/config/customer${qs}`)
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

    // Init form state when editing
    useEffect(() => {
        if (editItem) {
            setContacts(editItem.contacts?.length ? editItem.contacts.map(c => ({ ...c, id: Math.random() })) : [{ id: Date.now(), contactPerson: "", contactEmail: "", contactNumber: "" }])
            setAddresses(editItem.addresses?.length ? editItem.addresses.map(a => ({ ...a, id: Math.random() })) : [{ id: Date.now(), addressName: "", address: "" }])
            setSelectedCategories(editItem.categories.map(c => c.slno))
            setSelectedPaymentType(editItem.paymentTypeId ? editItem.paymentTypeId.toString() : "none")
        } else {
            setContacts([{ id: Date.now(), contactPerson: "", contactEmail: "", contactNumber: "" }])
            setAddresses([{ id: Date.now(), addressName: "", address: "" }])
            setSelectedCategories([])
            setSelectedPaymentType("none")
        }
    }, [editItem, isAddOpen])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const payload = {
            slno: editItem ? editItem.slno : undefined,
            customerName: formData.get("customerName"),
            remarks: formData.get("remarks"),
            usb: formData.get("usb"),
            isActive: formData.get("isActive") === "on",
            companyId: formData.get("companyId") === "global" ? null : (formData.get("companyId") || null),
            paymentTypeId: selectedPaymentType && selectedPaymentType !== "none" ? parseInt(selectedPaymentType) : null,
            categories: selectedCategories,
            contacts: contacts.filter(c => c.contactPerson),
            addresses: addresses.filter(a => a.addressName)
        }

        try {
            const res = await fetch("/api/config/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success(editItem ? "Customer updated" : "Customer created")
                setIsAddOpen(false)
                setEditItem(null)
                fetchData()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to save")
            }
        } catch (error) {
            toast.error("Error saving customer")
        }
    }

    async function handleDelete(slno: number) {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            const res = await fetch(`/api/config/customer?slno=${slno}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Customer deleted")
                fetchData()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const columns: ColumnDef<Customer>[] = [
        { id: "index", header: "Sl No.", cell: ({ row }) => row.index + 1 },
        {
            accessorKey: "companyId",
            header: "Company",
            accessorFn: (row: any) => row.company?.name || "Global",
            cell: ({ row }) => {
                const companyName = row.original.company?.name;
                if (!companyName) return <span className="text-zinc-700 bg-zinc-100 px-2 py-1 rounded text-xs font-medium border border-zinc-200">Global</span>;
                return <span className="text-slate-700 font-medium">{companyName}</span>;
            }
        },
        {
            accessorKey: "customerName",
            header: ({ column }) => (<Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Customer Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button>),
            cell: ({ row }) => <span className="font-semibold text-emerald-700">{row.original.customerName}</span>
        },
        {
            id: "categories",
            header: "Categories",
            accessorFn: (row: any) => row.categories.map((c: any) => c.categoryName).join(", ") || "-",
            cell: ({ row }) => {
                const cats = row.original.categories.map((c: any) => c.categoryName).join(", ");
                return <span className="text-sm">{cats || "-"}</span>
            }
        },
        {
            accessorKey: "paymentType",
            header: "Payment Type",
            accessorFn: (row: any) => row.paymentType?.paymentType || "-",
            cell: ({ row }) => <span className="text-sm">{row.original.paymentType?.paymentType || "-"}</span>
        },
        {
            accessorKey: "isActive",
            header: "Status",
            accessorFn: (row: any) => row.isActive ? "Active" : "Inactive",
            cell: ({ row }) => <span className={row.original.isActive ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>{row.original.isActive ? "Active" : "Inactive"}</span>
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
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(row.original.slno)}><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative">
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
                        <Button size="sm" className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl transition-all font-semibold rounded-lg"><Plus className="w-4 h-4" /> Entry</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                        <DialogHeader><DialogTitle className="text-xl">{editItem ? "Edit Customer" : "Add New Customer"}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="space-y-2"><Label>Company Context <span className="text-red-500">*</span></Label>
                                <Select name="companyId" defaultValue={editItem?.companyId || "global"}>
                                    <SelectTrigger><SelectValue placeholder="Global Mapping" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">Global (All Companies)</SelectItem>
                                        {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Customer Name <span className="text-red-500">*</span></Label><Input name="customerName" defaultValue={editItem?.customerName} required /></div>
                                <div className="space-y-2"><Label>Payment Type</Label>
                                    <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                                        <SelectTrigger><SelectValue placeholder="Select Payment Type..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {paymentTypes.map(p => <SelectItem key={p.slno} value={p.slno.toString()}>{p.paymentType}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2 relative z-50">
                                <Label>Customer Categories <span className="text-red-500">*</span></Label>
                                <CreatableCategorySelect
                                    categories={categoriesMaster}
                                    selectedIds={selectedCategories}
                                    onChange={setSelectedCategories}
                                    onCategoryCreated={(newCat) => setCategoriesMaster(prev => [newCat, ...prev])}
                                    companyId={null} // Or use the selected global/specific context if required
                                />
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h3 className="font-semibold text-zinc-900 underline underline-offset-4 decoration-2 decoration-emerald-500">Contact Details</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setContacts([...contacts, { id: Date.now(), contactPerson: "", contactEmail: "", contactNumber: "" }])}><Plus className="mr-2 h-3 w-3" /> Add Contact</Button>
                                </div>
                                {contacts.map((c, i) => (
                                    <div key={c.id} className="grid grid-cols-3 gap-4 bg-zinc-50 p-4 border border-zinc-100 rounded-xl relative group">
                                        <div className="space-y-2"><Label className="text-xs">Person Name <span className="text-red-500">*</span></Label>
                                            <Input required value={c.contactPerson} onChange={e => setContacts(contacts.map(x => x.id === c.id ? { ...x, contactPerson: e.target.value } : x))} className="h-9" />
                                        </div>
                                        <div className="space-y-2"><Label className="text-xs">Email</Label>
                                            <Input type="email" value={c.contactEmail} onChange={e => setContacts(contacts.map(x => x.id === c.id ? { ...x, contactEmail: e.target.value } : x))} className="h-9" />
                                        </div>
                                        <div className="space-y-2"><Label className="text-xs">Number</Label>
                                            <Input type="tel" value={c.contactNumber} onChange={e => setContacts(contacts.map(x => x.id === c.id ? { ...x, contactNumber: e.target.value } : x))} className="h-9" />
                                        </div>
                                        {contacts.length > 1 && (
                                            <button type="button" onClick={() => setContacts(contacts.filter(item => item.id !== c.id))} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Addresses */}
                            <div className="space-y-4 mt-6">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h3 className="font-semibold text-zinc-900 underline underline-offset-4 decoration-2 decoration-emerald-500">Addresses</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setAddresses([...addresses, { id: Date.now(), addressName: "", address: "" }])}><Plus className="mr-2 h-3 w-3" /> Add Address</Button>
                                </div>
                                {addresses.map((a, i) => (
                                    <div key={a.id} className="space-y-4 bg-zinc-50 p-4 border border-zinc-100 rounded-xl relative group">
                                        <div className="space-y-2"><Label className="text-xs">Address Name (e.g. Shipping) <span className="text-red-500">*</span></Label>
                                            <Input required value={a.addressName} onChange={e => setAddresses(addresses.map(x => x.id === a.id ? { ...x, addressName: e.target.value } : x))} className="h-9" />
                                        </div>
                                        <div className="space-y-2"><Label className="text-xs">Full Address <span className="text-red-500">*</span></Label>
                                            <Textarea required value={a.address} onChange={e => setAddresses(addresses.map(x => x.id === a.id ? { ...x, address: e.target.value } : x))} className="resize-none" rows={3} />
                                        </div>
                                        {addresses.length > 1 && (
                                            <button type="button" onClick={() => setAddresses(addresses.filter(item => item.id !== a.id))} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>USB (Unique Selling Proposition)</Label><Input name="usb" defaultValue={editItem?.usb} /></div>
                                <div className="space-y-2"><Label>Remarks</Label><Input name="remarks" defaultValue={editItem?.remarks} /></div>
                            </div>
                            <div className="flex items-center justify-between border-t pt-4"><Label className="font-semibold text-sm">Active Status</Label><Switch name="isActive" defaultChecked={editItem ? editItem.isActive : true} /></div>
                            <div className="flex justify-end pt-4"><Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800">{editItem ? "Update Customer" : "Create Customer"}</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-2 shadow-sm">
                <DataTable 
                columns={columns} 
                data={data} 
                searchKey="customerName" 
                reportName="Config - Customer Report" 
                fileName="insight-config" 
            />
            </div>
        </div>
    )
}
