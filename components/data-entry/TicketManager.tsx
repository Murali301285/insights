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
import { Loader2, Plus, Table as TableIcon, Pencil, Trash, Building2, Ticket, Search, Upload, Download, CheckCircle2, MessageSquare, Lock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import * as xlsx from 'xlsx'

interface TicketManagerProps {
    isOpen: boolean
    onClose: () => void
}

export function TicketManager({ isOpen, onClose }: TicketManagerProps) {
    const [loading, setLoading] = useState(false)
    const [tickets, setTickets] = useState<any[]>([])
    const [weeklyItems, setWeeklyItems] = useState<string[]>([])
    const [viewTab, setViewTab] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL')
    const [statusTab, setStatusTab] = useState<'OPEN' | 'CLOSED'>('OPEN')
    const [searchQuery, setSearchQuery] = useState('')

    // Table mechanics
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState<number>(10)
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    
    // Scoped Company States
    const [companies, setCompanies] = useState<any[]>([])
    const [activeCompanyId, setActiveCompanyId] = useState<string>('')
    const [companiesLoading, setCompaniesLoading] = useState(true)
    const [activeFY, setActiveFY] = useState<string>('All')

    // Dependencies
    const [users, setUsers] = useState<any[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [opportunities, setOpportunities] = useState<any[]>([])

    // Active Edit
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [activeTicket, setActiveTicket] = useState<any>(null)

    // Form tracking
    const [formData, setFormData] = useState<any>({})
    const [files, setFiles] = useState<File[]>([])
    const [closeFiles, setCloseFiles] = useState<File[]>([])
    const [saving, setSaving] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [closeModalOpen, setCloseModalOpen] = useState(false)
    const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false)

    // Auto-compute overdue days based on Target Complete against today's clock
    useEffect(() => {
        if (!activeTicket?.isClosed && formData.targetDate) {
            const target = new Date(formData.targetDate)
            const today = new Date()
            target.setHours(0, 0, 0, 0)
            today.setHours(0, 0, 0, 0)
            
            const diffTime = today.getTime() - target.getTime()
            if (diffTime > 0) {
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (Number(formData.actualDays) !== diffDays) {
                    setFormData((prev: any) => ({ ...prev, actualDays: diffDays.toString() }))
                }
            } else {
                if (formData.actualDays) {
                    setFormData((prev: any) => ({ ...prev, actualDays: '' }))
                }
            }
        }
    }, [formData.targetDate, activeTicket])


    useEffect(() => {
        if (isOpen) {
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
            
            fetch('/api/users').then(r => {
                if (!r.ok || r.redirected || r.url.includes('/login')) return []
                return r.json()
            }).then(data => {
                setUsers(Array.isArray(data) ? data : [])
            }).catch(console.error)
        }
    }, [isOpen])

    useEffect(() => {
        if (activeCompanyId && isOpen) {
            fetchOrders()
            fetchOpportunities()
            fetchTickets()
        }
    }, [activeCompanyId, viewTab, isOpen])

    const fetchOrders = async () => {
        try {
            const res = await fetch(`/api/manufacturing/orders?companyId=${activeCompanyId}`)
            if (!res.ok || res.redirected || res.url.includes('/login')) {
                setOrders([])
                return
            }
            const data = await res.json()
            setOrders(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Failed to fetch orders:", error)
        }
    }

    const fetchOpportunities = async () => {
        try {
            const res = await fetch(`/api/sales/opportunities?companyId=${activeCompanyId}`)
            if (!res.ok || res.redirected || res.url.includes('/login')) {
                setOpportunities([])
                return
            }
            const data = await res.json()
            setOpportunities(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Failed to fetch opportunities:", error)
        }
    }

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const [res, wrRes] = await Promise.all([
                fetch(`/api/support/tickets?companyId=${activeCompanyId}&type=${viewTab}`),
                fetch('/api/weekly-review?type=items')
            ])
            if (!res.ok || res.redirected || res.url.includes('/login')) {
                setTickets([])
            } else {
                const data = await res.json()
                setTickets(Array.isArray(data) ? data : [])
            }
            if (wrRes.ok) {
                const wrItems = await wrRes.json()
                setWeeklyItems(Array.isArray(wrItems) ? wrItems.filter((i: any) => i.module === 'support').map((i: any) => i.itemId) : [])
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error)
        } finally {
            setLoading(false)
        }
    }

    const toggleWeeklyReview = async (id: string) => {
        try {
            const res = await fetch("/api/weekly-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle_item", module: "support", itemId: id })
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

    const convertFilesToBase64 = async (fileList: File[]) => {
        return Promise.all(fileList.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: reader.result })
                reader.onerror = error => reject(error)
                reader.readAsDataURL(file)
            })
        }))
    }

    const handleSaveTicket = async () => {
        if (!formData.details) {
            toast.error("Ticket Details are strictly required")
            return
        }
        if (viewTab === 'EXTERNAL') {
            if (formData.bucket === 'Business Acquisition' && !formData.opportunityId) {
                toast.error("Reference mapping is required for Business Acquisition tickets")
                return
            }
            if (formData.bucket === 'Order Fulfillment' && !formData.orderId) {
                toast.error("Reference mapping is required for Order Fulfillment tickets")
                return
            }
        }

        setSaving(true)
        try {
            let processedAttachments: any[] = []
            if (files.length > 0) {
                processedAttachments = await convertFilesToBase64(files)
            }

            // If updating, retain old attachments
            if (activeTicket?.attachments && Array.isArray(activeTicket.attachments)) {
                processedAttachments = [...activeTicket.attachments, ...processedAttachments]
            }

            const payload = {
                ...formData,
                type: viewTab,
                companyId: activeCompanyId,
                attachments: processedAttachments
            }

            const url = activeTicket ? `/api/support/tickets` : `/api/support/tickets`
            const method = activeTicket ? "PUT" : "POST"
            
            if (activeTicket) payload.id = activeTicket.id

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(`Ticket ${activeTicket ? 'Updated' : 'Generated'} Successfully!`)
                setEditModalOpen(false)
                fetchTickets()
            } else {
                toast.error(data.error || "Execution failed")
            }
        } catch (error) {
            toast.error("Network error during submission")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Irreversibly delete this ticket record?")) return
        try {
            const res = await fetch(`/api/support/tickets?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Ticket eradicated")
                fetchTickets()
            } else {
                toast.error("Failed to delete")
            }
        } catch (error) {
            toast.error("Network fault")
        }
    }

    const handleCloseTicket = async () => {
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

            const res = await fetch('/api/support/tickets', {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: activeTicket.id,
                    isClosed: true,
                    status: "CLOSED",
                    closeReason: formData.closeReason,
                    closeAttachments: processedCloseAtt
                })
            })

            if (res.ok) {
                toast.success(`Ticket formally closed!`)
                setEditModalOpen(false)
                setCloseModalOpen(false)
                fetchTickets()
            } else {
                toast.error("Failed to close ticket")
            }
        } catch (error) {
             toast.error("Network error during submission")
        } finally {
            setSaving(false)
        }
    }

    const openNewTicket = () => {
        setActiveTicket(null)
        setFormData({
            date: new Date().toISOString().split('T')[0],
            comments: [],
            bucket: 'Na'
        })
        setFiles([])
        setCloseFiles([])
        setNewComment('')
        setEditModalOpen(true)
    }

    const openEditTicket = (t: any) => {
        setActiveTicket(t)
        setFormData({
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
            details: t.details || '',
            targetDate: t.targetDate ? new Date(t.targetDate).toISOString().split('T')[0] : '',
            actualDays: t.actualDays || '',
            inchargeId: t.inchargeId || '',
            bucket: t.orderId ? 'Order Fulfillment' : (t.opportunityId ? 'Business Acquisition' : 'Na'),
            orderId: t.orderId || '',
            opportunityId: t.opportunityId || '',
            status: t.status || 'OPEN',
            closeReason: t.closeReason || '',
            comments: Array.isArray(t.comments) ? t.comments : []
        })
        setFiles([])
        setCloseFiles([])
        setNewComment('')
        setEditModalOpen(true)
    }

    const formatDate = (ds: any) => {
        if (!ds) return '-'
        return new Date(ds).toLocaleDateString('en-GB')
    }

    const handleAddComment = () => {
        if (!newComment.trim()) return
        const commentObj = {
            text: newComment,
            date: new Date().toISOString()
        }
        setFormData({ ...formData, comments: [...(formData.comments || []), commentObj] })
        setNewComment('')
    }

    const handleDeleteComment = (index: number) => {
        const updated = [...(formData.comments || [])]
        updated.splice(index, 1)
        setFormData({ ...formData, comments: updated })
    }

    const ticketsInFY = tickets.filter(t => {
        if (activeFY === 'All') return true;
        if (!t.date) return false;
        const dateObj = new Date(t.date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1; // 1-12
        const fy = month >= 4 ? `${String(year).slice(-2)}-${String(year + 1).slice(-2)}` : `${String(year - 1).slice(-2)}-${String(year).slice(-2)}`;
        return fy === activeFY;
    });

    const filteredTickets = ticketsInFY.filter(t => {
        const matchesSearch = !searchQuery || 
            t.ticketNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.details?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusTab === 'OPEN' ? !t.isClosed : t.isClosed;
        return matchesSearch && matchesStatus;
    });

    const openCount = ticketsInFY.filter(t => !t.isClosed).length;
    const closedCount = ticketsInFY.filter(t => t.isClosed).length;

    const sortedTickets = [...filteredTickets].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        let valA = a[key] || '';
        let valB = b[key] || '';
        
        if (key === 'date' || key === 'targetDate') {
            valA = new Date(valA || 0).getTime();
            valB = new Date(valB || 0).getTime();
        }
        if (key === 'orderNo') {
            valA = a.order?.orderNo || '';
            valB = b.order?.orderNo || '';
        }
        if (key === 'inchargeName') {
            valA = a.incharge?.name || '';
            valB = b.incharge?.name || '';
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(sortedTickets.length / itemsPerPage);
    const paginatedTickets = itemsPerPage === -1 ? sortedTickets : sortedTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleExport = () => {
        const exportData = sortedTickets.map(t => ({
            "Ticket No.": t.ticketNo,
            "Date": formatDate(t.date),
            "Order No.": t.order?.orderNo || '-',
            "Ticket Details": t.details,
            "Target Complete": formatDate(t.targetDate),
            "Days Taken": t.actualDays || '-',
            "Incharge": t.incharge?.name || 'Unassigned',
            "Status": t.isClosed ? 'CLOSED' : t.status
        }));
        
        if (exportData.length === 0) {
            toast.error("No data to export");
            return;
        }

        const ws = xlsx.utils.json_to_sheet(exportData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Tickets");
        xlsx.writeFile(wb, `Tickets_${viewTab}_${statusTab}_Export.xlsx`);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose() }}>
                <DialogContent className="max-w-7xl max-h-[90vh] p-0 overflow-hidden bg-zinc-50 flex flex-col shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] border-zinc-300">
                    <DialogHeader className="p-5 border-b border-zinc-200 bg-white shrink-0">
                        <div className="flex justify-between items-center pr-8">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-zinc-900">
                                <Ticket className="w-5 h-5 text-emerald-600" />
                                Ticket Management
                            </DialogTitle>
                            
                            <div className="flex gap-4 items-center">
                                {/* Header Toggle */}
                                <div className="flex bg-zinc-100 p-1 rounded-lg w-max shadow-inner">
                                    {['INTERNAL', 'EXTERNAL'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setViewTab(tab as any)}
                                            className={cn(
                                                "px-6 py-1.5 text-sm font-semibold rounded-md transition-all uppercase tracking-wider",
                                                viewTab === tab
                                                    ? "bg-white text-zinc-900 shadow-sm"
                                                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* FY Dropdown */}
                                <div className="flex items-center bg-white border border-zinc-200 px-3 py-1.5 rounded-lg shadow-sm w-36">
                                    <span className="text-zinc-500 font-bold text-xs mr-2 border-r border-zinc-200 pr-2">FY</span>
                                    <Select value={activeFY} onValueChange={setActiveFY}>
                                        <SelectTrigger className="h-7 border-0 bg-transparent text-zinc-900 font-bold focus:ring-0 p-0 shadow-none text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All" className="font-medium text-xs">All Time</SelectItem>
                                            <SelectItem value="23-24" className="font-medium text-xs">23-24</SelectItem>
                                            <SelectItem value="24-25" className="font-medium text-xs">24-25</SelectItem>
                                            <SelectItem value="25-26" className="font-medium text-xs">25-26</SelectItem>
                                            <SelectItem value="26-27" className="font-medium text-xs">26-27</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {!companiesLoading && companies.length > 0 && (
                                    <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-lg shadow-sm w-64">
                                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        <Select value={activeCompanyId} onValueChange={setActiveCompanyId}>
                                            <SelectTrigger className="h-7 border-0 bg-transparent text-blue-900 font-bold focus:ring-0 p-0 shadow-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {companies.map((c) => (
                                                    <SelectItem key={c.id} value={c.id} className="font-medium text-sm">
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto p-6">
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <Input 
                                            placeholder="Search records..." 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-9 h-9 w-[300px] border-zinc-200 text-sm focus-visible:ring-emerald-500 shadow-sm" 
                                        />
                                    </div>
                                    <div className="flex bg-white border border-zinc-200 rounded-lg shadow-sm p-0.5">
                                        <button
                                            onClick={() => { setStatusTab('OPEN'); setCurrentPage(1); }}
                                            className={cn(
                                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2",
                                                statusTab === 'OPEN' ? "bg-emerald-50 text-emerald-700" : "text-zinc-500 hover:bg-zinc-100"
                                            )}
                                        >
                                            OPEN <span className="text-[10px] bg-zinc-200/50 px-1.5 py-0.5 rounded-full">{openCount}</span>
                                        </button>
                                        <button
                                            onClick={() => { setStatusTab('CLOSED'); setCurrentPage(1); }}
                                            className={cn(
                                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2",
                                                statusTab === 'CLOSED' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:bg-zinc-100"
                                            )}
                                        >
                                            CLOSED <span className="text-[10px] bg-zinc-200/20 px-1.5 py-0.5 rounded-full">{closedCount}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={handleExport} variant="outline" className="h-9 gap-2 shadow-sm font-bold border-zinc-200 text-emerald-700 hover:bg-emerald-50">
                                        <FileSpreadsheet className="w-4 h-4" /> Export
                                    </Button>
                                    <Button onClick={openNewTicket} className="h-9 gap-2 shadow-sm font-bold bg-emerald-600 hover:bg-emerald-700 px-5 transition-all">
                                        <Plus className="w-4 h-4" /> New Ticket
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                                    <thead className="bg-zinc-100/80 text-zinc-600 sticky top-0 z-30 shadow-sm backdrop-blur-sm">
                                        <tr>
                                            <th onClick={() => handleSort('ticketNo')} className="p-3 font-semibold border-b border-zinc-200 min-w-[120px] cursor-pointer hover:bg-zinc-200/50">
                                                <div className="flex items-center gap-1">Ticket No. {sortConfig?.key === 'ticketNo' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                            </th>
                                            <th onClick={() => handleSort('date')} className="p-3 font-semibold border-b border-zinc-200 min-w-[100px] cursor-pointer hover:bg-zinc-200/50">
                                                <div className="flex items-center gap-1">Date {sortConfig?.key === 'date' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                            </th>
                                            {viewTab === 'EXTERNAL' && <th onClick={() => handleSort('orderNo')} className="p-3 font-semibold border-b border-zinc-200 min-w-[120px] cursor-pointer hover:bg-zinc-200/50">
                                                <div className="flex items-center gap-1">Order No. {sortConfig?.key === 'orderNo' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                            </th>}
                                            <th onClick={() => handleSort('details')} className="p-3 font-semibold border-b border-zinc-200 w-full overflow-hidden cursor-pointer hover:bg-zinc-200/50">
                                                <div className="flex items-center gap-1">Ticket Details {sortConfig?.key === 'details' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                            </th>
                                            <th onClick={() => handleSort('targetDate')} className="p-3 font-semibold border-b border-zinc-200 min-w-[120px] cursor-pointer hover:bg-zinc-200/50">
                                                <div className="flex items-center gap-1">Target {sortConfig?.key === 'targetDate' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                            </th>
                                            <th onClick={() => handleSort('actualDays')} className="p-3 font-semibold border-b border-zinc-200 min-w-[100px] cursor-pointer hover:bg-zinc-200/50">
                                                <div className="flex items-center gap-1">Days Taken {sortConfig?.key === 'actualDays' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                            </th>
                                            {viewTab === 'INTERNAL' && <th onClick={() => handleSort('inchargeName')} className="p-3 font-semibold border-b border-zinc-200 min-w-[120px] cursor-pointer hover:bg-zinc-200/50">
                                                <div className="flex items-center gap-1">Incharge {sortConfig?.key === 'inchargeName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                            </th>}
                                            <th className="p-3 font-semibold border-b border-zinc-200 min-w-[100px]">Status</th>
                                            <th className="p-3 font-semibold border-b border-zinc-200 min-w-[100px] text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 bg-white">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={10} className="p-8 text-center text-zinc-400">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-300" />
                                                    Consulting registry...
                                                </td>
                                            </tr>
                                        ) : paginatedTickets.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="p-12 text-center text-zinc-400 font-medium">No tickets found for this registry.</td>
                                            </tr>
                                        ) : paginatedTickets.map((t) => {
                                            const isWeekly = weeklyItems.includes(t.id);
                                            return (
                                            <tr key={t.id} className={cn("transition-colors group", isWeekly ? "bg-violet-50/60 hover:bg-violet-100/60" : "hover:bg-zinc-50/50")}>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        {isWeekly && <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse shrink-0" title="Marked for Weekly Review" />}
                                                        <span className={cn("font-bold", isWeekly ? "text-violet-900" : "text-emerald-700")}>{t.ticketNo}</span>
                                                    </div>
                                                </td>
                                                <td className={cn("p-3", isWeekly ? "text-violet-800" : "text-zinc-600")}>{formatDate(t.date)}</td>
                                                {viewTab === 'EXTERNAL' && <td className="p-3 font-bold text-indigo-700">{t.order?.orderNo || '-'}</td>}
                                                <td className="p-3 text-zinc-800 max-w-[200px] truncate" title={t.details}>{t.details}</td>
                                                <td className="p-3 text-zinc-600">{formatDate(t.targetDate)}</td>
                                                <td className="p-3 font-bold text-zinc-700">{t.actualDays || '-'}</td>
                                                {viewTab === 'INTERNAL' && <td className="p-3 text-zinc-600">{t.incharge?.name || 'Unassigned'}</td>}
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.isClosed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {t.isClosed ? 'CLOSED' : t.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => toggleWeeklyReview(t.id)}
                                                            className="p-1 hover:bg-zinc-200/50 rounded text-zinc-400 hover:text-violet-600 transition-colors"
                                                            title={isWeekly ? "Remove from Weekly Review" : "Add for Weekly Review"}
                                                        >
                                                            <div className={cn("w-4 h-4 border rounded flex items-center justify-center", isWeekly ? "bg-violet-600 border-violet-600" : "border-zinc-300")}>
                                                                {isWeekly && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                            </div>
                                                        </button>
                                                        <Button variant="ghost" size="sm" onClick={() => { setActiveTicket(t); setViewDetailModalOpen(true); }} className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200" title="View details">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>
                                                        {!t.isClosed && (
                                                            <>
                                                                <Button variant="ghost" size="sm" onClick={() => openEditTicket(t)} className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200" title="Edit ticket">
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200" title="Delete ticket">
                                                                    <Trash className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="p-3 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center text-sm sticky bottom-0">
                                <div className="text-zinc-500 font-medium">
                                    Displaying {paginatedTickets.length} of {sortedTickets.length} items
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-500 font-medium">Items per page</span>
                                        <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                                            <SelectTrigger className="w-[70px] h-8 bg-white border-zinc-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="-1">All</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || itemsPerPage === -1}>
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || itemsPerPage === -1}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="px-2 text-zinc-600 font-medium whitespace-nowrap">
                                            {itemsPerPage === -1 ? '1 / 1' : `${currentPage} / ${totalPages}`}
                                        </div>
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || itemsPerPage === -1}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || itemsPerPage === -1}>
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Editor Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
                    <DialogHeader className="p-6 border-b border-zinc-100 shrink-0">
                        <DialogTitle className="text-xl font-bold flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {activeTicket ? (
                                    <>
                                        <span className="text-emerald-600">Update</span> Ticket
                                        <span className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono border border-zinc-200 ml-2">{activeTicket.ticketNo}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-emerald-600">New</span> Ticket Generation
                                    </>
                                )}
                            </div>

                            {!activeTicket ? (
                                <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-lg shadow-sm w-72">
                                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    <Select value={activeCompanyId} onValueChange={setActiveCompanyId}>
                                        <SelectTrigger className="h-7 border-0 bg-transparent text-blue-900 font-bold focus:ring-0 p-0 shadow-none text-sm">
                                            <SelectValue placeholder="Select Customer..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map((c) => (
                                                <SelectItem key={c.id} value={c.id} className="font-medium text-sm">
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg">
                                    <Building2 className="w-4 h-4" />
                                    {companies.find(c => c.id === activeCompanyId)?.name || 'Unknown Customer'}
                                </div>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-hidden flex flex-row divide-x divide-zinc-100 bg-zinc-50/30">
                        {/* 左侧表单 / Main Form Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            
                            {/* Row 1: Date, Target, Days Taken */}
                            <div className="grid grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Date *</label>
                                    <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} disabled={activeTicket} className="h-9 bg-white"/>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Target Complete</label>
                                    <Input type="date" value={formData.targetDate || ''} onChange={e => setFormData({ ...formData, targetDate: e.target.value })} className="h-9 bg-white"/>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Days Taken</label>
                                    <Input 
                                        type="text" 
                                        title={formData.actualDays ? `${formData.actualDays} Days Overdue` : "Automatically computed"}
                                        placeholder="0" 
                                        value={formData.actualDays ? (formData.actualDays + ' Days Over') : ''} 
                                        readOnly
                                        tabIndex={-1}
                                        className="h-9 bg-zinc-50 border-zinc-200 cursor-not-allowed text-rose-600 font-bold pointer-events-none"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Bucket & Status (External) */}
                            {viewTab === 'EXTERNAL' && (
                                <div className="grid grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Bucket *</label>
                                        <Select value={formData.bucket} onValueChange={(val) => setFormData({ ...formData, bucket: val, orderId: '', opportunityId: '' })} disabled={!!activeTicket}>
                                            <SelectTrigger className="h-9 bg-white">
                                                <SelectValue placeholder="Select Bucket" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Na">Na</SelectItem>
                                                <SelectItem value="Business Acquisition">Business Acquisition</SelectItem>
                                                <SelectItem value="Order Fulfillment">Order Fulfillment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Reference {formData.bucket !== 'Na' && '*'}</label>
                                        <Select 
                                            value={formData.bucket === 'Order Fulfillment' ? formData.orderId : formData.bucket === 'Business Acquisition' ? formData.opportunityId : ''} 
                                            onValueChange={(val) => {
                                                if (formData.bucket === 'Order Fulfillment') setFormData({ ...formData, orderId: val, opportunityId: '' })
                                                else if (formData.bucket === 'Business Acquisition') setFormData({ ...formData, opportunityId: val, orderId: '' })
                                            }} 
                                            disabled={!!activeTicket || formData.bucket === 'Na'}
                                        >
                                            <SelectTrigger className="h-9 bg-white">
                                                <SelectValue placeholder={formData.bucket === 'Na' ? 'Not Applicable' : 'Select Reference'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formData.bucket === 'Order Fulfillment' && orders.map(o => (
                                                    <SelectItem key={o.id} value={o.id} title={`${o.orderNo} | ${companies.find(c => c.id === activeCompanyId)?.name} | ${o.currentStage?.stageName || 'Unassigned'} | ${o.orderIncharge || 'Unassigned'}`} className="font-bold flex flex-col items-start gap-0.5">
                                                        <span>{o.orderNo}</span>
                                                        <span className="text-[10px] text-zinc-400 font-normal">{o.opportunity?.opportunityName}</span>
                                                    </SelectItem>
                                                ))}
                                                {formData.bucket === 'Business Acquisition' && opportunities.map(o => (
                                                    <SelectItem key={o.id} value={o.id} title={`${o.oppNumber || o.slno} | ${o.customer?.customerName || '-'} | ${o.status?.statusName || 'Unassigned'} | ${o.incharge?.name || 'Unassigned'}`} className="font-bold flex flex-col items-start gap-0.5">
                                                        <span>{o.oppNumber || o.slno} - {o.opportunityName}</span>
                                                        <span className="text-[10px] text-zinc-400 font-normal">{o.customer?.customerName}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {activeTicket && !activeTicket.isClosed ? (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-orange-600 uppercase tracking-wider">Current Pipeline Status</label>
                                            <Input 
                                                placeholder="e.g. In Progress, Dispatched" 
                                                value={formData.status || ''} 
                                                onChange={e => setFormData({ ...formData, status: e.target.value })} 
                                                className="h-9 border-orange-200 focus-visible:ring-orange-500 bg-white"
                                            />
                                        </div>
                                    ) : <div></div>}
                                </div>
                            )}

                            {viewTab === 'EXTERNAL' && !activeTicket && (() => {
                                if (formData.bucket === 'Order Fulfillment' && formData.orderId) {
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
                                } else if (formData.bucket === 'Business Acquisition' && formData.opportunityId) {
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
                                }
                                return null;
                            })()}

                            {/* Row 3: Ticket Details */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Ticket Details *</label>
                                <Textarea 
                                    value={formData.details || ''} 
                                    onChange={e => setFormData({ ...formData, details: e.target.value })}
                                    placeholder="Describe the service request or issue..."
                                    className="min-h-[60px] resize-none bg-white py-2"
                                />
                            </div>

                            {/* Row 4: Incharge & Documents in grid */}
                            <div className={`grid gap-5 items-start ${viewTab === 'INTERNAL' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {viewTab === 'INTERNAL' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Incharge</label>
                                        <Select value={formData.inchargeId} onValueChange={(val) => setFormData({ ...formData, inchargeId: val })}>
                                            <SelectTrigger className="h-10 bg-white">
                                                <SelectValue placeholder="Assign responsible user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Unassigned</SelectItem>
                                                {users.map(u => (
                                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                                        Attach Documents
                                    </label>
                                    <label className="border border-dashed border-zinc-300 rounded-lg p-3 flex flex-col items-center justify-center hover:bg-zinc-50 hover:border-emerald-500 transition-colors cursor-pointer group bg-white h-[60px]">
                                        <div className="flex items-center gap-2 text-zinc-500 group-hover:text-emerald-600">
                                            <Upload className="w-4 h-4" />
                                            <span className="text-xs font-bold">Drag & Drop or Click <span className="font-normal">(Max 5)</span></span>
                                        </div>
                                        <input type="file" className="hidden" multiple accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, setFiles, files)} />
                                    </label>
                                </div>
                            </div>
                            
                            {/* Existing File Mount */}
                            {((activeTicket?.attachments && activeTicket.attachments.length > 0) || files.length > 0) && (
                                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg space-y-2 shadow-inner">
                                    {activeTicket?.attachments && activeTicket.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2.5">
                                            {activeTicket.attachments.map((att: any, i: number) => (
                                                <a key={i} href={att.data} download={att.name} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-bold text-zinc-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700 transition-colors">
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span className="max-w-[120px] truncate">{att.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {files.length > 0 && (
                                        <div className="space-y-1.5 mt-2">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white p-2 text-xs border border-emerald-100 rounded-md shadow-sm text-emerald-800 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Upload className="w-3.5 h-3.5 text-emerald-500" />
                                                        {f.name}
                                                    </div>
                                                    <button onClick={() => removeFile(i, setFiles, files)} className="text-rose-500 hover:text-rose-700 px-2 font-bold cursor-pointer transition-colors text-base">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Display Closed Logic */}
                            {activeTicket?.isClosed && (
                                 <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-inner">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Formally Closed</h4>
                                    <p className="text-sm text-emerald-900 leading-relaxed font-medium mb-4">{activeTicket.closeReason}</p>
                                    {activeTicket.closeAttachments && Array.isArray(activeTicket.closeAttachments) && activeTicket.closeAttachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2.5 pt-4 border-t border-emerald-200/50">
                                            {activeTicket.closeAttachments.map((att: any, i: number) => (
                                                <a key={i} href={att.data} download={att.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-md text-xs font-bold text-emerald-700 shadow-sm hover:border-emerald-400">
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span className="max-w-[150px] truncate">{att.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!activeTicket?.isClosed && (
                                <div className="flex gap-3 justify-end pt-6 border-t border-zinc-200 mt-6">
                                    {activeTicket && (
                                        <Button variant="outline" onClick={() => { setEditModalOpen(false); setCloseModalOpen(true); }} className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-bold mr-auto">
                                            <Lock className="w-4 h-4 mr-2" /> Close Ticket
                                        </Button>
                                    )}
                                    <Button variant="ghost" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSaveTicket} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-sm">
                                        {saving ? "Saving..." : activeTicket ? "Update Ticket" : "Generate Ticket"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* 右侧评论区 / Right Side Comments */}
                        <div className="w-[350px] shrink-0 flex flex-col h-full bg-[#FAFAFC] relative overflow-hidden">
                            <div className="p-5 border-b border-zinc-200/50 bg-white/50 shrink-0 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                                <h3 className="font-bold flex items-center gap-2 text-zinc-800 text-[15px] tracking-tight">
                                    <MessageSquare className="w-4 h-4 text-indigo-500" /> Discussion & Updates
                                </h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 relative">
                                {formData.comments && formData.comments.length > 0 ? (
                                    formData.comments.map((c: any, i: number) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-2 relative group hover:border-indigo-100 transition-colors">
                                            <div className="flex justify-between items-center bg-zinc-50 -mx-4 -mt-4 p-3.5 rounded-t-2xl border-b border-zinc-100">
                                                <span className="font-semibold text-[11px] uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">System Session</span>
                                                <div className="flex gap-3 items-center">
                                                    <span className="text-[10px] text-zinc-400 font-medium">{new Date(c.date).toLocaleString('en-GB')}</span>
                                                    {i === formData.comments.length - 1 && !activeTicket?.isClosed && (
                                                        <button 
                                                            title="Delete last comment" 
                                                            onClick={() => handleDeleteComment(i)} 
                                                            className="text-zinc-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-zinc-700 leading-relaxed font-medium mt-1.5 whitespace-pre-wrap">{c.text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-8 bg-white border border-zinc-200 border-dashed rounded-2xl text-zinc-400 text-sm shadow-sm mt-8 mx-4">
                                        No comments yet. Start the timeline update below!
                                    </div>
                                )}
                            </div>

                            {!activeTicket?.isClosed && (
                                <div className="p-4 bg-white border-t border-zinc-200 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)] shrink-0 z-10">
                                    <div className="bg-white p-2 rounded-2xl border border-zinc-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100/50 transition-all flex gap-2 items-end shadow-sm">
                                        <textarea
                                            className="flex-1 resize-none border-0 bg-transparent focus:ring-0 text-sm px-3 py-2.5 placeholder:text-zinc-400 text-zinc-700 font-medium"
                                            rows={2}
                                            placeholder="Add an update or internal comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                                        />
                                        <Button onClick={handleAddComment} disabled={!newComment.trim()} className="h-10 px-5 shrink-0 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-bold mb-1 mr-1 text-white shadow-sm transition-all">
                                            Post
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Separate Modal for Ticket Closure */}
            <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
                <DialogContent className="sm:max-w-md border-t-4 border-t-rose-500 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-5 border-b border-zinc-100 bg-white">
                        <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2 uppercase tracking-wide">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> Ticket Closure Protocols
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
                                <label className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">Final Documents</label>
                                <Input type="file" multiple accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, setCloseFiles, closeFiles)} className="bg-white border-rose-200 text-xs shadow-sm h-9"/>
                                {closeFiles.length > 0 && (
                                    <div className="mt-2 text-[11px] text-rose-700 font-bold px-1">{closeFiles.length} file(s) primed for closure mount.</div>
                                )}
                            </div>
                            <Button onClick={handleCloseTicket} disabled={saving} className="w-full bg-rose-600 hover:bg-rose-700 shadow-md font-bold mt-2 h-11 text-[15px]">
                                {saving ? "Processing..." : "Complete & Close Formal Ticket"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* View Only Detail Modal */}
            <Dialog open={viewDetailModalOpen} onOpenChange={setViewDetailModalOpen}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
                    <DialogHeader className="p-6 border-b border-zinc-100 shrink-0 bg-zinc-50">
                        <DialogTitle className="text-xl font-bold flex items-center justify-between text-zinc-800">
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Ticket Details View
                                <span className="text-xs bg-white px-2 py-1 rounded font-mono border border-zinc-200 ml-2 shadow-sm">{activeTicket?.ticketNo}</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto bg-zinc-50/50 p-6">
                        {activeTicket && (
                            <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                <div className="col-span-2 md:col-span-1 space-y-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Target Date</label>
                                        <div className="text-sm font-medium text-zinc-900 mt-1">{formatDate(activeTicket.targetDate)}</div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Assigned Incharge</label>
                                        <div className="text-sm font-medium text-zinc-900 mt-1">{activeTicket.incharge?.name || 'Unassigned'}</div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                                        <div className="mt-1">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${activeTicket.isClosed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {activeTicket.isClosed ? 'CLOSED' : activeTicket.status}
                                            </span>
                                        </div>
                                    </div>
                                    {activeTicket.order && (
                                        <div>
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Associated Order</label>
                                            <div className="text-sm font-medium text-indigo-700 mt-1 cursor-pointer hover:underline">{activeTicket.order.orderNo}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2 md:col-span-1 space-y-4">
                                    <div className="h-full">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Full Details Description</label>
                                        <div className="text-sm font-medium text-zinc-800 mt-1 bg-zinc-50 p-4 rounded-lg border border-zinc-100 whitespace-pre-wrap leading-relaxed h-[calc(100%-24px)] overflow-y-auto">
                                            {activeTicket.details || 'No extended description provided.'}
                                        </div>
                                    </div>
                                </div>

                                {activeTicket.attachments?.length > 0 && (
                                    <div className="col-span-2 pt-4 border-t border-zinc-100">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Attached Documents</label>
                                        <div className="flex flex-wrap gap-2">
                                            {activeTicket.attachments.map((att: any, i: number) => (
                                                <a key={i} href={att.data} download={att.name} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-bold text-zinc-600 shadow-sm hover:bg-white hover:text-indigo-600 transition-colors">
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span className="max-w-[200px] truncate">{att.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTicket?.isClosed && (
                            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Formal Closure Report</h4>
                                <p className="text-sm text-emerald-900 leading-relaxed font-medium mb-4">{activeTicket.closeReason}</p>
                                {activeTicket.closeAttachments && Array.isArray(activeTicket.closeAttachments) && activeTicket.closeAttachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2.5 pt-4 border-t border-emerald-200/50">
                                        {activeTicket.closeAttachments.map((att: any, i: number) => (
                                            <a key={i} href={att.data} download={att.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-md text-xs font-bold text-emerald-700 shadow-sm hover:border-emerald-400">
                                                <Download className="w-3.5 h-3.5" />
                                                <span className="max-w-[150px] truncate">{att.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTicket?.comments?.length > 0 && (
                            <div className="mt-6 space-y-3 pb-6">
                                <h4 className="text-[12px] font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-indigo-400" /> Discussion History
                                </h4>
                                {activeTicket.comments.map((c: any, i: number) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                                        <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2 border-b border-zinc-100 pb-2">
                                            {new Date(c.date).toLocaleString()}
                                        </div>
                                        <div className="text-zinc-800 text-sm whitespace-pre-wrap">{c.text}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-zinc-200 shrink-0 flex justify-end bg-white">
                         <Button onClick={() => setViewDetailModalOpen(false)} variant="outline" className="font-bold text-zinc-700">Close Viewer</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
