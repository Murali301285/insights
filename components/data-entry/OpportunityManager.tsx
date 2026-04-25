"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, ChevronsUpDown, Loader2, Plus, Eye, Trash, Clock, MessageSquare, Send, User, Download, Save, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { CreatableCategorySelect } from "@/components/ui/creatable-category-select"

type MasterData = {
    customers: any[]
    categories: any[]
    paymentTypes: any[]
    zones: any[]
    statuses: any[]
    users: any[]
}

function SearchableSelect({ items, value, onChange, placeholder, disabled }: any) {
    const [open, setOpen] = useState(false)
    const selected = items.find((i: any) => i.value?.toString() === value?.toString())

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between h-8 px-2 min-w-[120px] font-normal text-xs bg-white border-emerald-200 hover:bg-zinc-50"
                >
                    <span className="truncate">{selected ? selected.label : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 shadow-lg border-zinc-200">
                <Command>
                    <CommandInput placeholder="Search..." className="h-8 text-xs border-none focus:ring-0" />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup>
                            {items.map((item: any) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    onSelect={() => {
                                        onChange(item.value)
                                        setOpen(false)
                                    }}
                                    className="text-xs cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-emerald-600",
                                            value?.toString() === item.value?.toString() ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function CreatableMultiSelect({ items, values, onChange, placeholder, disabled, activeCompanyId, onOptionCreated }: any) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [creating, setCreating] = useState(false)

    const selectedItems = items.filter((i: any) => values.includes(i.value?.toString()))

    const handleCreate = async () => {
        const val = inputValue.trim()
        if(!val) return
        if(!/^[a-zA-Z0-9 -]+$/.test(val)) {
            toast.error("Invalid category name. Only letters, numbers, spaces, and hyphens are allowed.")
            return
        }
        if(val.length > 20) {
            toast.error("Category name must be 20 characters or less.")
            return
        }

        setCreating(true)
        try {
            const res = await fetch("/api/config/category", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryName: val, companyId: activeCompanyId })
            })
            if(res.ok) {
                const newCat = await res.json()
                toast.success("Category added dynamically")
                onOptionCreated(newCat)
                onChange([...values, newCat.slno.toString()])
                setInputValue("")
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to add category")
            }
        } catch(e) {
            toast.error("Failed to create category")
        } finally {
            setCreating(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between h-auto min-h-[36px] px-2 min-w-[120px] font-normal text-xs bg-white border-emerald-200 hover:bg-zinc-50"
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedItems.length > 0 ? selectedItems.map((s:any) => (
                            <span key={s.value} className="bg-zinc-100 px-1.5 py-0.5 rounded flex items-center gap-1 border border-zinc-200">
                                {s.label}
                                <button type="button" onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(values.filter((v:any) => v !== s.value.toString()))
                                }}><X className="w-3 h-3 text-zinc-400 hover:text-red-500" /></button>
                            </span>
                        )) : <span className="opacity-50 mt-1">{placeholder}</span>}
                    </div>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50 mt-1" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 shadow-lg border-zinc-200">
                <Command>
                    <CommandInput 
                        placeholder="Search or add new..." 
                        className="h-8 text-xs border-none focus:ring-0" 
                        value={inputValue}
                        onValueChange={setInputValue}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const exists = items.some((i:any) => i.label.toLowerCase() === inputValue.trim().toLowerCase());
                                if(!exists && inputValue.trim()) handleCreate();
                            }
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {inputValue.trim() ? (
                                <div className="p-2 text-xs text-center">
                                    <Button size="sm" variant="ghost" className="w-full text-emerald-600 font-bold" onClick={handleCreate} disabled={creating}>
                                        {creating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                                        Create "{inputValue}"
                                    </Button>
                                </div>
                            ) : "No item found."}
                        </CommandEmpty>
                        <CommandGroup>
                            {items.map((item: any) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    onSelect={() => {
                                        if(values.includes(item.value?.toString())) {
                                            onChange(values.filter((v:any) => v !== item.value?.toString()))
                                        } else {
                                            onChange([...values, item.value?.toString()])
                                        }
                                    }}
                                    className="text-xs cursor-pointer"
                                >
                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-emerald-500", values.includes(item.value?.toString()) ? "bg-emerald-500 text-white" : "opacity-50 [&_svg]:invisible")}>
                                        <Check className="h-3 w-3" />
                                    </div>
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}


export function OpportunityManager({ onClose, activeCompanyId }: { onClose?: () => void, activeCompanyId: string }) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [opportunities, setOpportunities] = useState<any[]>([])
    const [weeklyItems, setWeeklyItems] = useState<string[]>([])
    const [masters, setMasters] = useState<MasterData>({
        customers: [], categories: [], paymentTypes: [], zones: [], statuses: [], users: []
    })

    // New Entry State
    const [newEntry, setNewEntry] = useState<{
        date: string,
        opportunityName: string,
        customerId: string,
        categoryIds: string[],
        value: string,
        paymentTypeId: string,
        zoneId: string,
        statusId: string,
        inchargeId: string,
        remarks: string
    }>({
        date: new Date().toISOString().split('T')[0],
        opportunityName: "",
        customerId: "",
        categoryIds: [],
        value: "",
        paymentTypeId: "",
        zoneId: "",
        statusId: "",
        inchargeId: "",
        remarks: ""
    })

    // Table State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [pageSize, setPageSize] = useState<number>(10)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // View Modal State
    const [viewOpp, setViewOpp] = useState<any | null>(null)
    const [newComment, setNewComment] = useState("")
    const [postingComment, setPostingComment] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [stageFilter, setStageFilter] = useState<'In Progress' | 'Win' | 'Loss'>('In Progress')
    const [searchQuery, setSearchQuery] = useState('')

    // Stage Change Remarks State
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{statusId: number, statusName: string} | null>(null)
    const [statusRemarks, setStatusRemarks] = useState("")

    useEffect(() => {
        fetchAllData()
    }, [activeCompanyId])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            const qs = `?companyId=${activeCompanyId}`;
            const [custRes, catRes, payRes, zoneRes, statRes, usrRes, oppRes, wrRes] = await Promise.all([
                fetch(`/api/config/customer${qs}`),
                fetch("/api/config/category"),
                fetch("/api/config/payment-type"),
                fetch(`/api/config/zone${qs}`),
                fetch(`/api/config/status${qs}`),
                fetch("/api/config/user"),
                fetch(`/api/sales/opportunities${qs}`),
                fetch('/api/weekly-review?type=items')
            ])

            const [customers, categories, paymentTypes, zones, statuses, users, opps, wrItems] = await Promise.all([
                custRes.json(), catRes.json(), payRes.json(), zoneRes.json(), statRes.json(), usrRes.json(), oppRes.json(), wrRes.json()
            ])

            setMasters({ customers, categories, paymentTypes, zones, statuses, users })
            setOpportunities(Array.isArray(opps) ? opps : [])
            setWeeklyItems(Array.isArray(wrItems) ? wrItems.filter((i: any) => i.module === 'sales').map((i: any) => i.itemId) : [])

            // Auto select initial status if available
            if (Array.isArray(statuses) && statuses.length > 0 && !newEntry.statusId) {
                setNewEntry(prev => ({ ...prev, statusId: statuses[0].slno.toString() }))
            }
        } catch (error) {
            toast.error("Failed to load pipeline data")
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = (opp: any) => {
        setEditingId(opp.id);
        setNewEntry({
            date: new Date(opp.date).toISOString().split('T')[0],
            opportunityName: opp.opportunityName || "",
            customerId: opp.customerId?.toString() || "",
            categoryIds: opp.categories?.map((c: any) => c.slno.toString()) || [],
            value: opp.value?.toString() || "",
            paymentTypeId: opp.paymentTypeId?.toString() || "",
            zoneId: opp.zoneId?.toString() || "",
            statusId: opp.statusId?.toString() || masters.statuses[0]?.slno?.toString() || "",
            inchargeId: opp.inchargeId || "",
            remarks: opp.remarks || ""
        });
        setIsAddModalOpen(true);
    };

    const handleSave = async () => {
        if (!newEntry.opportunityName || !newEntry.customerId || !newEntry.value || !newEntry.statusId || newEntry.categoryIds.length === 0 || !newEntry.paymentTypeId || !newEntry.zoneId || !newEntry.inchargeId) {
            toast.error("Please complete all required fields (marked with *)")
            return
        }

        setSaving(true)
        try {
            const payload: any = { ...newEntry, value: parseFloat(newEntry.value.replace(/,/g, '')) || 0 };
            if (editingId) payload.id = editingId;

            const res = await fetch("/api/sales/opportunities", {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(editingId ? "Opportunity updated" : "Opportunity added to pipeline")
                setIsAddModalOpen(false)
                setEditingId(null)
                setNewEntry({
                    date: new Date().toISOString().split('T')[0],
                    opportunityName: "",
                    customerId: "",
                    categoryIds: [],
                    value: "",
                    paymentTypeId: "",
                    zoneId: "",
                    statusId: masters.statuses[0]?.slno?.toString() || "",
                    inchargeId: "",
                    remarks: ""
                })
                fetchOpportunities()
            } else {
                const err = await res.json()
                toast.error(err.error || "Failed to save")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSaving(false)
        }
    }

    const fetchOpportunities = async () => {
        try {
            const [res, wrRes] = await Promise.all([
                fetch(`/api/sales/opportunities?companyId=${activeCompanyId}`),
                fetch('/api/weekly-review?type=items')
            ])
            const opps = await res.json()
            const wrItems = await wrRes.json()
            
            setOpportunities(Array.isArray(opps) ? opps : [])
            setWeeklyItems(Array.isArray(wrItems) ? wrItems.filter((i: any) => i.module === 'sales').map((i: any) => i.itemId) : [])

            // Update viewOpp if it's currently open
            if (viewOpp) {
                const updated = opps.find((o: any) => o.id === viewOpp.id)
                if (updated) setViewOpp(updated)
            }
        } catch (e) { }
    }

    const toggleWeeklyReview = async (id: string) => {
        try {
            const res = await fetch("/api/weekly-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle_item", module: "sales", itemId: id })
            })
            if (res.ok) {
                if (weeklyItems.includes(id)) {
                    setWeeklyItems(weeklyItems.filter(i => i !== id))
                    toast.success("Removed from Weekly Review")
                } else {
                    setWeeklyItems([...weeklyItems, id])
                    toast.success("Added to Weekly Review")
                }
            }
        } catch (e) {
            toast.error("Failed to update weekly review status")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this opportunity?")) return
        try {
            const res = await fetch(`/api/sales/opportunities?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Deleted successfully")
                fetchOpportunities()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const handlePostComment = async () => {
        if (!newComment.trim() || !viewOpp) return
        setPostingComment(true)
        try {
            const res = await fetch("/api/sales/opportunities/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ opportunityId: viewOpp.id, comment: newComment })
            })
            if (res.ok) {
                setNewComment("")
                fetchOpportunities()
            }
        } catch (e) {
            toast.error("Failed to post comment")
        } finally {
            setPostingComment(false)
        }
    }

    const handleStatusUpdate = async (newStatusId: number) => {
        if (!viewOpp) return
        if (viewOpp.statusId === newStatusId) return

        const statusObj = masters.statuses.find(s => s.slno === newStatusId)
        if (statusObj) {
            setPendingStatusUpdate({ statusId: newStatusId, statusName: statusObj.statusName })
            setStatusRemarks("")
        }
    }

    const confirmStatusUpdate = async () => {
        if (!viewOpp || !pendingStatusUpdate) return
        
        setUpdatingStatus(true)
        try {
            const res = await fetch("/api/sales/opportunities", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    ...viewOpp, 
                    statusId: pendingStatusUpdate.statusId,
                    statusRemarks: statusRemarks
                })
            })
            if (res.ok) {
                toast.success(`Stage updated to ${pendingStatusUpdate.statusName}`)
                setPendingStatusUpdate(null)
                setStatusRemarks("")
                fetchOpportunities()
            } else {
                toast.error("Failed to update status")
            }
        } catch (e) {
            toast.error("An error occurred during stage update")
        } finally {
            setUpdatingStatus(false)
        }
    }

    // Currency Formatter for Input
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let rawValue = e.target.value.replace(/[^0-9.]/g, '');
        const parts = rawValue.split('.');
        if (parts[0]) {
            let numStr = parts[0];
            let lastThree = numStr.substring(numStr.length - 3);
            let otherDigits = numStr.substring(0, numStr.length - 3);
            if (otherDigits !== '') lastThree = ',' + lastThree;
            let formattedInt = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
            let formattedValue = parts.length > 1 ? `${formattedInt}.${parts[1].substring(0, 2)}` : formattedInt;
            setNewEntry({ ...newEntry, value: formattedValue });
        } else {
            setNewEntry({ ...newEntry, value: rawValue });
        }
    }

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    }

    // Formatters for Dropdowns
    const customerOpts = masters.customers.map(c => ({ label: c.customerName, value: c.slno }))
    const categoryOpts = masters.categories.map(c => ({ label: c.categoryName, value: c.slno }))
    const paymentOpts = masters.paymentTypes.map(p => ({ label: p.paymentType, value: p.slno }))
    const zoneOpts = masters.zones.map(z => ({ label: z.zoneName, value: z.slno }))
    const statusOpts = masters.statuses.map(s => ({ label: s.statusName, value: s.slno }))
    const userOpts = masters.users.map(u => ({ label: u.profileName || u.email, value: u.id }))

    const toggleCounts = useMemo(() => {
        let counts = { 'In Progress': 0, 'Win': 0, 'Loss': 0 };
        for (const opp of opportunities) {
            const s = opp.status?.statusName?.toLowerCase() || '';
            if (s.includes('win')) counts['Win']++;
            else if (s.includes('loss') || s.includes('lost')) counts['Loss']++;
            else counts['In Progress']++;
        }
        return counts;
    }, [opportunities]);

    const filteredOpportunities = opportunities.filter(opp => {
        const s = opp.status?.statusName?.toLowerCase() || '';
        const isWin = s.includes('win');
        const isLoss = s.includes('loss') || s.includes('lost');

        let matchStage = false;
        if (stageFilter === 'In Progress') matchStage = !isWin && !isLoss;
        else if (stageFilter === 'Win') matchStage = isWin;
        else if (stageFilter === 'Loss') matchStage = isLoss;

        if (!matchStage) return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return opp.opportunityName?.toLowerCase().includes(q) ||
                opp.customer?.customerName?.toLowerCase().includes(q) ||
                opp.category?.categoryName?.toLowerCase().includes(q) ||
                opp.zone?.zoneName?.toLowerCase().includes(q) ||
                (opp.incharge?.profileName || opp.incharge?.email || '').toLowerCase().includes(q);
        }
        return true;
    });

    const sortedOpportunities = useMemo(() => {
        let sortableItems = [...filteredOpportunities];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'customer') { aVal = a.customer?.customerName || ''; bVal = b.customer?.customerName || ''; }
                if (sortConfig.key === 'payment') { aVal = a.paymentType?.paymentType || ''; bVal = b.paymentType?.paymentType || ''; }
                if (sortConfig.key === 'status') { aVal = a.status?.statusName || ''; bVal = b.status?.statusName || ''; }
                if (sortConfig.key === 'oppNumber') { aVal = a.oppNumber || String(a.slno); bVal = b.oppNumber || String(b.slno); }
                if (sortConfig.key === 'slno') { aVal = a.slno; bVal = b.slno; }
                if (sortConfig.key === 'incharge') {
                    aVal = a.incharge?.profileName || a.incharge?.email || '';
                    bVal = b.incharge?.profileName || b.incharge?.email || '';
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredOpportunities, sortConfig]);

    const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedOpportunities.length / pageSize)
    const paginatedOpportunities = useMemo(() => {
        if (pageSize === -1) return sortedOpportunities;
        return sortedOpportunities.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [sortedOpportunities, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 on search or filter change
    }, [searchQuery, stageFilter, pageSize]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    }

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ChevronsUpDown className="w-3 h-3 ml-1 inline-block opacity-30" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline-block" /> : <ChevronDown className="w-3 h-3 ml-1 inline-block" />;
    }

    const handleExport = () => {
        const headers = ["SlNo", "Opp No.", "Date", "Opportunity", "Customer", "Category", "Value(INR)", "Payment", "Zone", "Status", "Incharge", "Remarks"];
        const rows = filteredOpportunities.map((opp, idx) => [
            idx + 1,
            opp.oppNumber || opp.slno,
            new Date(opp.date).toLocaleDateString(),
            opp.opportunityName,
            opp.customer?.customerName || '',
            opp.category?.categoryName || '',
            opp.value,
            opp.paymentType?.paymentType || '',
            opp.zone?.zoneName || '',
            opp.status?.statusName || '',
            opp.incharge?.profileName || opp.incharge?.email || '',
            opp.remarks || ''
        ]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `opportunities_${stageFilter.toLowerCase().replace(' ', '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (loading) return <div className="p-8 flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>

    return (
        <div className="flex-1 flex flex-col bg-zinc-50 border border-t-[0px] border-zinc-200 min-h-0 relative">

            <div className="flex justify-between items-center p-3 border-b border-zinc-200 bg-white shadow-sm z-20">
                <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/50">
                    {(['In Progress', 'Win', 'Loss'] as const).map(f => (
                        <button key={f} onClick={() => setStageFilter(f as any)} className={cn("px-4 py-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-bold rounded-md transition-all", stageFilter === f ? "bg-white text-emerald-700 shadow-sm border border-zinc-200" : "text-zinc-500 hover:text-zinc-800")}>
                            {f}
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px]", stageFilter === f ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-600")}>
                                {toggleCounts[f]}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input placeholder="Search opportunities..." className="h-8 w-64 text-xs pl-8 border-zinc-200 bg-zinc-50" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-white text-zinc-600 border-zinc-200 font-semibold" onClick={handleExport}>
                        <Download className="w-3 h-3 mr-1.5" /> Export
                    </Button>
                    <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-sm" onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-3 h-3 mr-1" /> Entry
                    </Button>
                </div>
            </div>

            {/* Table Area container */}
            <div className="flex-1 overflow-auto rounded-b-lg hide-scrollbar-bottom relative">
                <table className="text-sm text-left whitespace-nowrap bg-white w-full border-separate border-spacing-0">
                    <thead className="text-[11px] text-zinc-500 uppercase bg-zinc-100/80 sticky top-0 z-20 shadow-sm shadow-zinc-200/50">
                        <tr>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50 sticky left-0 z-30 bg-zinc-100" onClick={() => handleSort('slno')}>
                                Sl.No <SortIcon columnKey="slno" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50" onClick={() => handleSort('oppNumber')}>
                                Opp No. <SortIcon columnKey="oppNumber" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50" onClick={() => handleSort('date')}>
                                Date <SortIcon columnKey="date" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50" onClick={() => handleSort('opportunityName')}>
                                Opportunity <SortIcon columnKey="opportunityName" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50" onClick={() => handleSort('customer')}>
                                Customer <SortIcon columnKey="customer" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50 text-right" onClick={() => handleSort('value')}>
                                Value <SortIcon columnKey="value" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50" onClick={() => handleSort('payment')}>
                                Payment <SortIcon columnKey="payment" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50" onClick={() => handleSort('status')}>
                                Status <SortIcon columnKey="status" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 cursor-pointer hover:bg-zinc-200/50" onClick={() => handleSort('incharge')}>
                                Incharge <SortIcon columnKey="incharge" />
                            </th>
                            <th className="px-3 py-3 font-bold border-b border-zinc-200 sticky right-0 z-30 bg-zinc-100 shadow-[-1px_0_0_0_#e4e4e7] w-[90px] text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {/* Existing Opportunities Data */}
                        {paginatedOpportunities.map((opp, idx) => {
                            const statusLower = (opp.status?.statusName || '').toLowerCase();
                            let statusColor = "bg-zinc-100 text-zinc-700 border-zinc-200";
                            if (statusLower.includes('new') || statusLower.includes('open')) statusColor = "bg-cyan-100 text-cyan-700 border-cyan-200";
                            else if (statusLower.includes('rfq')) statusColor = "bg-purple-100 text-purple-700 border-purple-200";
                            else if (statusLower.includes('lead')) statusColor = "bg-blue-100 text-blue-700 border-blue-200";
                            else if (statusLower.includes('quot') || statusLower.includes('proposal')) statusColor = "bg-amber-100 text-amber-700 border-amber-200";
                            else if (statusLower.includes('negotiation') || statusLower.includes('progress')) statusColor = "bg-orange-100 text-orange-700 border-orange-200";
                            else if (statusLower.includes('win') || statusLower.includes('order')) statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
                            else if (statusLower.includes('loss') || statusLower.includes('lost') || statusLower.includes('cancel')) statusColor = "bg-rose-100 text-rose-700 border-rose-200";

                            const isClosed = statusLower.includes('win') || statusLower.includes('order') || statusLower.includes('loss') || statusLower.includes('lost') || statusLower.includes('cancel');
                            const isWeekly = weeklyItems.includes(opp.id);

                            return (
                                <tr key={opp.id} className={cn("group transition-colors", isWeekly ? "bg-violet-50/60 hover:bg-violet-100/60" : "hover:bg-zinc-50/80")}>
                                    <td className={cn("p-3 border-zinc-50 font-medium sticky left-0 z-10 transition-colors shadow-[1px_0_0_0_#e4e4e7]", isWeekly ? "text-violet-800 bg-violet-50/60 group-hover:bg-violet-100/60" : "text-zinc-400 bg-white group-hover:bg-zinc-50/80")}>
                                        <div className="flex items-center gap-2">
                                            {isWeekly && <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" title="Marked for Weekly Review" />}
                                            {(currentPage - 1) * (pageSize === -1 ? sortedOpportunities.length : pageSize) + idx + 1}
                                        </div>
                                    </td>
                                    <td className={cn("p-3 border-zinc-50 font-bold tracking-wider transition-colors", isWeekly ? "text-violet-900 bg-violet-50/60 group-hover:bg-violet-100/60" : "text-emerald-700 bg-white group-hover:bg-zinc-50/80")}>
                                        {opp.oppNumber || opp.slno}
                                    </td>
                                    <td className="p-3 border-zinc-50 text-zinc-600">{formatDisplayDate(opp.date)}</td>
                                    <td className="p-3 border-zinc-100 font-semibold text-zinc-900 truncate max-w-[250px]">{opp.opportunityName}</td>
                                    <td className="p-3 text-zinc-700 truncate max-w-[200px]">{opp.customer?.customerName || '-'}</td>
                                    <td className="p-3 font-medium text-right text-emerald-700">{formatCurrency(opp.value, 'INR')}</td>
                                    <td className="p-3 text-zinc-600">{opp.paymentType?.paymentType || '-'}</td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${statusColor}`}>
                                            {opp.status?.statusName || '-'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-zinc-600">{opp.incharge?.profileName || opp.incharge?.email || '-'}</td>
                                    <td className={cn("p-2 sticky right-0 z-10 shadow-[-1px_0_0_0_#e4e4e7] border-l border-zinc-200 text-center transition-colors", isWeekly ? "bg-violet-50/60 group-hover:bg-violet-100/60" : "bg-white group-hover:bg-zinc-50/80")}>
                                        <div className="flex justify-center gap-1 items-center">
                                            <button 
                                                onClick={() => toggleWeeklyReview(opp.id)}
                                                className="p-1 hover:bg-zinc-200/50 rounded text-zinc-400 hover:text-violet-600 transition-colors"
                                                title={isWeekly ? "Remove from Weekly Review" : "Add for Weekly Review"}
                                            >
                                                <div className={cn("w-4 h-4 border rounded flex items-center justify-center", isWeekly ? "bg-violet-600 border-violet-600" : "border-zinc-300")}>
                                                    {isWeekly && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </button>
                                            {!isClosed && new Date(opp.createdAt || opp.date).toDateString() === new Date().toDateString() && (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditClick(opp)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setViewOpp(opp)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {!isClosed && (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(opp.id)}>
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {paginatedOpportunities.length === 0 && (
                            <tr>
                                <td colSpan={10} className="p-8 text-center text-zinc-500 bg-white">
                                    No opportunities found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-3 border-t border-zinc-200 bg-white text-xs">
                <div className="flex items-center gap-2 text-zinc-500">
                    <span>Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="h-7 w-16 px-1 rounded border border-zinc-200 bg-zinc-50 text-zinc-700 text-xs focus:ring-0 focus:outline-none cursor-pointer"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={-1}>All</option>
                    </select>
                </div>
                {pageSize !== -1 && (
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-500">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-zinc-50 border-zinc-200 text-zinc-600" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-zinc-50 border-zinc-200 text-zinc-600" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            <Dialog open={!!viewOpp} onOpenChange={(o) => !o && setViewOpp(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-zinc-50 flex flex-col h-[85vh] shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] border-zinc-200">
                    <DialogHeader className="p-6 bg-white border-b border-zinc-200">
                        <div className="flex justify-between items-start pr-8">
                            <div>
                                <DialogTitle className="text-2xl font-bold flex flex-col gap-1">
                                    <span className="text-sm font-medium text-emerald-600 uppercase tracking-widest leading-none">Opportunity Details</span>
                                    {viewOpp?.opportunityName}
                                </DialogTitle>
                                <div className="flex flex-wrap items-center gap-2.5 mt-3 text-sm font-medium">
                                    <span className="flex items-center gap-1.5 text-zinc-500" title="Date & Age">
                                        <Calendar className="w-4 h-4" />
                                        {viewOpp ? formatDisplayDate(viewOpp.date) : ''}
                                        <span className="text-zinc-600 text-sm bg-zinc-200 px-2 py-1 rounded-md font-bold">
                                            {viewOpp ? Math.max(1, Math.ceil((new Date().getTime() - new Date(viewOpp.date).getTime()) / (1000 * 3600 * 24))) : 1} days old
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-zinc-800 px-2.5 py-1 rounded-full text-white shadow-sm" title="Customer">{viewOpp?.customer?.customerName}</span>
                                    <span className="flex items-center gap-1.5 bg-indigo-600 px-2.5 py-1 rounded-full text-white shadow-sm" title="Payment Type">{viewOpp?.paymentType?.paymentType}</span>
                                    <span className="flex items-center gap-1.5 bg-orange-500 px-2.5 py-1 rounded-full text-white shadow-sm" title="Incharge">
                                        <User className="w-3 h-3" />
                                        {(() => {
                                            if (!viewOpp?.incharge) return 'Unassigned';
                                            const name = viewOpp.incharge.profileName || viewOpp.incharge.username;
                                            return name ? `${name} (${viewOpp.incharge.email})` : viewOpp.incharge.email;
                                        })()}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-zinc-700 px-2.5 py-1 rounded-full text-white shadow-sm" title="Zone">{viewOpp?.zone?.zoneName}</span>
                                    {viewOpp?.categories && viewOpp.categories.length > 0 && viewOpp.categories.map((cat: any) => (
                                        <span key={cat.slno} className="flex items-center gap-1.5 bg-zinc-700 px-2.5 py-1 rounded-full text-white shadow-sm" title="Category">{cat.categoryName}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <Label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Current Stage</Label>
                                <SelectStatus
                                    statuses={masters.statuses}
                                    currentStatusId={viewOpp?.statusId}
                                    onUpdate={handleStatusUpdate}
                                    disabled={updatingStatus}
                                />
                                <span className="font-bold text-emerald-800 px-3 py-1.5 bg-emerald-100 rounded-lg shadow-sm text-lg mt-1 border border-emerald-200" title="Value">{viewOpp ? formatCurrency(viewOpp.value, 'INR') : ''}</span>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto p-6 grid grid-cols-3 gap-6">

                        {/* History Timeline */}
                        <div className="col-span-1 space-y-4 pr-4 border-r border-zinc-200/50">
                            <h3 className="font-bold flex items-center gap-2 text-zinc-800"><Clock className="w-4 h-4" /> Stage History</h3>
                            <div className="space-y-4 pl-2 border-l-2 border-emerald-100 relative">
                                {viewOpp?.histories?.map((h: any, i: number) => (
                                    <div key={h.id} className="relative pl-6 pb-2">
                                        <div className="absolute w-3 h-3 bg-white border-2 border-emerald-500 rounded-full -left-[7px] top-1" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-zinc-900 text-sm">{h.status?.statusName}</span>
                                            <span className="text-xs text-zinc-400 mt-0.5 whitespace-nowrap">
                                                {formatDisplayDate(i === viewOpp.histories.length - 1 ? viewOpp.date : h.startDate)} {h.endDate ? `to ${formatDisplayDate(h.endDate)}` : '(Current)'}
                                            </span>
                                            {h.daysSpent !== null && h.endDate && (
                                                <span className="inline-block mt-1.5 px-2 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-md text-xs font-bold self-start tracking-wide">
                                                    No of days: {Math.max(1, Math.ceil((new Date(h.endDate).getTime() - new Date(i === viewOpp.histories.length - 1 ? viewOpp.date : h.startDate).getTime()) / (1000 * 3600 * 24)))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comments Thread */}
                        <div className="col-span-2 flex flex-col h-full pl-2">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-zinc-800"><MessageSquare className="w-4 h-4" /> Discussion & Updates</h3>
                            <div className="flex-1 overflow-auto space-y-4 mb-4 pb-4 pr-2">
                                {viewOpp?.comments?.length > 0 ? (
                                    viewOpp.comments.map((c: any) => (
                                        <div key={c.id} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-2">
                                            <div className="flex justify-between items-center bg-zinc-50 -mx-4 -mt-4 p-3 rounded-t-2xl border-b border-zinc-100">
                                                <span className="font-semibold text-xs text-zinc-700">{c.createdBy}</span>
                                                <span className="text-[10px] text-zinc-400 font-medium">{new Date(c.createdDate).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-zinc-700 leading-relaxed font-medium mt-1">{c.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-8 bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl text-zinc-400 text-sm">
                                        No comments yet. Start the timeline update below!
                                    </div>
                                )}
                            </div>
                            <div className="mt-auto bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm shadow-zinc-200/50 flex gap-2 items-end">
                                <textarea
                                    className="flex-1 resize-none border-0 bg-transparent focus:ring-0 text-sm px-2 py-2 placeholder:text-zinc-400"
                                    rows={2}
                                    placeholder="Add an update or internal comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                                />
                                <Button onClick={handlePostComment} disabled={postingComment || !newComment.trim()} className="h-10 px-4 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                                    {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                                </Button>
                            </div>
                        </div>

                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!pendingStatusUpdate} onOpenChange={(o) => { if (!o && !updatingStatus) { setPendingStatusUpdate(null); setStatusRemarks(""); } }}>
                <DialogContent className="max-w-md bg-white p-0 shadow-lg border-zinc-200">
                    <DialogHeader className="p-5 border-b border-zinc-100 bg-zinc-50">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-600" /> Confirm Stage Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-zinc-600">
                            You are moving this opportunity to <span className="font-bold text-zinc-900">{pendingStatusUpdate?.statusName}</span>. Please provide a mandatory remark explaining this transition.
                        </p>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Remarks <span className="text-rose-500">*</span></Label>
                            <textarea
                                placeholder="E.g., Client requested alternative terms..."
                                className="w-full text-sm min-h-[80px] resize-none px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                value={statusRemarks}
                                onChange={e => setStatusRemarks(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-5 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => { setPendingStatusUpdate(null); setStatusRemarks(""); }} disabled={updatingStatus}>Cancel</Button>
                        <Button onClick={confirmStatusUpdate} disabled={updatingStatus || !statusRemarks.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                            {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Stage"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Modern Edit/Create Modal Here */}
            <Dialog open={isAddModalOpen} onOpenChange={(o) => {
                if (!o) {
                    setEditingId(null);
                    setNewEntry({
                        date: new Date().toISOString().split('T')[0],
                        opportunityName: "",
                        customerId: "",
                        categoryIds: [],
                        value: "",
                        paymentTypeId: "",
                        zoneId: "",
                        statusId: masters.statuses[0]?.slno?.toString() || "",
                        inchargeId: "",
                        remarks: ""
                    });
                }
                setIsAddModalOpen(o);
            }}>
                <DialogContent className="max-w-xl bg-white p-0 overflow-hidden shadow-xl border-zinc-200">
                    <DialogHeader className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-emerald-600" />
                            {editingId ? "Edit Opportunity" : "Entry"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-5">
                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Opportunity Name <span className="text-rose-500">*</span></Label>
                            <textarea
                                placeholder="Describe the scope or requirement..."
                                className="w-full text-sm min-h-[60px] resize-none px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                value={newEntry.opportunityName}
                                onChange={e => setNewEntry({ ...newEntry, opportunityName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Date <span className="text-rose-500">*</span></Label>
                            <Input type="date" className="h-9 border-zinc-300" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Value (INR) <span className="text-rose-500">*</span></Label>
                            <Input type="text" placeholder="0.00" className="h-9 border-zinc-300" value={newEntry.value} onChange={handleValueChange} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Customer <span className="text-rose-500">*</span></Label>
                            <SearchableSelect items={customerOpts} value={newEntry.customerId} onChange={(v: any) => setNewEntry({ ...newEntry, customerId: v })} placeholder="Select Customer" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Category <span className="text-rose-500">*</span></Label>
                            <CreatableCategorySelect 
                                categories={masters.categories} 
                                selectedIds={newEntry.categoryIds.map(Number)} 
                                onChange={(v: number[]) => setNewEntry({ ...newEntry, categoryIds: v.map(String) })} 
                                companyId={activeCompanyId}
                                apiEndpoint="/api/config/category"
                                onCategoryCreated={(newCat: any) => {
                                    setMasters(prev => ({
                                        ...prev,
                                        categories: [newCat, ...prev.categories]
                                    }))
                                }}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Zone <span className="text-rose-500">*</span></Label>
                            <SearchableSelect items={zoneOpts} value={newEntry.zoneId} onChange={(v: any) => setNewEntry({ ...newEntry, zoneId: v })} placeholder="Select Zone" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Payment Type <span className="text-rose-500">*</span></Label>
                            <SearchableSelect items={paymentOpts} value={newEntry.paymentTypeId} onChange={(v: any) => setNewEntry({ ...newEntry, paymentTypeId: v })} placeholder="Select Payment Type" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Account Manager <span className="text-rose-500">*</span></Label>
                            <SearchableSelect items={userOpts} value={newEntry.inchargeId} onChange={(v: any) => setNewEntry({ ...newEntry, inchargeId: v })} placeholder="Assign to User" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Initial Status <span className="text-rose-500">*</span></Label>
                            <SearchableSelect items={statusOpts} value={newEntry.statusId} onChange={(v: any) => setNewEntry({ ...newEntry, statusId: v })} placeholder="Select Status" />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Remarks</Label>
                            <Input placeholder="Any initial notes..." className="h-9 border-zinc-300" value={newEntry.remarks} onChange={e => setNewEntry({ ...newEntry, remarks: e.target.value })} />
                        </div>
                    </div>

                    <DialogFooter className="p-5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                            setEditingId(null);
                            setIsAddModalOpen(false);
                        }}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm min-w-[120px]">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {editingId ? "Update" : "Save"} Opportunity
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Helper to disable backward choices
function SelectStatus({ statuses, currentStatusId, onUpdate, disabled }: { statuses: any[], currentStatusId: number, onUpdate: (id: number) => void, disabled: boolean }) {
    const currentStatus = statuses.find(s => s.slno === currentStatusId)
    const currentOrder = currentStatus ? currentStatus.order : 0

    return (
        <select
            className="h-9 w-[220px] rounded-lg border-2 border-indigo-200 bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 focus:border-indigo-400 focus:ring-0 disabled:opacity-50"
            value={currentStatusId}
            onChange={(e) => onUpdate(parseInt(e.target.value))}
            disabled={disabled}
        >
            {statuses.map(s => (
                <option key={s.slno} value={s.slno} disabled={s.order < currentOrder}>
                    {s.order}. {s.statusName} {s.order < currentOrder ? '(Locked)' : ''}
                </option>
            ))}
        </select>
    )
}
