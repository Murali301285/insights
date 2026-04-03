"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash, Ban, ArrowUpDown } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Types
type Contact = {
    contactPerson: string
    contactEmail: string
    contactNumber: string
}

type Address = {
    addressName: string
    address: string
}

type Supplier = {
    slno: number
    companyId: string | null
    supplierName: string
    remarks: string | null
    usb: string | null
    isActive: boolean
    paymentTypeId: number | null
    paymentType?: { paymentType: string } | null
    categories: { slno: number; categoryName: string }[]
    contacts: Contact[]
    addresses: Address[]
}

type CategoryItem = { slno: number, categoryName: string }
type PaymentItem = { slno: number, paymentType: string }

export default function SupplierMasterPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<Supplier[]>([])
    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [paymentTypes, setPaymentTypes] = useState<PaymentItem[]>([])
    const [companies, setCompanies] = useState<any[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")

    // Form States
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editItem, setEditItem] = useState<Supplier | null>(null)
    const [contacts, setContacts] = useState<Contact[]>([{ contactPerson: "", contactEmail: "", contactNumber: "" }])
    const [addresses, setAddresses] = useState<Address[]>([{ addressName: "", address: "" }])
    const [selectedCategories, setSelectedCategories] = useState<number[]>([])

    useEffect(() => {
        setHeaderInfo("Supplier Master", "Configure and manage suppliers.")

        fetchLookups()
    }, [setHeaderInfo])

    useEffect(() => {
        async function loadCompanies() {
            try {
                const res = await fetch("/api/companies")
                if (res.ok) { const data = await res.json(); setCompanies(data); if (data.length > 0) { setSelectedCompanyId(data[0].id); } }
            } catch (e) { }
        }
        loadCompanies()
    }, [])

    useEffect(() => {
        fetchData()
    }, [selectedCompanyId])

    async function fetchLookups() {
        try {
            const [catRes, payRes] = await Promise.all([
                fetch("/api/config/category"),
                fetch("/api/config/payment-type")
            ])
            if (catRes.ok) setCategories(await catRes.json())
            if (payRes.ok) setPaymentTypes(await payRes.json())
        } catch (e) {
            console.error(e)
        }
    }

    async function fetchData() {
        try {
            const qs = selectedCompanyId !== 'all' ? '?companyId=' + selectedCompanyId : '';
            const res = await fetch(`/api/config/supplier${qs}`)
            if (res.ok) setData(await res.json())
        } catch (error) {
            toast.error("Failed to fetch data")
        }
    }

    // Handlers
    const addContact = () => setContacts([...contacts, { contactPerson: "", contactEmail: "", contactNumber: "" }])
    const removeContact = (index: number) => setContacts(contacts.filter((_, i) => i !== index))
    const updateContact = (index: number, field: keyof Contact, value: string) => {
        const newContacts = [...contacts]
        newContacts[index][field] = value
        setContacts(newContacts)
    }

    const addAddress = () => setAddresses([...addresses, { addressName: "", address: "" }])
    const removeAddress = (index: number) => setAddresses(addresses.filter((_, i) => i !== index))
    const updateAddress = (index: number, field: keyof Address, value: string) => {
        const newAddrs = [...addresses]
        newAddrs[index][field] = value
        setAddresses(newAddrs)
    }

    const toggleCategory = (slno: number) => {
        if (selectedCategories.includes(slno)) setSelectedCategories(selectedCategories.filter(id => id !== slno))
        else setSelectedCategories([...selectedCategories, slno])
    }

    const openEdit = (item: Supplier) => {
        setEditItem(item)
        setContacts(item.contacts.length ? item.contacts : [{ contactPerson: "", contactEmail: "", contactNumber: "" }])
        setAddresses(item.addresses.length ? item.addresses : [{ addressName: "", address: "" }])
        setSelectedCategories(item.categories.map(c => c.slno))
        setIsAddOpen(true)
    }

    const resetForm = () => {
        setEditItem(null)
        setContacts([{ contactPerson: "", contactEmail: "", contactNumber: "" }])
        setAddresses([{ addressName: "", address: "" }])
        setSelectedCategories([])
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const payload = {
            slno: editItem ? editItem.slno : undefined,
            supplierName: formData.get("supplierName"),
            remarks: formData.get("remarks"),
            usb: formData.get("usb"),
            isActive: formData.get("isActive") === "on",
            companyId: formData.get("companyId") === "global" ? null : (formData.get("companyId") || null),
            paymentTypeId: formData.get("paymentTypeId") ? parseInt(formData.get("paymentTypeId") as string) : null,
            categories: selectedCategories,
            contacts: contacts.filter(c => c.contactPerson.trim() !== ""),
            addresses: addresses.filter(a => a.addressName.trim() !== "" && a.address.trim() !== "")
        }

        try {
            const res = await fetch("/api/config/supplier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success(editItem ? "Supplier updated" : "Supplier created")
                setIsAddOpen(false)
                fetchData()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to save")
            }
        } catch (error) {
            toast.error("Error saving supplier")
        }
    }

    async function handleDelete(slno: number) {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            const res = await fetch(`/api/config/supplier?slno=${slno}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Supplier deleted")
                fetchData()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const columns: ColumnDef<Supplier>[] = [
        {
            id: "index",
            header: "Sl No.",
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "companyId",
            header: "Company",
            cell: ({ row }) => {
                const item = row.original as any;
                const companyName = item.company?.name;
                if (!companyName) return <span className="text-zinc-700 bg-zinc-100 px-2 py-1 rounded text-xs font-medium border border-zinc-200">Global</span>;
                const colors = [
                    "bg-blue-100 text-blue-700 border-blue-200",
                    "bg-purple-100 text-purple-700 border-purple-200",
                    "bg-amber-100 text-amber-700 border-amber-200",
                    "bg-emerald-100 text-emerald-700 border-emerald-200",
                    "bg-rose-100 text-rose-700 border-rose-200",
                    "bg-indigo-100 text-indigo-700 border-indigo-200",
                    "bg-cyan-100 text-cyan-700 border-cyan-200"
                ];
                let hash = 0;
                for (let i = 0; i < companyName.length; i++) hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
                const colorClass = colors[Math.abs(hash) % colors.length];
                return <span className={`px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>{companyName}</span>
            }
        },
        {
            accessorKey: "supplierName",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Supplier Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <span className="cursor-pointer font-medium hover:underline text-emerald-700">{item.supplierName}</span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80" side="right">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">{item.supplierName}</h4>
                                <div className="text-xs text-muted-foreground">
                                    <p><span className="font-semibold text-zinc-700">USB:</span> {item.usb || "N/A"}</p>
                                    <p><span className="font-semibold text-zinc-700">Remarks:</span> {item.remarks || "N/A"}</p>
                                </div>
                                {item.contacts.length > 0 && (
                                    <div className="pt-2 border-t text-xs">
                                        <span className="font-semibold text-zinc-700 block mb-1">Contacts:</span>
                                        {item.contacts.map((c, i) => (
                                            <div key={i} className="mb-1 text-muted-foreground">{c.contactPerson} ({c.contactNumber || "N/A"})</div>
                                        ))}
                                    </div>
                                )}
                                {item.addresses.length > 0 && (
                                    <div className="pt-2 border-t text-xs">
                                        <span className="font-semibold text-zinc-700 block mb-1">Addresses:</span>
                                        {item.addresses.map((a, i) => (
                                            <div key={i} className="mb-1 text-muted-foreground"><span className="font-medium">{a.addressName}:</span> {a.address}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                )
            }
        },
        {
            id: "categories",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Categories
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            accessorFn: (row) => row.categories.map(c => c.categoryName).join(", "),
            cell: ({ row }) => {
                const cats = row.original.categories.map(c => c.categoryName).join(", ")
                return <span className="truncate max-w-[200px] block">{cats || "-"}</span>
            }
        },
        {
            id: "paymentType",
            accessorFn: (row) => row.paymentType?.paymentType || "-",
            header: ({ column }) => {
                return (
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Payment Type
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => row.original.paymentType?.paymentType || "-"
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
                            <DropdownMenuItem className="text-zinc-700" onClick={() => openEdit(item)}>
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
                <h2 className="text-lg font-medium">Suppliers</h2>
                <Dialog open={isAddOpen} onOpenChange={(open) => {
                    setIsAddOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Supplier
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2 mb-4">
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="supplierName">Supplier Name</Label>
                                    <Input id="supplierName" name="supplierName" defaultValue={editItem?.supplierName} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentTypeId">Payment Type</Label>
                                    <select name="paymentTypeId" defaultValue={editItem?.paymentTypeId || ""} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="">Select Payment Type...</option>
                                        {paymentTypes.map(pt => (
                                            <option key={pt.slno} value={pt.slno}>{pt.paymentType}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Categories</Label>
                                <div className="p-3 border rounded-md max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <label key={cat.slno} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(cat.slno)}
                                                onChange={() => toggleCategory(cat.slno)}
                                                className="rounded border-gray-300 text-emerald-600"
                                            />
                                            {cat.categoryName}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Contacts Section */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold border-b pb-1">Contact Details</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={addContact}><Plus className="w-4 h-4 mr-1" /> Add Contact</Button>
                                </div>
                                {contacts.map((contact, i) => (
                                    <div key={i} className="flex items-end gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs">Person Name</Label>
                                            <Input value={contact.contactPerson} onChange={e => updateContact(i, 'contactPerson', e.target.value)} required />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs">Email</Label>
                                            <Input type="email" value={contact.contactEmail} onChange={e => updateContact(i, 'contactEmail', e.target.value)} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs">Number</Label>
                                            <Input value={contact.contactNumber} onChange={e => updateContact(i, 'contactNumber', e.target.value)} />
                                        </div>
                                        {contacts.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => removeContact(i)}><Trash className="w-4 h-4" /></Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Address Section */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold border-b pb-1">Addresses</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={addAddress}><Plus className="w-4 h-4 mr-1" /> Add Address</Button>
                                </div>
                                {addresses.map((address, i) => (
                                    <div key={i} className="flex flex-col gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-100 relative">
                                        {addresses.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 h-6 w-6" onClick={() => removeAddress(i)}><Trash className="w-3 h-3" /></Button>
                                        )}
                                        <div className="space-y-1 w-2/3">
                                            <Label className="text-xs">Address Name (e.g. Shipping)</Label>
                                            <Input value={address.addressName} onChange={e => updateAddress(i, 'addressName', e.target.value)} required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Full Address</Label>
                                            <Textarea value={address.address} onChange={e => updateAddress(i, 'address', e.target.value)} required />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="usb">USB (Unique Selling Proposition)</Label>
                                    <Input id="usb" name="usb" defaultValue={editItem?.usb || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Input id="remarks" name="remarks" defaultValue={editItem?.remarks || ''} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <Label htmlFor="isActive">Active Status</Label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" className="sr-only peer" defaultChecked={editItem ? editItem.isActive : true} />
                                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>

                            <DialogFooter>
                                <Button type="submit">{editItem ? "Update" : "Create"} Supplier</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable columns={columns} data={data} searchKey="supplierName" />
        </div>
    )
}
