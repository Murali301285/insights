"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function SmartSummaryGrid({ module, activeCompanyId }: { module: string, activeCompanyId?: string }) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [records, setRecords] = useState<any[]>([])
    const [dynamicColumns, setDynamicColumns] = useState<any[]>([])
    
    // New Entry State
    const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().split('T')[0])
    const [newEntryData, setNewEntryData] = useState<Record<string, any>>({})
    const [remarksModalOpen, setRemarksModalOpen] = useState(false)
    const [currentRemarks, setCurrentRemarks] = useState("")
    
    // Editing
    const [editingId, setEditingId] = useState<string | null>(null)

    const tableScrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchColumnsAndData()
    }, [module, activeCompanyId])

    const fetchColumnsAndData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Dynamic Columns
            let cols: any[] = []
            if (module === 'sales' && activeCompanyId) {
                const res = await fetch(`/api/config/status?companyId=${activeCompanyId}`)
                if (res.ok) {
                    const data = await res.json()
                    const statuses = Array.isArray(data) ? data : []
                    statuses.sort((a: any, b: any) => a.order - b.order)
                    cols = statuses.map(s => s.statusName)
                }
            } else if (module === 'manufacturing') {
                const res = await fetch(`/api/config/stage${activeCompanyId ? '?companyId=' + activeCompanyId : ''}`)
                if (res.ok) {
                    const data = await res.json()
                    const stages = Array.isArray(data) ? data : []
                    stages.sort((a: any, b: any) => a.order - b.order)
                    cols = stages.map(s => s.stageName)
                }
            }
            setDynamicColumns(Array.from(new Set(cols)))

            // 2. Fetch Records
            // Using a generic metrics endpoint with specific category.
            // category: `summary_${module}`
            const recRes = await fetch(`/api/metrics?category=summary_${module}${activeCompanyId ? '&companyId=' + activeCompanyId : ''}`)
            if (recRes.ok) {
                const data = await recRes.json()
                setRecords(Array.isArray(data) ? data : [])
            } else {
                setRecords([])
            }
        } catch (e) {
            toast.error("Failed to fetch summary data")
        } finally {
            setLoading(false)
        }
    }

    const calculatePeriod = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        
        const start = new Date(d);
        start.setDate(d.getDate() - 6);
        
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

        const formatShortDate = (date: Date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        return `week ${weekNum} (${formatShortDate(start)} to ${formatShortDate(d)})`;
    }

    const formatIndianNumber = (val: string | number, isInt: boolean = false) => {
        if (val === undefined || val === null) return "";
        let numStr = String(val).replace(/[^0-9.]/g, '');
        if (isInt) numStr = numStr.split('.')[0];
        if (!numStr) return "";
        const parts = numStr.split('.');
        let intPart = parts[0];
        
        let decPart = '';
        if (!isInt) {
            decPart = parts.length > 1 ? '.' + parts[1].substring(0, 2) : '';
            if (typeof val === 'number' && parts.length === 1) decPart = '.00';
            else if (typeof val === 'number' && parts[1]?.length === 1) decPart += '0';
        }
        
        let lastThree = intPart.substring(intPart.length - 3);
        let otherDigits = intPart.substring(0, intPart.length - 3);
        if (otherDigits !== '') lastThree = ',' + lastThree;
        let formattedInt = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
        return formattedInt + decPart;
    };

    const handleNumberChange = (key: string, value: string) => {
        const isInt = key.endsWith('_nos') || ['open', 'closed', 'pending'].includes(key);
        let formatted = formatIndianNumber(value, isInt);
        const newData = { ...newEntryData, [key]: formatted };
        
        // Auto calculation for Ticket/Request
        if (module.startsWith('ticket') || module.startsWith('request')) {
            const openVal = Number(String(newData['open'] || '0').replace(/,/g, ''));
            const closedVal = Number(String(newData['closed'] || '0').replace(/,/g, ''));
            
            if (closedVal > openVal && key === 'closed') {
                toast.error("Closed tickets cannot exceed Open tickets");
                return; // Prevent update if invalid
            }
            
            newData['pending'] = formatIndianNumber(Math.max(0, openVal - closedVal), true);
        }

        setNewEntryData(newData);
    }

    const getColumnGroups = () => {
        if (module === 'sales' || module === 'manufacturing') {
            let groups: any[] = [];
            dynamicColumns.forEach(c => {
                groups.push({
                    groupName: c,
                    subColumns: [
                        { key: `${c}_nos`, label: `No(s)`, width: 100 },
                        { key: `${c}_values`, label: `Value(s)`, width: 140 }
                    ]
                });
            });
            return groups;
        } else {
            return [
                { groupName: 'Open', rowSpan: 2, subColumns: [{ key: 'open', label: 'Open', width: 120 }] },
                { groupName: 'Closed', rowSpan: 2, subColumns: [{ key: 'closed', label: 'Closed', width: 120 }] },
                { groupName: 'Pending', rowSpan: 2, subColumns: [{ key: 'pending', label: 'Pending', width: 120 }] },
            ];
        }
    }

    const columnGroups = getColumnGroups();
    const columns = columnGroups.flatMap(g => g.subColumns);

    const handleSave = async () => {
        setSaving(true)
        try {
            const processedData: any = { ...newEntryData, remarks: currentRemarks }
            for (const key in processedData) {
                if (key !== 'remarks') {
                    const cleanVal = String(processedData[key]).replace(/,/g, '')
                    processedData[key] = cleanVal ? Number(cleanVal) : 0
                }
            }

            const payload = {
                id: editingId || undefined,
                category: `summary_${module}`,
                data: processedData,
                date: newEntryDate,
                period: calculatePeriod(newEntryDate),
                companyId: activeCompanyId || 'general'
            };

            const method = 'POST';
            
            const res = await fetch('/api/metrics', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error("Failed to save")

            toast.success(editingId ? "Summary Updated" : "Summary Added")
            setNewEntryData({})
            setCurrentRemarks("")
            setEditingId(null)
            fetchColumnsAndData()
        } catch (error) {
            toast.error("Failed to save entry")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this summary record?")) return;
        try {
            const res = await fetch(`/api/metrics?category=summary_${module}&id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Record deleted");
                fetchColumnsAndData();
            } else {
                toast.error("Failed to delete");
            }
        } catch (e) {
            toast.error("Failed to delete record");
        }
    }

    const isEditable = (createdAt: string) => {
        if (!createdAt) return true;
        const now = new Date().getTime();
        const created = new Date(createdAt).getTime();
        return (now - created) <= 24 * 60 * 60 * 1000;
    }

    const handleEdit = (record: any) => {
        if (!isEditable(record.createdAt)) {
            toast.error("Cannot edit records older than 24 hours.");
            return;
        }
        setEditingId(record.id);
        const d = new Date(record.date);
        if (!isNaN(d.getTime())) {
            setNewEntryDate(d.toISOString().split('T')[0]);
        }
        
        const populated: any = {};
        columns.forEach((c: any) => {
            if (record[c.key] !== undefined && record[c.key] !== null) {
                const isInt = c.key.endsWith('_nos') || ['open', 'closed', 'pending'].includes(c.key);
                populated[c.key] = formatIndianNumber(record[c.key], isInt);
            }
        });
        setNewEntryData(populated);
        setCurrentRemarks(record.remarks || "");
        if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
    }

    const totalWidthPx = 150 + 200 + columns.reduce((acc, c) => acc + c.width, 0) + 120 + 100;

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>

    return (
        <div className="flex flex-col h-full bg-zinc-50 relative min-h-[400px]">
            <div
                ref={tableScrollRef}
                className="border-y border-zinc-200 bg-white shadow-sm overflow-auto flex-1 h-full hover-scroll pb-4"
            >
                <table className="text-sm text-left border-collapse whitespace-nowrap table-fixed w-full" style={{ minWidth: totalWidthPx }}>
                    <thead className="bg-zinc-100/80 text-zinc-600 sticky top-0 z-30 shadow-sm backdrop-blur-sm">
                        <tr>
                            <th rowSpan={2} className="p-3 font-semibold border-b border-zinc-200 sticky left-0 z-20 bg-zinc-100 shadow-[1px_0_0_0_#e4e4e7]" style={{ width: 150, minWidth: 150 }}>Date</th>
                            <th rowSpan={2} className="p-3 font-semibold border-b border-zinc-200 sticky left-[150px] z-20 bg-zinc-100 shadow-[1px_0_0_0_#e4e4e7]" style={{ width: 200, minWidth: 200 }}>Period</th>
                            {columnGroups.map((g: any, i: number) => (
                                <th key={g.groupName + i} colSpan={g.rowSpan === 2 ? 1 : g.subColumns.length} rowSpan={g.rowSpan || 1} className="p-2 font-bold text-center border-b border-zinc-200 border-x border-dashed border-zinc-200 bg-zinc-50" style={{ width: g.subColumns.reduce((a: number, c: any) => a + c.width, 0) }}>
                                    {g.groupName}
                                </th>
                            ))}
                            <th rowSpan={2} className="p-3 font-semibold border-b border-zinc-200 sticky right-[100px] z-20 bg-zinc-100 shadow-[-1px_0_0_0_#e4e4e7] border-l border-dashed border-zinc-200 text-center" style={{ width: 120, minWidth: 120 }}>Remarks</th>
                            <th rowSpan={2} className="p-3 font-semibold border-b border-zinc-200 sticky right-0 z-30 bg-zinc-100 shadow-[-1px_0_0_0_#e4e4e7] border-l border-zinc-200" style={{ width: 100, minWidth: 100 }}>Action</th>
                        </tr>
                        <tr>
                            {columnGroups.filter((g: any) => g.rowSpan !== 2).map((g: any) => (
                                g.subColumns.map((c: any) => (
                                    <th key={c.key} className="p-2 font-semibold text-center border-b border-zinc-200 border-x border-dashed border-zinc-100 bg-white text-zinc-500 text-xs" style={{ width: c.width, minWidth: c.width }}>
                                        {c.label}
                                    </th>
                                ))
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 relative z-0">
                        {/* Entry Row */}
                        <tr className="bg-emerald-50/30">
                            <td className="p-2 sticky left-0 z-10 bg-emerald-50 shadow-[1px_0_0_0_#e4e4e7]">
                                <Input
                                    type="date"
                                    value={newEntryDate}
                                    onChange={(e) => setNewEntryDate(e.target.value)}
                                    className="h-8 bg-white w-full border-emerald-200"
                                />
                            </td>
                            <td className="p-2 sticky left-[150px] z-10 bg-emerald-50 shadow-[1px_0_0_0_#e4e4e7]">
                                <Input
                                    type="text"
                                    value={calculatePeriod(newEntryDate)}
                                    readOnly
                                    className="h-8 bg-zinc-50 border-emerald-200 text-zinc-500 w-full"
                                />
                            </td>
                            {columns.map((c: any) => (
                                <td key={c.key} className="p-2 border-x border-dashed border-zinc-100">
                                    <Input
                                        type="text"
                                        placeholder="-"
                                        value={newEntryData[c.key] || ''}
                                        onChange={(e) => handleNumberChange(c.key, e.target.value)}
                                        readOnly={c.key === 'pending'}
                                        className={cn("h-8 bg-white border-emerald-200 text-zinc-900 focus-visible:ring-emerald-500 w-full", c.key === 'pending' && "bg-zinc-100 cursor-not-allowed")}
                                    />
                                </td>
                            ))}
                            <td className="p-2 sticky right-[100px] z-10 bg-emerald-50 shadow-[-1px_0_0_0_#e4e4e7] border-l border-dashed border-zinc-200 text-center">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn("h-8 text-xs border-emerald-200", currentRemarks ? "bg-emerald-100 text-emerald-800" : "bg-white text-zinc-500")}
                                    onClick={() => setRemarksModalOpen(true)}
                                >
                                    <FileText className="w-3 h-3 mr-1" /> {currentRemarks ? 'View' : 'Add'}
                                </Button>
                            </td>
                            <td className="p-2 sticky right-0 z-20 bg-emerald-50 shadow-[-1px_0_0_0_#e4e4e7] border-l border-zinc-200 text-center">
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-8 text-xs px-2"
                                    >
                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : (editingId ? <Pencil className="w-3 h-3" /> : <Plus className="w-3 h-3" />)}
                                    </Button>
                                    {editingId && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => { setEditingId(null); setNewEntryData({}); setCurrentRemarks(""); }}
                                            className="h-8 w-8 p-0 text-zinc-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>

                        {records.map((log) => (
                            <tr key={log.id} className="group hover:bg-zinc-50 transition-colors">
                                <td className="p-3 text-zinc-600 font-medium sticky left-0 z-10 bg-white group-hover:bg-zinc-50 shadow-[1px_0_0_0_#e4e4e7]">
                                    {(() => {
                                        const d = new Date(log.date)
                                        if (isNaN(d.getTime())) return '-';
                                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
                                    })()}
                                </td>
                                <td className="p-3 text-zinc-500 sticky left-[150px] z-10 bg-white group-hover:bg-zinc-50 shadow-[1px_0_0_0_#e4e4e7]">
                                    <span className="text-xs inline-block truncate w-full">
                                        {log.period || "-"}
                                    </span>
                                </td>
                                {columns.map((c: any) => {
                                    const rawVal = log[c.key];
                                    const isInt = c.key.endsWith('_nos') || ['open', 'closed', 'pending'].includes(c.key);
                                    let formattedVal = "-";
                                    
                                    if (rawVal !== undefined && rawVal !== null) {
                                        formattedVal = formatIndianNumber(rawVal, isInt);
                                    }

                                    return (
                                        <td key={c.key} className="p-3 border-x border-dashed border-zinc-100 font-medium">
                                            {formattedVal}
                                        </td>
                                    );
                                })}
                                <td className="p-3 sticky right-[100px] z-10 bg-white group-hover:bg-zinc-50 shadow-[-1px_0_0_0_#e4e4e7] border-l border-dashed border-zinc-200 text-center">
                                    {log.remarks ? (
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-600" title={log.remarks}>
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                    ) : "-"}
                                </td>
                                <td className="p-2 sticky right-0 z-20 bg-white group-hover:bg-zinc-50 shadow-[-1px_0_0_0_#e4e4e7] border-l border-zinc-200 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!isEditable(log.createdAt)}
                                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            onClick={() => handleEdit(log)}
                                            title={!isEditable(log.createdAt) ? "Editing disabled after 24 hours" : "Edit"}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!isEditable(log.createdAt)}
                                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                            title={!isEditable(log.createdAt) ? "Deletion disabled after 24 hours" : "Delete"}
                                            onClick={() => handleDelete(log.id)}
                                        >
                                            <Trash className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={columns.length + 4} className="p-8 text-center text-zinc-400">
                                    No summary entries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={remarksModalOpen} onOpenChange={setRemarksModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remarks</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Add remarks (max 5000 characters)..."
                            value={currentRemarks}
                            onChange={(e) => setCurrentRemarks(e.target.value.substring(0, 5000))}
                            className="min-h-[150px] resize-none"
                            maxLength={5000}
                        />
                        <div className="text-right text-xs text-zinc-400 mt-2">
                            {currentRemarks.length} / 5000
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
