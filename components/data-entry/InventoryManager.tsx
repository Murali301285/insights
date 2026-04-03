"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Table as TableIcon, Pencil, Trash, Building2, Package, Search, Upload, Download, CheckCircle2, DollarSign, ListPlus, Receipt, PackageCheck, AlertCircle, ChevronLeft, ChevronRight, Eye, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface InventoryManagerProps {
    isOpen: boolean
    onClose: () => void
}

export function InventoryManager({ isOpen, onClose }: InventoryManagerProps) {
    const [loading, setLoading] = useState(false)
    const [inventories, setInventories] = useState<any[]>([])
    const [statusTab, setStatusTab] = useState<'OPEN' | 'CLOSED'>('OPEN')
    const [typeTab, setTypeTab] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL')
    const [fy, setFy] = useState('FY24-25')
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    
    // Scoped Company States
    const [companies, setCompanies] = useState<any[]>([])
    const [activeCompanyId, setActiveCompanyId] = useState<string>('')
    const [companiesLoading, setCompaniesLoading] = useState(true)
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [customerOrders, setCustomerOrders] = useState<any[]>([])

    // Active Edit
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [activeInventory, setActiveInventory] = useState<any>(null)
    const [isViewOnly, setIsViewOnly] = useState(false)

    // Form tracking
    const [formData, setFormData] = useState<any>({
        type: 'INTERNAL',
        orderId: '',
        date: new Date().toISOString().split('T')[0],
        details: '',
        supplierId: '',
        paymentType: '',
        expectedDelivery: '',
        conditions: '',
        remarks: ''
    })
    
    const [items, setItems] = useState<any[]>([{ id: Date.now(), name: '', price: '', quantity: '1', tax: '0' }])
    const [files, setFiles] = useState<File[]>([])
    const [saving, setSaving] = useState(false)
    
    // Receipt Order
    const [receiveModalOpen, setReceiveModalOpen] = useState(false)
    const [receiveData, setReceiveData] = useState<any>({ receivedOn: '' })
    const [receiveFiles, setReceiveFiles] = useState<File[]>([])

    useEffect(() => {
        if (isOpen) {
            setReceiveData({ receivedOn: new Date().toISOString().slice(0, 16) })
            setCompaniesLoading(true)
            fetch('/api/companies').then(r => {
                if (!r.ok || r.redirected || r.url.includes('/login')) return []
                return r.json()
            }).then(data => {
                setCompanies(Array.isArray(data) ? data : [])
                if (Array.isArray(data) && data.length > 0 && !activeCompanyId) setActiveCompanyId(data[0].id)
                setCompaniesLoading(false)
            }).catch(err => {
                setCompaniesLoading(false)
                console.error("Fetch companies error:", err)
            })
        }
    }, [isOpen])

    useEffect(() => {
        if (activeCompanyId && isOpen) {
            fetchInventories()
            fetch(`/api/manufacturing/orders?companyId=${activeCompanyId}`)
                .then(r => r.json())
                .then(data => setCustomerOrders(Array.isArray(data) ? data : []))
                .catch(err => console.error(err))

            fetch(`/api/config/supplier?companyId=${activeCompanyId}`)
                .then(r => r.json())
                .then(data => setSuppliers(Array.isArray(data) ? data.map((s: any) => ({ id: s.slno.toString(), name: s.supplierName })) : []))
                .catch(err => console.error(err))
        }
    }, [activeCompanyId, isOpen])

    const fetchInventories = async () => {
        setLoading(true)
        try {
            const qs = activeCompanyId ? `?companyId=${activeCompanyId}` : ''
            const res = await fetch(`/api/supply-chain/inventory${qs}`)
            if (res.ok) {
                const data = await res.json()
                setInventories(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("Failed to fetch inventories:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileSetter: any, fileArray: any) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            if (fileArray.length + newFiles.length > 5) {
                toast.error("Maximum 5 files allowed")
                return
            }
            fileSetter([...fileArray, ...newFiles])
        }
    }

    const removeFile = (index: number, fileSetter: any, fileArray: any) => {
        fileSetter(fileArray.filter((_: any, i: number) => i !== index))
    }

    const resetForm = () => {
        setFormData({
            type: typeTab,
            orderId: '',
            date: new Date().toISOString().split('T')[0],
            details: '',
            supplierId: '',
            paymentType: '',
            expectedDelivery: '',
            conditions: '',
            remarks: ''
        })
        setItems([{ id: Date.now(), name: '', price: '', quantity: '1', tax: '0' }])
        setFiles([])
        setActiveInventory(null)
    }

    const openNewInventory = () => {
        resetForm()
        setIsViewOnly(false)
        setEditModalOpen(true)
    }

    const openEditInventory = (inv: any, viewOnly = false) => {
        resetForm()
        setIsViewOnly(viewOnly)
        setActiveInventory(inv)
        setFormData({
            type: inv.type || 'INTERNAL',
            orderId: inv.orderId || '',
            date: inv.date ? inv.date.split('T')[0] : '',
            details: inv.details || '',
            supplierId: inv.supplierId?.toString() || '',
            paymentType: inv.paymentType || 'Credit',
            expectedDelivery: inv.expectedDelivery ? inv.expectedDelivery.split('T')[0] : '',
            conditions: inv.conditions || '',
            remarks: inv.remarks || ''
        })
        if (inv.items && inv.items.length > 0) {
            setItems(inv.items.map((i: any, idx: number) => ({
                id: i.id || Date.now() + idx,
                name: i.name || '',
                price: i.price?.toString() || '0',
                quantity: i.quantity?.toString() || '0',
                tax: i.tax?.toString() || '0'
            })))
        }
        setEditModalOpen(true)
    }

    const handleSave = async () => {
        if (!formData.supplierId) {
            toast.error("Please enter/select a Supplier Name")
            return
        }
        if (items.some(i => !i.name || !i.price || !i.quantity)) {
            toast.error("Please fill all required item fields (Name, Price, Quantity)")
            return
        }

        const names = items.map(i => String(i.name).trim().toLowerCase());
        const uniqueNames = new Set(names);
        if (uniqueNames.size !== names.length) {
            toast.error("Duplicate items found. Please merge quantities or remove duplicate entries.")
            return
        }
        
        try {
            const payload = {
                companyId: activeCompanyId,
                type: formData.type,
                orderId: formData.orderId,
                date: formData.date,
                details: formData.details,
                supplierId: formData.supplierId,
                expectedDelivery: formData.expectedDelivery,
                conditions: formData.conditions,
                remarks: formData.remarks,
                total: grandTotal,
                items: items,
                dbId: activeInventory?.dbId
            }

            const res = await fetch("/api/supply-chain/inventory", {
                method: activeInventory ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(activeInventory ? "Inventory order updated!" : "New inventory order created!")
                setEditModalOpen(false)
                fetchInventories()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to save")
            }
        } catch (error) {
            toast.error("Failed to save")
        } finally {
            setSaving(false)
        }
    }
    
    const handleReceiveOrder = async () => {
        if (!receiveData.receivedOn) {
            toast.error("Please provide the timestamp of received date")
            return
        }
        try {
            const res = await fetch("/api/supply-chain/inventory", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dbId: activeInventory.dbId, status: "Received", receivedOn: receiveData.receivedOn })
            })

            if (res.ok) {
                toast.success("Order marked as received successfully!")
                setReceiveModalOpen(false)
                setEditModalOpen(false)
                fetchInventories()
            } else {
                toast.error("Failed to update status")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const handleDeleteOrder = async (dbId: string) => {
        if (!confirm("Are you sure you want to delete this inventory order?")) return
        try {
            const res = await fetch(`/api/supply-chain/inventory?id=${dbId}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Order deleted")
                fetchInventories()
            } else {
                toast.error("Failed to delete")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    // Math Computations
    const calculateItemTotal = (item: any) => {
        const p = parseFloat(String(item.price).replace(/,/g, '')) || 0;
        const q = parseFloat(String(item.quantity).replace(/,/g, '')) || 0;
        const t = parseFloat(String(item.tax).replace(/,/g, '')) || 0;
        const base = p * q;
        const taxAmt = base * (t / 100);
        return base + taxAmt;
    }

    const { subTotal, taxTotal, grandTotal, totalQty } = items.reduce((acc, item) => {
        const p = parseFloat(String(item.price).replace(/,/g, '')) || 0;
        const q = parseFloat(String(item.quantity).replace(/,/g, '')) || 0;
        const t = parseFloat(String(item.tax).replace(/,/g, '')) || 0;
        const base = p * q;
        const taxAmt = base * (t / 100);
        
        acc.subTotal += base;
        acc.taxTotal += taxAmt;
        acc.grandTotal += (base + taxAmt);
        acc.totalQty += q;
        return acc;
    }, { subTotal: 0, taxTotal: 0, grandTotal: 0, totalQty: 0 });
    const filteredInventories = inventories.filter(i => (statusTab === 'OPEN' ? i.status === 'Pending' : i.status === 'Received') && (i.type || 'INTERNAL') === typeTab);
    const paginatedInventories = filteredInventories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil(filteredInventories.length / rowsPerPage);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] bg-zinc-50 flex flex-col p-0 overflow-hidden border-zinc-200">
                {/* Header */}
                <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <DialogTitle className="flex items-center text-xl text-zinc-900 gap-2">
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Package className="w-5 h-5" />
                            </span>
                            Inventory Management
                        </DialogTitle>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 shadow-inner">
                            <button onClick={() => { setTypeTab('INTERNAL'); setCurrentPage(1); }} className={cn("px-6 py-1.5 text-sm font-semibold rounded-md transition-all", typeTab === 'INTERNAL' ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" : "text-zinc-500 hover:text-zinc-800")}>INTERNAL</button>
                            <button onClick={() => { setTypeTab('EXTERNAL'); setCurrentPage(1); }} className={cn("px-6 py-1.5 text-sm font-semibold rounded-md transition-all", typeTab === 'EXTERNAL' ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" : "text-zinc-500 hover:text-zinc-800")}>EXTERNAL</button>
                        </div>

                        {companiesLoading ? (
                            <div className="h-10 w-[240px] bg-zinc-100 animate-pulse rounded-lg" />
                        ) : (
                            <Select value={activeCompanyId} onValueChange={setActiveCompanyId}>
                                <SelectTrigger className="w-[240px] bg-zinc-50 border-zinc-200 font-semibold focus:ring-emerald-500">
                                    <Building2 className="w-4 h-4 mr-2 text-zinc-400" />
                                    <SelectValue placeholder="Select Company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="font-medium">{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full relative">
                        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10 shadow-sm">
                            <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/50">
                                {['OPEN', 'CLOSED'].map(f => {
                                    const count = inventories.filter(i => (f === 'OPEN' ? i.status === 'Pending' : i.status === 'Received') && i.type === typeTab).length;
                                    return (
                                        <button 
                                            key={f} 
                                            onClick={() => setStatusTab(f as any)} 
                                            className={cn("px-4 py-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-bold rounded-md transition-all", statusTab === f ? "bg-white text-emerald-700 shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-800")}
                                        >
                                            {f}
                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px]", statusTab === f ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-600")}>
                                                {count}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex items-center gap-3">
                                <Select value={fy} onValueChange={setFy}>
                                    <SelectTrigger className="w-[120px] h-9 text-xs bg-white border-zinc-200 focus:ring-emerald-500 font-semibold text-zinc-700">
                                        <SelectValue placeholder="Financial Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FY24-25" className="text-xs font-semibold">FY 2024-25</SelectItem>
                                        <SelectItem value="FY25-26" className="text-xs font-semibold">FY 2025-26</SelectItem>
                                        <SelectItem value="FY26-27" className="text-xs font-semibold">FY 2026-27</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="relative">
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <Input 
                                        className="pl-8 h-9 w-[240px] text-xs bg-zinc-50 border-zinc-200 focus-visible:ring-emerald-500" 
                                        placeholder="Search inventory orders..." 
                                    />
                                </div>
                                <Button className="h-9 px-3 text-xs bg-white text-zinc-600 border border-zinc-200 shadow-sm font-semibold hover:bg-zinc-50 relative top-[0.5px]">
                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                                </Button>
                                <Button onClick={openNewInventory} className="h-9 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm">
                                    <Plus className="w-3.5 h-3.5" />
                                    New Inventory
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="h-full flex items-center justify-center bg-zinc-50/50">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                        <p className="text-zinc-500 font-medium">Loading orders details...</p>
                                    </div>
                                </div>
                            ) : filteredInventories.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50">
                                    <TableIcon className="w-12 h-12 mb-3 text-zinc-300" />
                                    <p className="text-lg font-semibold text-zinc-500">No inventory orders found.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-zinc-50 text-zinc-500 border-b border-zinc-200 sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="px-6 py-4 font-bold w-16">#</th>
                                            <th className="px-6 py-4 font-bold">Inventory Number</th>
                                            <th className="px-6 py-4 font-bold">Date</th>
                                            <th className="px-6 py-4 font-bold">Details</th>
                                            <th className="px-6 py-4 font-bold">Supplier</th>
                                            <th className="px-6 py-4 font-bold text-right">Total Value</th>
                                            <th className="px-6 py-4 font-bold text-center">Status</th>
                                            <th className="px-6 py-4 font-bold text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {paginatedInventories.map((inv, i) => (
                                            <tr key={inv.dbId || i} className="hover:bg-zinc-50/80 transition-colors">
                                                <td className="px-6 py-4 font-medium text-zinc-500">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                                                <td className="px-6 py-4 font-black text-zinc-900">{inv.id}</td>
                                                <td className="px-6 py-4 text-zinc-600">{new Date(inv.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-zinc-800 font-medium max-w-[200px] truncate" title={inv.details}>{inv.details}</td>
                                                <td className="px-6 py-4 text-zinc-600">{inv.supplier}</td>
                                                <td className="px-6 py-4 font-bold text-zinc-900 text-right">
                                                    ₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase",
                                                        inv.status === 'Pending' ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                    )}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {inv.status === 'Pending' ? (
                                                            <>
                                                                <button 
                                                                    onClick={() => openEditInventory(inv, false)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 font-semibold transition-colors"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteOrder(inv.dbId)}
                                                                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                onClick={() => openEditInventory(inv, true)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 font-semibold transition-colors"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> View
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        
                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-zinc-500">Rows per page</span>
                                <Select value={rowsPerPage.toString()} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-[70px] h-8 text-xs bg-white border-zinc-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 20, 50, 100].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-sm font-medium text-zinc-500">
                                    Page {totalPages === 0 ? 0 : currentPage} of {totalPages === 0 ? 1 : totalPages}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg text-zinc-500" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="w-4 h-4" /></Button>
                                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg text-zinc-500" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit / Add Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-w-[70vw] w-[1200px] h-[85vh] flex flex-col p-0 overflow-hidden bg-zinc-50 border-zinc-200">
                        <DialogHeader className="bg-white border-b border-zinc-200 px-6 py-4 shrink-0 flex flex-row items-center justify-between">
                            <DialogTitle className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                {activeInventory ? (isViewOnly ? "View Inventory Request" : "Edit Inventory Request") : "New Inventory Request"}
                                {activeCompanyId && <span className="text-zinc-500 font-medium text-lg ml-1">- {formData.type === 'INTERNAL' ? 'Internal' : 'External'} for {companies.find(c => c.id === activeCompanyId)?.name}</span>}
                            </DialogTitle>
                            
                            <div className="flex items-center gap-3">
                                {activeInventory && activeInventory.status === 'Pending' && (
                                    <Button onClick={() => setReceiveModalOpen(true)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold gap-2">
                                        <PackageCheck className="w-4 h-4" />
                                        Complete / Order Received
                                    </Button>
                                )}
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-auto p-6">
                            <fieldset disabled={isViewOnly} className="bg-white outline outline-1 outline-zinc-200 rounded-2xl shadow-sm p-6 space-y-8 disabled:opacity-90">
                                
                                {/* Core Data */}
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> Supplier & Basics
                                    </h4>
                                    
                                    {formData.type === 'EXTERNAL' && (
                                        <div className="col-span-2 space-y-4 mb-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">ORDER NO. <span className="text-rose-500">*</span></label>
                                                <Select value={formData.orderId || ''} onValueChange={val => setFormData({ ...formData, orderId: val })}>
                                                    <SelectTrigger className="bg-zinc-50 text-zinc-800 font-semibold border-zinc-200 w-full max-w-sm h-10">
                                                        <SelectValue placeholder="Link to existing Order" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {customerOrders.map(o => (
                                                            <SelectItem key={o.id} value={o.id}>
                                                                <span className="font-bold text-zinc-900">{o.orderNo}</span>
                                                                <span className="text-zinc-500 ml-2 font-medium">{o.opportunity?.opportunityName}</span>
                                                            </SelectItem>
                                                        ))}
                                                        {customerOrders.length === 0 && (
                                                             <SelectItem value="empty" disabled>No active orders</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {formData.orderId && customerOrders.find(o => o.id === formData.orderId) && (
                                                <div className="bg-[#f5f8ff] border border-blue-100 rounded-xl p-5 grid grid-cols-2 gap-y-5 pointer-events-none mt-2 w-full max-w-3xl">
                                                    {(() => {
                                                        const o = customerOrders.find(o => o.id === formData.orderId)
                                                        return (
                                                            <>
                                                                <div className="text-xs">
                                                                    <span className="font-bold text-slate-800 tracking-wide uppercase">PROJECT BRIEF:</span> <span className="text-slate-600 font-medium ml-1">{o?.opportunity?.opportunityName}</span>
                                                                </div>
                                                                <div className="text-xs">
                                                                    <span className="font-bold text-slate-800 tracking-wide uppercase">CURRENT STAGE:</span> <span className="text-slate-600 font-medium ml-1">{o?.currentStage?.stageName || 'Unassigned'}</span>
                                                                </div>
                                                                <div className="text-xs">
                                                                    <span className="font-bold text-slate-800 tracking-wide uppercase">CUSTOMER NAME:</span> <span className="text-slate-600 font-medium ml-1">{o?.opportunity?.customer?.customerName}</span>
                                                                </div>
                                                                <div className="text-xs">
                                                                    <span className="font-bold text-slate-800 tracking-wide uppercase">INCHARGE:</span> <span className="text-slate-600 font-medium ml-1">{o?.orderIncharge || 'Unassigned'}</span>
                                                                </div>
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-zinc-700">Date</label>
                                            <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="bg-zinc-50" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-zinc-700">Supplier Name <span className="text-rose-500">*</span></label>
                                            <Select value={formData.supplierId} onValueChange={val => setFormData({ ...formData, supplierId: val })}>
                                                <SelectTrigger className="bg-zinc-50">
                                                    <SelectValue placeholder="Select supplier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {suppliers.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-sm font-semibold text-zinc-700">Inventory Details</label>
                                            <Input placeholder="E.g., Q3 Networking Hardware Restock" value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} className="bg-zinc-50" />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Items */}
                                <div>
                                    <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-2">
                                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                            <ListPlus className="w-4 h-4" /> Item Breakdown
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-3 text-xs font-semibold text-zinc-500 bg-zinc-50 py-1.5 px-3 rounded-lg border border-zinc-200 shadow-sm">
                                                <span>Items Count: <span className="text-zinc-900 font-bold">{items.length}</span></span>
                                                <span className="w-px h-3 bg-zinc-300" />
                                                <span>Total Qty: <span className="text-zinc-900 font-bold">{totalQty}</span></span>
                                            </div>
                                            {!isViewOnly && (
                                                <Button onClick={() => setItems([...items, { id: Date.now(), name: '', price: '', quantity: '1', tax: '0' }])} variant="outline" size="sm" className="h-8 px-3 text-xs border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-white">
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add Another Item
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Global Header */}
                                        <div className="flex gap-3 text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                                            <div className="flex-1">Item Name</div>
                                            <div className="w-32">Price (₹)</div>
                                            <div className="w-24">Qty</div>
                                            <div className="w-28">Tax (%)</div>
                                            <div className="w-40 text-emerald-600">Item Total</div>
                                            {items.length > 1 && !isViewOnly && <div className="w-10"></div>}
                                        </div>
                                        {items.map((item, index) => (
                                            <div key={item.id} className="flex gap-3 items-center relative group">
                                                <div className="flex-1">
                                                    <Input placeholder="Enter item name" value={item.name} onChange={e => {
                                                        const newItems = [...items];
                                                        newItems[index].name = e.target.value;
                                                        setItems(newItems)
                                                    }} className="bg-white" />
                                                </div>
                                                <div className="w-32">
                                                    <Input type="text" placeholder="0.00" value={item.price} onChange={e => {
                                                        const newItems = [...items];
                                                        newItems[index].price = e.target.value.replace(/[^0-9.,]/g, '');
                                                        setItems(newItems)
                                                    }} className="bg-white" />
                                                </div>
                                                <div className="w-24">
                                                    <Input type="number" placeholder="1" value={item.quantity} onChange={e => {
                                                        const newItems = [...items];
                                                        newItems[index].quantity = e.target.value;
                                                        setItems(newItems)
                                                    }} className="bg-white" />
                                                </div>
                                                <div className="w-28">
                                                    <Input type="number" placeholder="0" value={item.tax} onChange={e => {
                                                        const newItems = [...items];
                                                        newItems[index].tax = e.target.value;
                                                        setItems(newItems)
                                                    }} className="bg-white" />
                                                </div>
                                                <div className="w-40 h-10 flex items-center px-4 bg-white border border-zinc-200 rounded-md font-bold text-zinc-900 shadow-inner">
                                                    ₹{calculateItemTotal(item).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                {items.length > 1 && !isViewOnly && (
                                                    <button onClick={() => setItems(items.filter((_, i) => i !== index))} className="w-10 h-10 shrink-0 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors font-bold flex items-center justify-center border border-red-100">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Subtotal Footer */}
                                    <div className="mt-8 pt-6 border-t-2 border-dashed border-zinc-200 flex justify-end">
                                        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 w-[350px] space-y-4 shadow-sm">
                                            <div className="flex justify-between items-center text-sm font-semibold text-zinc-500">
                                                <span>Sub-Total (Item Amt)</span>
                                                <span>₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-semibold text-zinc-500 pb-4 border-b border-zinc-200">
                                                <span>Tax Amount</span>
                                                <span>₹{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xl font-black text-emerald-600 pt-2">
                                                <span>Total Amount</span>
                                                <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Logistics & Term */}
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                        <Receipt className="w-4 h-4" /> Logistics & Terms
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-zinc-700">Payment Type</label>
                                            <Select value={formData.paymentType} onValueChange={val => setFormData({ ...formData, paymentType: val })}>
                                                <SelectTrigger className="bg-zinc-50">
                                                    <SelectValue placeholder="Select payment type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Advance">Advance</SelectItem>
                                                    <SelectItem value="COD">Cash on Delivery (COD)</SelectItem>
                                                    <SelectItem value="Credit">Credit Lifecycle</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-zinc-700">Expected Delivery Date</label>
                                            <Input type="date" value={formData.expectedDelivery} onChange={e => setFormData({ ...formData, expectedDelivery: e.target.value })} className="bg-zinc-50" />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-sm font-semibold text-zinc-700">Conditions (if any)</label>
                                            <Input placeholder="Enter any specific purchasing conditions..." value={formData.conditions} onChange={e => setFormData({ ...formData, conditions: e.target.value })} className="bg-zinc-50" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-sm font-semibold text-zinc-700">Remarks</label>
                                            <Textarea placeholder="Add multiple remarks or comments here..." rows={4} value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} className="bg-zinc-50 resize-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* File Attachments */}
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Documents & Invoices
                                    </h4>
                                    {!isViewOnly && (
                                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 bg-zinc-50 hover:bg-zinc-100/50 transition-colors flex flex-col items-center justify-center cursor-pointer group">
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 group-hover:scale-105 transition-transform mb-4">
                                                <Upload className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <p className="font-semibold text-zinc-700">Click to upload Bills / Invoices</p>
                                            <p className="text-xs text-zinc-500 mt-1">Accepts PDF, JPG, PNG (Max 5 files)</p>
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.jpg,.png"
                                                className="hidden"
                                                id="invoice-upload"
                                                onChange={(e) => handleFileUpload(e, setFiles, files)}
                                            />
                                            <Button asChild variant="outline" className="mt-4 border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50">
                                                <label htmlFor="invoice-upload" className="cursor-pointer">Select Files</label>
                                            </Button>
                                        </div>
                                    )}

                                    {files.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            {files.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                                                            <Receipt className="w-4 h-4" />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-sm font-semibold text-zinc-800 truncate">{file.name}</p>
                                                            <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    {!isViewOnly && (
                                                        <button onClick={() => removeFile(i, setFiles, files)} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </fieldset>
                        </div>

                        <div className="bg-white border-t border-zinc-200 p-6 flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setEditModalOpen(false)}>{isViewOnly ? "Close View" : "Cancel"}</Button>
                            {!isViewOnly && (
                                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Record"}
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Sub-Modal for Order Received */}
                <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
                    <DialogContent className="sm:max-w-md bg-white">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <PackageCheck className="w-5 h-5 text-emerald-600" />
                                Mark Order as Received
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 pt-4">
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3 text-emerald-800 text-sm font-medium">
                                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                                <p>You are about to mark tracking <span className="font-bold">{activeInventory?.id}</span> as fully received and completed.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700">Received On (Date & Time) <span className="text-rose-500">*</span></label>
                                <Input type="datetime-local" value={receiveData.receivedOn} onChange={e => setReceiveData({ ...receiveData, receivedOn: e.target.value })} className="bg-zinc-50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700">Attach Final Invoice / Receipt (Optional)</label>
                                <div className="border-2 border-dashed border-zinc-200 rounded-xl p-4 bg-zinc-50 flex justify-center cursor-pointer">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.png"
                                        className="hidden"
                                        id="sub-invoice-upload"
                                        onChange={(e) => handleFileUpload(e, setReceiveFiles, receiveFiles)}
                                    />
                                    <label htmlFor="sub-invoice-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <Upload className="w-6 h-6 text-emerald-500" />
                                        <span className="text-xs font-semibold text-zinc-500">Upload documents...</span>
                                    </label>
                                </div>
                                {receiveFiles.length > 0 && (
                                    <div className="grid gap-2 mt-2">
                                        {receiveFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg text-xs">
                                                <span className="truncate max-w-[200px]">{file.name}</span>
                                                <button onClick={() => removeFile(i, setReceiveFiles, receiveFiles)} className="text-rose-500 hover:text-rose-700"><Trash className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => setReceiveModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleReceiveOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                Confirm Receipt
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </DialogContent>
        </Dialog>
    )
}
