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
import { Loader2, Plus, Table as TableIcon, Pencil, Trash, Building2, Ticket, Search, Upload, Download, CheckCircle2, MessageSquare, Lock, Edit3, X, Eye, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Activity } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { SmartSummaryGrid } from "@/components/data-entry/SmartSummaryGrid"

interface RequestManagerProps {
    isOpen: boolean
    onClose: () => void
}

export function RequestManager({ isOpen, onClose }: RequestManagerProps) {
    const [loading, setLoading] = useState(false)
    const [requests, setRequests] = useState<any[]>([])
    const [stages, setStages] = useState<any[]>([])
    const [weeklyItems, setWeeklyItems] = useState<string[]>([])

    const [viewTab, setViewTab] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL')
    const [subTab, setSubTab] = useState<'Summary' | 'Entry'>('Summary')
    const [statusTab, setStatusTab] = useState<'OPEN' | 'CLOSED'>('OPEN')
    const [searchQuery, setSearchQuery] = useState('')
    
    // Pagination Limits
    const [pageSize, setPageSize] = useState<number>(10)
    const [currentPage, setCurrentPage] = useState<number>(1)

    // Scoped Company States
    const [companies, setCompanies] = useState<any[]>([])
    const [activeCompanyId, setActiveCompanyId] = useState<string>('')
    const [companiesLoading, setCompaniesLoading] = useState(true)

    // Dependencies
    const [users, setUsers] = useState<any[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [opportunities, setOpportunities] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])

    // Active Edit
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [activeRequest, setActiveRequest] = useState<any>(null)

    // Form tracking
    const [formData, setFormData] = useState<any>({})
    const [saving, setSaving] = useState(false)

    // Stage Tracking Update
    const [trackingModalOpen, setTrackingModalOpen] = useState(false)
    const [updateStageModalOpen, setUpdateStageModalOpen] = useState(false)

    // Closure Tracking
    const [closeModalOpen, setCloseModalOpen] = useState(false)
    const [closeFiles, setCloseFiles] = useState<File[]>([])
    const [pendingStageSelection, setPendingStageSelection] = useState<any>(null)
    const [stageRemarks, setStageRemarks] = useState('')
    const [stageFiles, setStageFiles] = useState<File[]>([])

    // Auto-compute overdue days based on Target Complete against today's clock
    // Auto-compute Days Taken based on Date against current date or Closed Date
    useEffect(() => {
        if (!activeRequest?.isClosed && formData.date) {
            const startDate = new Date(formData.date)
            const today = new Date()
            startDate.setHours(0, 0, 0, 0)
            today.setHours(0, 0, 0, 0)
            
            const diffTime = today.getTime() - startDate.getTime()
            const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
            if (Number(formData.actualDays) !== diffDays) {
                setFormData((prev: any) => ({ ...prev, actualDays: diffDays.toString() }))
            }
        } else if (activeRequest?.isClosed && formData.date && activeRequest.closedDate) {
            const startDate = new Date(formData.date)
            const endDate = new Date(activeRequest.closedDate)
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(0, 0, 0, 0)
            const diffTime = endDate.getTime() - startDate.getTime()
            const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
            if (Number(formData.actualDays) !== diffDays) {
                setFormData((prev: any) => ({ ...prev, actualDays: diffDays.toString() }))
            }
        }
    }, [formData.date, activeRequest])


    useEffect(() => {
        if (isOpen) {
            setCompaniesLoading(true)
            fetch('/api/companies').then(r => r.json()).then(data => {
                setCompanies(Array.isArray(data) ? data : [])
                if (Array.isArray(data) && data.length > 0 && !activeCompanyId) setActiveCompanyId(data[0].id)
                setCompaniesLoading(false)
            }).catch(err => setCompaniesLoading(false))

            fetch('/api/users').then(r => r.json()).then(data => {
                setUsers(Array.isArray(data) ? data : [])
            }).catch(console.error)

            fetch('/api/manufacturing/orders').then(r => r.json()).then(data => {
                setOrders(Array.isArray(data) ? data : [])
            }).catch(console.error)

            fetch('/api/sales/opportunities').then(r => r.json()).then(data => {
                setOpportunities(Array.isArray(data) ? data : [])
            }).catch(console.error)
        }
    }, [isOpen])

    useEffect(() => {
        if (activeCompanyId && isOpen) {
            fetchRequests()
            fetchStages()
            fetch(`/api/config/supplier?companyId=${activeCompanyId}`).then(r => r.json()).then(data => {
                setSuppliers(Array.isArray(data) ? data : [])
            }).catch(console.error)
            setCurrentPage(1) // Reset pagination on comp change
        }
    }, [activeCompanyId, isOpen, viewTab, statusTab]) // Reload when tab changes

    const fetchStages = async () => {
        try {
            const res = await fetch(`/api/config/request-stages?companyId=${activeCompanyId}`)
            const data = await res.json()
            if (Array.isArray(data)) setStages(data)
        } catch (e) { }
    }

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const [res, wrRes] = await Promise.all([
                fetch(`/api/supply-chain/requests?companyId=${activeCompanyId}`),
                fetch('/api/weekly-review?type=items')
            ])
            const data = await res.json()
            if (Array.isArray(data)) setRequests(data)
            
            if (wrRes.ok) {
                const wrItems = await wrRes.json()
                setWeeklyItems(Array.isArray(wrItems) ? wrItems.filter((i: any) => i.module === 'supply-chain').map((i: any) => i.itemId) : [])
            }
        } catch (error) {
            toast.error("Failed to load requests")
        }
        setLoading(false)
    }

    const toggleWeeklyReview = async (id: string) => {
        try {
            const res = await fetch("/api/weekly-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle_item", module: "supply-chain", itemId: id })
            });
            if (res.ok) {
                if (weeklyItems.includes(id)) {
                    setWeeklyItems(weeklyItems.filter(i => i !== id));
                    toast.success("Removed from Weekly Review");
                } else {
                    setWeeklyItems([...weeklyItems, id]);
                    toast.success("Added to Weekly Review");
                }
            }
        } catch (e) {
            toast.error("Failed to update weekly review status");
        }
    }

    const handleCreateNew = () => {
        setActiveRequest(null)
        setFormData({
            date: new Date().toISOString().split('T')[0],
            bucket: 'Na'
        })
        setEditModalOpen(true)
    }

    const handleEditRequest = (req: any) => {
        setActiveRequest(req)
        setFormData({
            date: new Date(req.date).toISOString().split('T')[0],
            targetDate: req.targetDate ? new Date(req.targetDate).toISOString().split('T')[0] : '',
            actualDays: req.actualDays?.toString() || '',
            details: req.details || '',
            inchargeId: req.inchargeId || '',
            bucket: req.orderId ? 'Order Fulfillment' : (req.opportunityId ? 'Business Acquisition' : 'Na'),
            orderId: req.orderId || '',
            opportunityId: req.opportunityId || ''
        })
        setEditModalOpen(true)
    }

    const handleOpenTracking = (req: any) => {
        setActiveRequest(req)
        setTrackingModalOpen(true)
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

    const convertFilesToBase64 = async (fileList: File[]) => {
        return Promise.all(fileList.map(f => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.readAsDataURL(f)
                reader.onload = () => resolve({ name: f.name, data: reader.result })
                reader.onerror = error => reject(error)
            })
        }))
    }

    const handleCloseRequest = async () => {
        if (!formData.closeReason) {
            toast.error("Closure Reason is mandatory")
            return
        }
        setSaving(true)
        try {
            let processedCloseAtt: any[] = []
            if (closeFiles.length > 0) {
                processedCloseAtt = await convertFilesToBase64(closeFiles)
            }

            const res = await fetch('/api/supply-chain/requests', {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: activeRequest.id,
                    isClosed: true,
                    status: "CLOSED",
                    closeReason: formData.closeReason,
                    closedDate: formData.closedDate ? new Date(formData.closedDate) : new Date(),
                    closeAttachments: processedCloseAtt,
                    actualDays: formData.actualDays
                })
            })

            if (res.ok) {
                toast.success(`Request formally closed!`)
                setEditModalOpen(false)
                setCloseModalOpen(false)
                fetchRequests()
            } else {
                toast.error("Failed to close request")
            }
        } catch (error) {
             toast.error("Network error during submission")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveRequest = async () => {
        if (!formData.date || !formData.details) {
            toast.error("Please fill all required fields")
            return
        }

        setSaving(true)
        try {
            const payload = {
                companyId: activeCompanyId,
                date: formData.date,
                targetDate: formData.targetDate || null,
                actualDays: formData.actualDays || null,
                details: formData.details,
                inchargeId: formData.inchargeId || null,
                type: viewTab,
                orderId: viewTab === 'EXTERNAL' ? (formData.orderId || null) : null,
                opportunityId: viewTab === 'EXTERNAL' ? (formData.opportunityId || null) : null,
                supplierSlno: formData.supplierSlno || null
            }

            if (activeRequest) {
                const updatePayload = {
                    id: activeRequest.id,
                    details: formData.details,
                    date: formData.date,
                    targetDate: formData.targetDate || null,
                    actualDays: formData.actualDays || null,
                    supplierSlno: formData.supplierSlno || null,
                    inchargeId: formData.inchargeId || null
                }
                const res = await fetch('/api/supply-chain/requests', {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatePayload)
                })

                if (res.ok) {
                    toast.success("Request updated successfully")
                    setEditModalOpen(false)
                    fetchRequests()
                } else {
                    const e = await res.json()
                    toast.error(e.error || "Failed to update")
                }
            } else {
                const res = await fetch('/api/supply-chain/requests', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })

                if (res.ok) {
                    toast.success("Request generated successfully")
                    setEditModalOpen(false)
                    fetchRequests()
                } else {
                    const e = await res.json()
                    toast.error(e.error || "Failed to save")
                }
            }
        } catch (e) {
            toast.error("Network error")
        }
        setSaving(false)
    }

    const handleStageUpdatePrompt = (val: string) => {
        const selectedStage = stages.find(s => s.slno.toString() === val)
        if (!selectedStage) return
        setPendingStageSelection(selectedStage)
        setStageRemarks('')
        setStageFiles([])
        setUpdateStageModalOpen(true)
    }

    const handleAddCurrentStageComment = () => {
        if (!activeRequest || !activeRequest.stage) return
        setPendingStageSelection(activeRequest.stage)
        setStageRemarks('')
        setStageFiles([])
        setUpdateStageModalOpen(true)
    }

    const processStageUpdate = async () => {
        if (!pendingStageSelection) return
        setSaving(true)
        try {
            // Read files if any - mock for now since exact binary logic varies, assume upload to blob store
            const attachments = stageFiles.map(f => f.name) // simulated array

            const payload = {
                requestId: activeRequest.id,
                stageSlno: pendingStageSelection.slno,
                remarks: stageRemarks,
                attachments
            }

            const res = await fetch('/api/supply-chain/requests', {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const updatedReq = await res.json()
                toast.success(`Stage updated to ${pendingStageSelection.statusName}`)
                setActiveRequest(updatedReq)
                // update locally in list
                setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r))
                setUpdateStageModalOpen(false)
            } else {
                const e = await res.json()
                toast.error(e.error || "Failed to update stage")
            }

        } catch (e) {
            toast.error("Stage progression failed")
        }
        setSaving(false)
    }

    if (!isOpen) return null

    const openCount = requests.filter(req => req.type === viewTab && req.status !== 'CLOSED' && !req.isClosed).length;
    const closedCount = requests.filter(req => req.type === viewTab && (req.status === 'CLOSED' || req.isClosed)).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[7xl] w-[95vw] h-[90vh] bg-[#f8f9fa] p-0 overflow-hidden flex flex-col rounded-xl shadow-2xl border-0">
                <DialogTitle className="sr-only">Request Management</DialogTitle>
                {/* Header Navbar */}
                <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shrink-0 drop-shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner">
                            <Ticket className="w-5 h-5 text-emerald-600 drop-shadow-sm" />
                        </div>
                        <h2 className="text-xl font-black text-zinc-800 tracking-tight">Request Management</h2>
                    </div>

                    <div className="flex flex-1 max-w-sm mx-10 justify-center gap-4">
                        <div className="flex bg-zinc-100 p-1 rounded-xl shadow-inner border border-zinc-200">
                            <button onClick={() => setViewTab('INTERNAL')} className={cn("px-6 py-1.5 text-sm font-bold rounded-lg transition-all", viewTab === 'INTERNAL' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>INTERNAL</button>
                            <button onClick={() => setViewTab('EXTERNAL')} className={cn("px-6 py-1.5 text-sm font-bold rounded-lg transition-all", viewTab === 'EXTERNAL' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>EXTERNAL</button>
                        </div>
                        <div className="flex bg-zinc-100 p-1 rounded-xl shadow-inner border border-zinc-200">
                            {['Summary', 'Entry'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setSubTab(tab as any)}
                                    className={cn(
                                        "px-6 py-1.5 text-sm font-bold rounded-lg transition-all",
                                        subTab === tab
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-700"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Select value={activeCompanyId} onValueChange={setActiveCompanyId} disabled={companiesLoading}>
                            <SelectTrigger className="w-[200px] h-10 bg-white border-zinc-200 shadow-sm rounded-lg hover:bg-zinc-50 transition-colors font-medium text-zinc-700">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-emerald-600" />
                                    <SelectValue placeholder="Select Company" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl border-zinc-100">
                                {companies.map(c => <SelectItem key={c.id} value={c.id} className="font-medium">{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-10 w-10 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto p-6 flex flex-col">
                    {subTab === 'Summary' ? (
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                            <SmartSummaryGrid module={viewTab === 'INTERNAL' ? 'request_internal' : 'request_external'} activeCompanyId={activeCompanyId} />
                        </div>
                    ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden min-h-[500px] flex flex-col">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-6">
                                <div className="flex bg-white p-1 rounded-lg border border-zinc-200 shadow-sm">
                                    <button onClick={() => { setStatusTab('OPEN'); setCurrentPage(1); }} className={cn("px-5 py-1.5 text-xs font-bold rounded-md transition-all", statusTab === 'OPEN' ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Open ({openCount})</button>
                                    <button onClick={() => { setStatusTab('CLOSED'); setCurrentPage(1); }} className={cn("px-5 py-1.5 text-xs font-bold rounded-md transition-all", statusTab === 'CLOSED' ? "bg-zinc-100 text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>Closed ({closedCount})</button>
                                </div>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        placeholder="Search records..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        className="pl-9 w-[300px] h-9 bg-white border-zinc-200 shadow-inner rounded-full text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleCreateNew} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-6 rounded-full shadow-md hover:shadow-lg transition-all gap-2">
                                <Plus className="w-4 h-4" /> New Request
                            </Button>
                        </div>

                        <div className="overflow-x-auto flex-1 flex flex-col">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                                    <p className="font-medium animate-pulse">Loading request registry...</p>
                                </div>
                            ) : (() => {
                                const filteredRequests = requests.filter(req => {
                                    const matchesTab = statusTab === 'OPEN' ? (req.status !== 'CLOSED' && !req.isClosed) : (req.status === 'CLOSED' || req.isClosed);
                                    const matchesType = req.type === viewTab;
                                    if (!matchesTab || !matchesType) return false;
                                    if (!searchQuery) return true;
                                    const q = searchQuery.toLowerCase();
                                    return req.requestNo?.toLowerCase().includes(q) || req.details?.toLowerCase().includes(q);
                                });

                                const totalPages = Math.ceil(filteredRequests.length / pageSize);
                                const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

                                if (filteredRequests.length === 0) return (
                                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                                        <TableIcon className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="font-medium">No requests found for this registry.</p>
                                    </div>
                                );

                                return (
                                    <>
                                        <div className="flex-1">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black text-zinc-500 uppercase tracking-widest sticky top-0">
                                                        <th className="px-6 py-4 w-16">Sl. No.</th>
                                                        <th className="px-6 py-4">Request No.</th>
                                                        <th className="px-6 py-4">Date</th>
                                                        <th className="px-6 py-4 w-1/3">Request Details</th>
                                                        <th className="px-6 py-4">Target Date</th>
                                                        <th className="px-6 py-4">Days Taken</th>
                                                        <th className="px-6 py-4">Incharge</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {paginatedRequests.map((req, idx) => {
                                            const isWeekly = weeklyItems.includes(req.id);
                                            return (
                                            <tr key={req.id} className={cn("transition-colors group", isWeekly ? "bg-violet-50/60 hover:bg-violet-100/60" : "hover:bg-emerald-50/30")}>
                                                <td className="px-6 py-4 font-bold text-zinc-500 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {isWeekly && <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse shrink-0" title="Marked for Weekly Review" />}
                                                        {(currentPage - 1) * pageSize + idx + 1}
                                                    </div>
                                                </td>
                                                <td className={cn("px-6 py-4 font-black text-sm whitespace-nowrap", isWeekly ? "text-violet-900" : "text-emerald-700")}>{req.requestNo}</td>
                                                <td className="px-6 py-4 font-semibold text-zinc-700 text-sm whitespace-nowrap">
                                                    {new Date(req.date).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-zinc-800 line-clamp-2 leading-relaxed">{req.details}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-zinc-600 whitespace-nowrap">
                                                    {req.targetDate ? new Date(req.targetDate).toLocaleDateString('en-GB') : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {req.actualDays ? (
                                                        <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-xs border border-rose-200">
                                                            {req.actualDays}d
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                                                            {req.incharge?.profileName?.charAt(0) || '?'}
                                                        </div>
                                                        <span className="text-sm font-semibold text-zinc-700 truncate max-w-[120px]">
                                                            {req.incharge?.profileName || 'Unassigned'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {req.stage ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-emerald-100 text-emerald-800 border border-emerald-200 tracking-wide uppercase">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                            {req.stage.statusName}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold leading-none bg-zinc-100 text-zinc-600 border border-zinc-200 tracking-wide uppercase">
                                                            {req.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => toggleWeeklyReview(req.id)}
                                                            className="p-1 hover:bg-zinc-200/50 rounded text-zinc-400 hover:text-violet-600 transition-colors"
                                                            title={isWeekly ? "Remove from Weekly Review" : "Add for Weekly Review"}
                                                        >
                                                            <div className={cn("w-4 h-4 border rounded flex items-center justify-center", isWeekly ? "bg-violet-600 border-violet-600" : "border-zinc-300")}>
                                                                {isWeekly && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                            </div>
                                                        </button>
                                                        {statusTab === 'OPEN' && (
                                                            <>
                                                                <Button variant="ghost" size="sm" onClick={() => handleEditRequest(req)} title="Edit Request" className="h-8 w-8 p-0 text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50">
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => { setActiveRequest(req); setFormData({ ...formData, date: new Date(req.date).toISOString().split('T')[0], closedDate: new Date().toISOString().split('T')[0], closeReason: '' }); setCloseFiles([]); setCloseModalOpen(true); }} title="Complete Request" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button variant="ghost" size="sm" onClick={() => handleOpenTracking(req)} title="Track & Audit" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100">
                                                            <Activity className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            )})}
                                    </tbody>
                                </table>
                                </div>
                                
                                {/* Pagination Footer */}
                                <div className="border-t border-zinc-100 px-6 py-3 bg-zinc-50/50 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-zinc-500">Records per page:</span>
                                        <Select 
                                            value={pageSize.toString() === filteredRequests.length.toString() ? 'ALL' : pageSize.toString()} 
                                            onValueChange={(val) => {
                                                if (val === 'ALL') setPageSize(filteredRequests.length || 10)
                                                else setPageSize(parseInt(val))
                                                setCurrentPage(1)
                                            }}
                                        >
                                            <SelectTrigger className="h-7 w-20 bg-white border-zinc-200 text-xs font-bold text-zinc-700">
                                                <SelectValue placeholder="10" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="ALL">All</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <span className="text-xs font-medium text-zinc-500 ml-2">
                                            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRequests.length)} of <strong className="text-zinc-900">{filteredRequests.length}</strong> entries
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5">
                                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-7 w-7 rounded border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-50">
                                            <ChevronsLeft className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-7 w-7 rounded border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-50">
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        
                                        <span className="text-xs font-black min-w-[32px] text-center text-zinc-700 px-2 py-1 bg-white border border-zinc-200 rounded">
                                            {currentPage}
                                        </span>

                                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="h-7 w-7 rounded border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-50">
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="h-7 w-7 rounded border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-50">
                                            <ChevronsRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )
                    })()}
                        </div>
                    </div>
                    )}
                </div>

                {/* Edit / View Modal - Either Form (if creating) or Stage Tracking (if tracking) */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl">
                        <DialogHeader className="p-6 border-b border-zinc-100 bg-white shrink-0 shadow-sm z-20">
                            <DialogTitle className="text-xl font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {activeRequest ? (
                                        <>
                                            <span className="text-emerald-600">Update</span> Request
                                            <span className="text-xs bg-zinc-100 px-3 py-1.5 rounded-lg font-mono border border-zinc-200 ml-2 tracking-widest">{activeRequest.requestNo}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-emerald-600">New</span> Request Generation
                                        </>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    {/* Company Indication */}
                                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl shadow-sm">
                                        <Building2 className="w-4 h-4 text-emerald-600" />
                                        {companies.find(c => c.id === activeCompanyId)?.name || 'Select Customer'}
                                    </div>

                                    {/* Stage Dropdown */}
                                    <div className="text-right flex items-center gap-3">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">STAGE MAP</span>
                                        <Select 
                                            value={activeRequest ? activeRequest.stage?.slno?.toString() || "" : formData.stageSlno || ""} 
                                            onValueChange={(val) => {
                                                if (activeRequest) handleStageUpdatePrompt(val)
                                                else setFormData({ ...formData, stageSlno: val })
                                            }}
                                        >
                                            <SelectTrigger className="w-[200px] h-9 border-2 border-emerald-500 bg-emerald-50/50 shadow-sm rounded-lg font-bold text-emerald-800 ring-offset-0 focus:ring-0 cursor-pointer hover:bg-emerald-50 transition-colors">
                                                <SelectValue placeholder="Initial Stage" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-emerald-100 shadow-2xl p-1">
                                                {stages.map((stage) => {
                                                    const isPast = activeRequest && activeRequest.stage && stage.order <= activeRequest.stage.order;
                                                    return (
                                                        <SelectItem
                                                            key={stage.slno}
                                                            value={stage.slno.toString()}
                                                            disabled={isPast}
                                                            className={cn("rounded-lg cursor-pointer my-0.5 font-semibold", isPast ? "opacity-50" : "hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-900")}
                                                        >
                                                            {stage.order} - {stage.statusName}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <Button variant="ghost" size="icon" onClick={() => setEditModalOpen(false)} className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 shrink-0 ml-2">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        {/* Body Selection */}
                        <div className="flex flex-col p-8 space-y-8 overflow-y-auto w-full max-h-[75vh]">
                            {/* Request Form / Details */}
                            <div className="grid grid-cols-2 gap-6 w-full">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Date *</label>
                                    <Input
                                        type="date"
                                        value={formData.date || ''}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="h-11 shadow-sm rounded-xl font-medium transition-all bg-white border-zinc-200 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Expected Date of Delivery</label>
                                    <Input
                                        type="date"
                                        min={formData.date}
                                        value={formData.targetDate || ''}
                                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                                        className="h-11 shadow-sm rounded-xl font-medium transition-all bg-white border-zinc-200 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 w-full">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Days Taken</label>
                                    <Input
                                        readOnly
                                        title={formData.actualDays ? `Automatically computed: ${formData.actualDays} Days Taken` : "Automatically computed"}
                                        value={formData.actualDays ? formData.actualDays : '0'}
                                        className="h-11 bg-zinc-50 border-zinc-200 shadow-sm rounded-xl font-bold text-rose-600 pointer-events-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Supplier *</label>
                                    <Select value={formData.supplierSlno?.toString() || ""} onValueChange={(v) => setFormData({ ...formData, supplierSlno: v })}>
                                        <SelectTrigger className="h-11 shadow-sm rounded-xl font-medium bg-white border-zinc-200">
                                            <SelectValue placeholder="Select Supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map(s => (
                                                <SelectItem key={s.slno} value={s.slno.toString()}>{s.supplierName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {!activeRequest && viewTab === 'EXTERNAL' && (
                                <div className="grid grid-cols-2 gap-6 w-full pt-1">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Bucket *</label>
                                        <Select value={formData.bucket} onValueChange={(v) => setFormData({ ...formData, bucket: v, orderId: '', opportunityId: '' })}>
                                            <SelectTrigger className="h-11 bg-white border-zinc-200 shadow-sm rounded-xl font-medium">
                                                <SelectValue placeholder="Select Bucket" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Na">Na</SelectItem>
                                                <SelectItem value="Business Acquisition">Business Acquisition</SelectItem>
                                                <SelectItem value="Order Fulfillment">Order Fulfillment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Reference {formData.bucket !== 'Na' && '*'}</label>
                                        <Select 
                                            value={formData.bucket === 'Order Fulfillment' ? formData.orderId : formData.bucket === 'Business Acquisition' ? formData.opportunityId : ''} 
                                            onValueChange={(v) => {
                                                if (formData.bucket === 'Order Fulfillment') setFormData({ ...formData, orderId: v, opportunityId: '' })
                                                else if (formData.bucket === 'Business Acquisition') setFormData({ ...formData, opportunityId: v, orderId: '' })
                                            }}
                                            disabled={formData.bucket === 'Na'}
                                        >
                                            <SelectTrigger className="h-11 bg-white border-zinc-200 shadow-sm rounded-xl font-medium">
                                                <SelectValue placeholder={formData.bucket === 'Na' ? 'Not Applicable' : 'Select Reference'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formData.bucket === 'Order Fulfillment' && orders.map(o => (
                                                    <SelectItem key={o.id} value={o.id} title={`${o.orderNo} | ${companies.find(c => c.id === activeCompanyId)?.name} | ${o.currentStage?.stageName || 'Unassigned'} | ${o.orderIncharge || 'Unassigned'}`} className="font-bold flex flex-col items-start gap-0.5 py-2">
                                                        <span>{o.orderNo}</span>
                                                        <span className="text-[10px] text-zinc-400 font-normal">{o.opportunity?.opportunityName}</span>
                                                    </SelectItem>
                                                ))}
                                                {formData.bucket === 'Business Acquisition' && opportunities.map(o => (
                                                    <SelectItem key={o.id} value={o.id} title={`${o.oppNumber || o.slno} | ${o.customer?.customerName || '-'} | ${o.status?.statusName || 'Unassigned'} | ${o.incharge?.name || 'Unassigned'}`} className="font-bold flex flex-col items-start gap-0.5 py-2">
                                                        <span>{o.oppNumber || o.slno} - {o.opportunityName}</span>
                                                        <span className="text-[10px] text-zinc-400 font-normal">{o.customer?.customerName}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {/* Tooltip detail block embedded directly below when item is selected */}
                                    <div className="col-span-2">
                                    {formData.bucket === 'Order Fulfillment' && formData.orderId && (() => {
                                        const matchedOrder = orders.find(o => o.id === formData.orderId);
                                        if (!matchedOrder) return null;
                                        return (
                                            <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-lg text-[11px] leading-relaxed text-indigo-900 grid grid-cols-2 gap-y-2 gap-x-4">
                                                <div className="col-span-2 text-xs">
                                                    <strong className="text-indigo-950 uppercase tracking-wider text-[10px]">Project Brief: </strong> <span className="italic">{matchedOrder.opportunity?.opportunityName || 'No project metadata recorded.'}</span>
                                                </div>
                                                <div>
                                                    <strong className="text-indigo-950 uppercase tracking-wider text-[10px]">Customer Name: </strong> <span className="italic">{companies.find(c => c.id === activeCompanyId)?.name || '-'}</span>
                                                </div>
                                                <div>
                                                    <strong className="text-indigo-950 uppercase tracking-wider text-[10px]">Current Stage: </strong> <span className="italic">{matchedOrder.currentStage?.stageName || 'Unassigned'}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <strong className="text-indigo-950 uppercase tracking-wider text-[10px]">Incharge: </strong> <span className="italic">{users.find(u => u.id === matchedOrder.orderIncharge)?.name || 'Unassigned'}</span>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                    {formData.bucket === 'Business Acquisition' && formData.opportunityId && (() => {
                                        const matchedOpp = opportunities.find(o => o.id === formData.opportunityId);
                                        if (!matchedOpp) return null;
                                        return (
                                            <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-lg text-[11px] leading-relaxed text-emerald-900 grid grid-cols-2 gap-y-2 gap-x-4">
                                                <div className="col-span-2 text-xs">
                                                    <strong className="text-emerald-950 uppercase tracking-wider text-[10px]">Opportunity: </strong> <span className="italic">{matchedOpp.opportunityName || '-'}</span>
                                                </div>
                                                <div>
                                                    <strong className="text-emerald-950 uppercase tracking-wider text-[10px]">Customer Name: </strong> <span className="italic">{matchedOpp.customer?.customerName || '-'}</span>
                                                </div>
                                                <div>
                                                    <strong className="text-emerald-950 uppercase tracking-wider text-[10px]">Current Stage: </strong> <span className="italic">{matchedOpp.status?.statusName || 'Unassigned'}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <strong className="text-emerald-950 uppercase tracking-wider text-[10px]">Incharge: </strong> <span className="italic">{matchedOpp.incharge?.name || 'Unassigned'}</span>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 w-full">
                                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Request Details *</label>
                                <Textarea
                                    placeholder="Describe the request"
                                    value={formData.details || ''}
                                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                    className="min-h-[160px] shadow-sm rounded-xl resize-none font-medium text-sm transition-all w-full bg-white border-zinc-200 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-2 w-full">
                                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Incharge</label>
                                <Select value={formData.inchargeId || ""} onValueChange={(v) => setFormData({ ...formData, inchargeId: v })}>
                                    <SelectTrigger className="h-11 shadow-sm rounded-xl font-medium w-full bg-white border-zinc-200">
                                        <SelectValue placeholder="Assign responsible user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.profileName || u.username} ({u.role?.name || u.role})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {!activeRequest && (
                                <div className="space-y-2 w-full">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Attach Documents</label>
                                    <div className="h-11 border-2 border-dashed border-zinc-200 bg-white rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors group w-full">
                                        <span className="text-sm font-bold text-zinc-500 flex items-center gap-2 group-hover:text-emerald-700">
                                            <Upload className="w-4 h-4" /> Drag & Drop or Click <span className="text-[10px] font-medium text-zinc-400 font-normal ml-1">(Max 5)</span>
                                        </span>
                                    </div>
                                </div>
                            )}

                                <div className="pt-6 mt-4 border-t border-zinc-100 flex justify-end gap-3 w-full">
                                    <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)} className="font-bold rounded-xl h-11 px-6">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveRequest} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-emerald-600/20">
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {activeRequest ? "Update Request" : "Generate Request"}
                                    </Button>
                                </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Stage Tracking / Audit Modal */}
                <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
                    <DialogContent className="max-w-3xl flex flex-col p-0 overflow-hidden bg-[#FAFAFC] shadow-2xl h-[85vh]">
                        <DialogHeader className="p-6 border-b border-zinc-200/50 bg-white shrink-0 sticky top-0 z-20 flex-row justify-between items-center shadow-sm">
                            <DialogTitle className="font-bold flex items-center gap-3 text-zinc-800 text-xl tracking-tight">
                                <Activity className="w-6 h-6 text-emerald-500" /> Stage Tracking Audit
                            </DialogTitle>
                            <div className="flex items-center gap-4">
                                {/* Stage Dropdown (To natively Update) */}
                                {activeRequest && (
                                    <div className="flex items-center gap-4">
                                        {activeRequest.stage && (
                                            <Button onClick={handleAddCurrentStageComment} variant="outline" className="h-9 gap-2 text-emerald-700 bg-white border-emerald-200 hover:bg-emerald-50 text-xs font-bold rounded-lg shadow-sm w-max shrink-0">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Log Update
                                            </Button>
                                        )}
                                        <div className="flex items-center gap-3 border-l border-zinc-200 pl-4">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Move Stage</span>
                                            <Select 
                                                value={activeRequest.stage?.slno?.toString() || ""} 
                                                onValueChange={(val) => handleStageUpdatePrompt(val)}
                                            >
                                            <SelectTrigger className="w-[180px] h-9 border-2 border-emerald-500 bg-emerald-50 shadow-sm rounded-lg font-bold text-emerald-800 ring-offset-0 focus:ring-0 cursor-pointer hover:bg-emerald-100 transition-colors">
                                                <SelectValue placeholder="Current Stage" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-emerald-100 shadow-2xl p-1 z-[100]">
                                                {stages.map((stage) => {
                                                    const isPast = activeRequest.stage && stage.order <= activeRequest.stage.order;
                                                    return (
                                                        <SelectItem
                                                            key={stage.slno}
                                                            value={stage.slno.toString()}
                                                            disabled={isPast}
                                                            className={cn("rounded-lg cursor-pointer my-0.5 font-semibold", isPast ? "opacity-50" : "hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-900")}
                                                        >
                                                            {stage.order} - {stage.statusName}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                        </div>
                                    </div>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => setTrackingModalOpen(false)} className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-10 relative isolate bg-white">
                            {activeRequest ? (
                                <>
                                    {/* Vertical Line Track */}
                                    <div className="absolute left-[54px] top-[40px] bottom-[40px] w-[2px] bg-emerald-100 -z-10 rounded-full" />

                                    <div className="space-y-6">
                                        {stages.map((stageItem) => {
                                            const stageHistoryEvents = Array.isArray(activeRequest.stageHistory) ? activeRequest.stageHistory.filter((sh: any) => sh.stageSlno === stageItem.slno) : [];
                                            const hasReached = activeRequest.stage && stageItem.order <= activeRequest.stage.order;
                                            const isActive = activeRequest.stage?.slno === stageItem.slno;

                                            return (
                                                <div key={stageItem.slno} className="relative pl-10">
                                                    {/* Node Circle */}
                                                    <div className={cn(
                                                        "absolute left-[-11px] top-4 w-[24px] h-[24px] rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 ring-2",
                                                        isActive ? "bg-emerald-500 ring-emerald-200 ring-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : hasReached ? "bg-emerald-500 ring-transparent" : "bg-zinc-200 ring-transparent"
                                                    )} />

                                                    {/* Card */}
                                                    <div className={cn(
                                                        "p-5 rounded-2xl border transition-all duration-300",
                                                        isActive ? "bg-white border-emerald-200 shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-100" :
                                                            hasReached ? "bg-zinc-50 border-zinc-200 opacity-90 shadow-sm" :
                                                                "bg-white/50 border-zinc-100 opacity-50 grayscale select-none"
                                                    )}>
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className={cn("text-emerald-900 tracking-wider font-black text-sm uppercase", hasReached ? "text-emerald-800" : "text-zinc-400")}>
                                                                Stage {stageItem.order} : {stageItem.statusName}
                                                            </h4>
                                                            {isActive && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 leading-none">ACTIVE</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-8 mt-2">
                                                            {/* Status Details */}
                                                            <div>
                                                                <div className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-1">Configuration</div>
                                                                <p className="text-sm font-semibold text-zinc-700">{stageItem.remarks || "No specific instructions."}</p>
                                                            </div>

                                                            {/* Logs */}
                                                            {stageHistoryEvents.length > 0 && (
                                                                <div>
                                                                    <div className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-2">Audit Logs & Files</div>
                                                                    <div className="space-y-4">
                                                                    {stageHistoryEvents.map((hEvent: any, i: number) => (
                                                                        <div key={i} className="bg-white border border-zinc-100 rounded-xl p-3 shadow-sm border-l-4 border-l-emerald-400">
                                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                                                                                <span className="text-xs font-semibold text-zinc-600">Update Registered</span>
                                                                            </div>
                                                                            <div className="text-sm text-zinc-700 leading-relaxed font-medium pl-5 mb-2 whitespace-pre-wrap">{hEvent.remarks || "System Stage Entry"}</div>
                                                                            
                                                                            {hEvent.attachments?.length > 0 && (
                                                                                <div className="pl-5 flex gap-2 flex-wrap mb-2">
                                                                                    {hEvent.attachments.map((f: string, fi: number) => (
                                                                                        <div key={fi} className="flex gap-1.5 items-center bg-zinc-50 border border-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors shadow-sm">
                                                                                            <FileText className="w-3.5 h-3.5 text-blue-500" /> <span className="max-w-[150px] truncate">{f}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            <div className="flex justify-between items-center pl-5 pt-2 border-t border-zinc-100">
                                                                                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">BY: {hEvent.updatedBy || "System"}</span>
                                                                                <span className="text-[10px] font-bold text-zinc-400">{new Date(hEvent.date).toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-8 bg-white border border-zinc-200 border-dashed rounded-2xl text-zinc-400 text-sm shadow-sm mt-8 mx-4">
                                    No pipeline updates yet.
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Stage Update Popup (Attachment 4) */}
                <Dialog open={updateStageModalOpen} onOpenChange={setUpdateStageModalOpen}>
                    <DialogContent className="sm:max-w-[450px] p-6 bg-white rounded-3xl border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">Update Stage</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 mt-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Remarks *</label>
                                <Textarea 
                                    placeholder="Add comments, delays, or update notes..." 
                                    className="min-h-[120px] resize-none rounded-xl border-2 border-zinc-200 bg-[#fafafa] focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 font-medium text-zinc-800 transition-all text-sm p-4"
                                    value={stageRemarks}
                                    onChange={e => setStageRemarks(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Attachments (PDF/Image, Max 5)</label>
                                <div className="border-2 border-dashed border-zinc-200 bg-[#fafafa] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors group" onClick={() => {
                                    // Mock File Upload mapping
                                    setStageFiles([...stageFiles, new File([], `Document_${stageFiles.length + 1}.pdf`)])
                                }}>
                                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-zinc-100 mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500" />
                                    </div>
                                    <span className="text-zinc-600 font-bold mb-1 group-hover:text-emerald-700 text-sm">Click to upload files</span>
                                    <span className="text-xs text-zinc-400 font-medium">Each file up to 5MB</span>
                                </div>
                                {stageFiles.length > 0 && (
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {stageFiles.map((f, i) => (
                                            <div key={i} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1 border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3" /> {f.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 mt-8 pt-4">
                            <Button variant="ghost" onClick={() => setUpdateStageModalOpen(false)} className="flex-1 font-bold text-zinc-600 hover:text-zinc-900 rounded-xl h-12">
                                Cancel
                            </Button>
                            <Button onClick={processStageUpdate} disabled={saving} className="flex-1 bg-[#009b69] hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-600/20 text-[15px]">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Update"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Separate Modal for Request Closure */}
                <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
                    <DialogContent className="sm:max-w-md border-t-4 border-t-rose-500 p-0 overflow-hidden shadow-2xl">
                        <DialogHeader className="p-5 border-b border-zinc-100 bg-white">
                            <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2 uppercase tracking-wide">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> Request Closure Protocols
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-5 bg-rose-50/30">
                            <div className="bg-white border border-rose-100 rounded-xl p-5 shadow-sm space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">Closure Remarks *</label>
                                    <Textarea 
                                        value={formData.closeReason || ''} 
                                        onChange={e => setFormData({ ...formData, closeReason: e.target.value })}
                                        placeholder="Mandatory exit auditing details..."
                                        className="min-h-[100px] resize-none border-rose-200 focus-visible:ring-rose-500 bg-white shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <label className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">Closed Date *</label>
                                    <Input type="date" min={formData.date} value={formData.closedDate || ''} onChange={e => setFormData({ ...formData, closedDate: e.target.value })} className="h-9 border-rose-200 bg-white"/>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <label className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">Final Documents</label>
                                    <Input type="file" multiple accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, setCloseFiles, closeFiles)} className="bg-white border-rose-200 text-xs shadow-sm h-9"/>
                                    {closeFiles.length > 0 && (
                                        <div className="mt-2 text-[11px] text-rose-700 font-bold px-1">{closeFiles.length} file(s) primed for closure mount.</div>
                                    )}
                                </div>
                                <Button onClick={handleCloseRequest} disabled={saving} className="w-full bg-rose-600 hover:bg-rose-700 shadow-md font-bold mt-2 h-11 text-[15px]">
                                    {saving ? "Processing..." : "Complete & Close Formal Request"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </DialogContent>
        </Dialog>
    )
}
