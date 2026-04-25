"use client"
import * as React from "react"
import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { PremiumCard } from "@/components/design/PremiumCard"
import { toast } from "sonner"
import { Loader2, Plus, MessageSquare, Save, Trash, Pencil, X, Check, FileText, CalendarCheck, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(d);
}

export default function WeeklyReviewModule() {
    const { setHeaderInfo } = useHeader();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Others section state
    const [others, setOthers] = useState<any[]>([]);
    const [newOtherContent, setNewOtherContent] = useState("");
    const [editingOtherId, setEditingOtherId] = useState<string | null>(null);
    const [editOtherContent, setEditOtherContent] = useState("");

    // View Modal State
    const [viewItemModalOpen, setViewItemModalOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<any>(null);
    const [activeItemType, setActiveItemType] = useState<string>("");

    // History View State
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // Current date logic
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNo = Math.ceil(days / 7);

    useEffect(() => {
        setHeaderInfo(
            `Weekly Review - Week ${weekNo}, ${today.getFullYear()} (${formatDate(today.toISOString())})`, 
            "Executive tracking and status update matrix for all operational verticals."
        );
    }, [setHeaderInfo, weekNo, today]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/weekly-review/details');
            if (res.ok) {
                const json = await res.json();
                setData(json);
                setOthers(json.others || []);
            } else {
                toast.error("Failed to fetch review data");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddOther = async () => {
        if (!newOtherContent.trim()) return;
        try {
            const res = await fetch('/api/weekly-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_other',
                    content: newOtherContent,
                    createdBy: "Admin"
                })
            });
            if (res.ok) {
                setNewOtherContent("");
                fetchData();
                toast.success("Item added");
            }
        } catch (e) {
            toast.error("Failed to add item");
        }
    }

    const handleUpdateOther = async (id: string, content: string, disabled?: boolean) => {
        try {
            const res = await fetch('/api/weekly-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_other',
                    id,
                    content,
                    disabled
                })
            });
            if (res.ok) {
                setEditingOtherId(null);
                fetchData();
                toast.success("Item updated");
            }
        } catch (e) {
            toast.error("Failed to update item");
        }
    }

    const handleDeleteOther = async (id: string) => {
        if (!confirm("Are you sure you want to delete this discussion point?")) return;
        try {
            const res = await fetch('/api/weekly-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_other', id })
            });
            if (res.ok) {
                fetchData();
                toast.success("Item deleted");
            }
        } catch (e) {
            toast.error("Failed to delete item");
        }
    }

    const handleCompleteMeeting = async () => {
        if (!confirm("Are you sure you want to complete this meeting? This will archive all marked items and reset the current board.")) return;
        try {
            const res = await fetch('/api/weekly-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete_meeting' })
            });
            if (res.ok) {
                fetchData();
                toast.success("Meeting completed and archived!");
            }
        } catch (e) {
            toast.error("Failed to complete meeting");
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                <p className="font-medium animate-pulse">Aggregating Weekly Review Data...</p>
            </div>
        )
    }

    const sections = [
        { title: "Finance", data: [], columns: [] },
        { 
            title: "Business Acquisition", 
            data: data?.opportunities || [],
            columns: [
                { header: "Opp Number", render: (r: any) => <span className="font-bold text-violet-700">{r.oppNumber || r.slno}</span> },
                { header: "Opportunity", render: (r: any) => r.opportunityName },
                { header: "Customer", render: (r: any) => r.customer?.customerName || '-' },
                { header: "Status", render: (r: any) => r.status?.statusName || '-' },
                { header: "Incharge", render: (r: any) => r.incharge?.name || '-' },
            ]
        },
        { 
            title: "Order Fulfillment", 
            data: data?.orders || [],
            columns: [
                { header: "Order No.", render: (r: any) => <span className="font-bold text-violet-700">{r.orderNo}</span> },
                { header: "Target Date", render: (r: any) => formatDate(r.targetComplete) },
                { header: "Project Brief", render: (r: any) => r.opportunity?.opportunityName || '-' },
                { header: "Stage", render: (r: any) => r.currentStage?.stageName || '-' },
            ]
        },
        { 
            title: "Support", 
            data: data?.tickets || [],
            columns: [
                { header: "Ticket No.", render: (r: any) => <span className="font-bold text-violet-700">{r.ticketNo}</span> },
                { header: "Date", render: (r: any) => formatDate(r.date) },
                { header: "Details", render: (r: any) => r.details },
                { header: "Status", render: (r: any) => r.status },
                { header: "Incharge", render: (r: any) => r.incharge?.name || '-' },
            ]
        },
        { title: "HR", data: [], columns: [] },
        { 
            title: "Supply Chain", 
            data: data?.requests || [],
            columns: [
                { header: "Request No.", render: (r: any) => <span className="font-bold text-violet-700">{r.requestNo}</span> },
                { header: "Date", render: (r: any) => formatDate(r.date) },
                { header: "Details", render: (r: any) => r.details },
                { header: "Stage", render: (r: any) => r.stage?.statusName || '-' },
                { header: "Incharge", render: (r: any) => r.incharge?.name || '-' },
            ]
        },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            
            {/* Main Sections */}
            {sections.map((section, idx) => (
                <PremiumCard key={idx} className="overflow-hidden shadow-sm border border-violet-100">
                    <div className="bg-gradient-to-r from-violet-50 to-white px-6 py-4 border-b border-violet-100 flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-tight text-violet-950 uppercase">{section.title}</h2>
                        <span className="text-xs font-bold bg-violet-100 text-violet-800 px-3 py-1 rounded-full border border-violet-200">
                            {section.data.length} Items Marked
                        </span>
                    </div>

                    <div className="p-0">
                        {section.data.length === 0 ? (
                            <div className="p-8 text-center text-zinc-400 bg-zinc-50/50">
                                <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-sm">No items marked for weekly review in this section.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                                        <tr>
                                            {section.columns.map((col: any, i: number) => (
                                                <th key={i} className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">{col.header}</th>
                                            ))}
                                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {section.data.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-violet-50/30 transition-colors group">
                                                {section.columns.map((col: any, j: number) => (
                                                    <td key={j} className="px-6 py-4 text-zinc-700">
                                                        {col.render(row)}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="outline" size="sm" className="h-8 gap-2 text-violet-700 border-violet-200 hover:bg-violet-50 shadow-sm" onClick={() => {
                                                        setActiveItem(row);
                                                        setActiveItemType(section.title);
                                                        setViewItemModalOpen(true);
                                                    }}>
                                                        <MessageSquare className="w-3.5 h-3.5" /> View / Comment
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </PremiumCard>
            ))}

            {/* Others Section */}
            <PremiumCard className="overflow-hidden shadow-sm border border-emerald-100 mt-12">
                <div className="bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-emerald-100">
                    <h2 className="text-xl font-black tracking-tight text-emerald-950 uppercase">Other Discussion Points</h2>
                    <p className="text-xs text-emerald-700 font-medium mt-1">Add ad-hoc items, risks, or topics to be discussed in the weekly meeting.</p>
                </div>

                <div className="p-6 bg-zinc-50/50">
                    <div className="space-y-4 mb-8">
                        {others.length === 0 ? (
                            <div className="text-center py-6 text-zinc-400 text-sm italic border-2 border-dashed border-zinc-200 rounded-xl">
                                No discussion points added yet.
                            </div>
                        ) : (
                            others.map((item) => (
                                <div key={item.id} className={cn("bg-white p-4 rounded-xl border transition-all shadow-sm flex items-start gap-4", item.disabled ? "opacity-50 border-zinc-200 grayscale" : "border-emerald-100")}>
                                    <div className="flex-1 space-y-2">
                                        {editingOtherId === item.id ? (
                                            <div className="space-y-3">
                                                <Textarea 
                                                    value={editOtherContent}
                                                    onChange={e => setEditOtherContent(e.target.value)}
                                                    className="w-full text-sm font-medium resize-none min-h-[80px]"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleUpdateOther(item.id, editOtherContent)} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs font-bold">
                                                        <Save className="w-3.5 h-3.5 mr-1" /> Save
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditingOtherId(null)} className="h-8 text-xs font-bold">
                                                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-zinc-800 font-medium whitespace-pre-wrap leading-relaxed">
                                                {item.content}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-400 font-black">
                                            <span>Created by {item.createdBy || "Admin"}</span>
                                            <span>&bull;</span>
                                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    {!editingOtherId && (
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingOtherId(item.id); setEditOtherContent(item.content); }} className="w-8 h-8 rounded-lg text-blue-600 hover:bg-blue-50">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleUpdateOther(item.id, item.content, !item.disabled)} className={cn("w-8 h-8 rounded-lg", item.disabled ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50")} title={item.disabled ? "Enable" : "Disable"}>
                                                {item.disabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteOther(item.id)} className="w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50">
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-inner">
                        <label className="text-[11px] font-black uppercase tracking-widest text-emerald-800 mb-2 block">New Discussion Point</label>
                        <Textarea 
                            placeholder="Type new discussion topic here..." 
                            value={newOtherContent}
                            onChange={(e) => setNewOtherContent(e.target.value)}
                            className="w-full bg-emerald-50/30 border-emerald-100 focus-visible:ring-emerald-500 mb-4 min-h-[100px] resize-none"
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleAddOther} disabled={!newOtherContent.trim()} className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-500/20 px-8">
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </div>
                    </div>
                </div>
            </PremiumCard>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-8">
                <Button variant="outline" className="gap-2 font-bold shadow-sm" onClick={() => setHistoryModalOpen(true)}>
                    <History className="w-4 h-4 text-violet-600" /> View Previous Reviews
                </Button>
                
                <Button onClick={handleCompleteMeeting} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 shadow-lg shadow-emerald-600/20 gap-2">
                    <CalendarCheck className="w-4 h-4" /> Meeting Completed - Archive & Reset
                </Button>
            </div>

            {/* History Modal */}
            <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-xl border-zinc-200 shadow-2xl h-[80vh] flex flex-col">
                    <DialogHeader className="border-b pb-4 shrink-0">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <History className="w-5 h-5 text-violet-600" /> Previous Weekly Reviews
                        </DialogTitle>
                        <DialogDescription>
                            Archive of all completed weekly reviews and discussion points.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto py-4 space-y-6">
                        {(!data?.history || data.history.length === 0) ? (
                            <div className="text-center py-12 text-zinc-400 italic">No previous reviews found.</div>
                        ) : (
                            data.history.map((hist: any, index: number) => (
                                <div key={hist.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                                        <h3 className="font-black text-violet-950 text-lg">Week {hist.weekNo}, {hist.year}</h3>
                                        <span className="text-xs font-bold text-zinc-500 bg-white px-2 py-1 rounded border shadow-sm">
                                            {formatDate(hist.date)}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex gap-4 items-center text-sm font-semibold text-zinc-600 bg-white p-3 rounded-lg border">
                                            <div><span className="text-violet-600 font-black">{hist.items?.length || 0}</span> Items Reviewed</div>
                                            <div className="w-px h-4 bg-zinc-200"></div>
                                            <div><span className="text-emerald-600 font-black">{hist.others?.length || 0}</span> Discussion Points</div>
                                        </div>
                                        {hist.others && hist.others.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Discussion Notes:</h4>
                                                <ul className="space-y-2">
                                                    {hist.others.map((o: any) => (
                                                        <li key={o.id} className="text-sm bg-white p-3 rounded-md border border-emerald-50 text-zinc-700 whitespace-pre-wrap">
                                                            {o.content}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )).reverse()
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={viewItemModalOpen} onOpenChange={setViewItemModalOpen}>
                <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-zinc-200 shadow-2xl">
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <span className="text-violet-700 uppercase">{activeItemType}</span>
                            <span className="text-zinc-300">|</span>
                            <span className="text-zinc-800">Item Review</span>
                        </DialogTitle>
                        <DialogDescription>
                            Detailed view and comments for the selected item.
                        </DialogDescription>
                    </DialogHeader>

                    {activeItem && (
                        <div className="py-4 space-y-6">
                            <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
                                {activeItemType === "Business Acquisition" && (
                                    <>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Opp Number</span><span className="font-semibold text-zinc-900">{activeItem.oppNumber || activeItem.slno}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Name</span><span className="font-semibold text-zinc-900">{activeItem.opportunityName}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Customer</span><span className="font-semibold text-zinc-900">{activeItem.customer?.customerName || '-'}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Value</span><span className="font-semibold text-zinc-900">{activeItem.value?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '-'}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Status</span><span className="font-semibold text-zinc-900">{activeItem.status?.statusName || '-'}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Incharge</span><span className="font-semibold text-zinc-900">{activeItem.incharge?.name || '-'}</span></div>
                                    </>
                                )}
                                {activeItemType === "Order Fulfillment" && (
                                    <>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Order No</span><span className="font-semibold text-zinc-900">{activeItem.orderNo}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Project Brief</span><span className="font-semibold text-zinc-900">{activeItem.opportunity?.opportunityName || '-'}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Target Date</span><span className="font-semibold text-zinc-900">{formatDate(activeItem.targetComplete)}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Current Stage</span><span className="font-semibold text-zinc-900">{activeItem.currentStage?.stageName || '-'}</span></div>
                                    </>
                                )}
                                {activeItemType === "Support" && (
                                    <>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Ticket No</span><span className="font-semibold text-zinc-900">{activeItem.ticketNo}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Type</span><span className="font-semibold text-zinc-900">{activeItem.type}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Target Date</span><span className="font-semibold text-zinc-900">{formatDate(activeItem.targetDate)}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Status</span><span className="font-semibold text-zinc-900">{activeItem.status}</span></div>
                                        <div className="col-span-2"><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Details</span><span className="font-semibold text-zinc-900">{activeItem.details}</span></div>
                                    </>
                                )}
                                {activeItemType === "Supply Chain" && (
                                    <>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Request No</span><span className="font-semibold text-zinc-900">{activeItem.requestNo}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Type</span><span className="font-semibold text-zinc-900">{activeItem.type}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Target Date</span><span className="font-semibold text-zinc-900">{formatDate(activeItem.targetDate)}</span></div>
                                        <div><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Stage</span><span className="font-semibold text-zinc-900">{activeItem.stage?.statusName || '-'}</span></div>
                                        <div className="col-span-2"><span className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Details</span><span className="font-semibold text-zinc-900">{activeItem.details}</span></div>
                                    </>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-zinc-800">Add Management Comment</label>
                                <Textarea 
                                    placeholder="Enter your notes or remarks regarding this item..." 
                                    className="min-h-[100px] border-zinc-200 focus-visible:ring-violet-500 resize-none shadow-inner bg-zinc-50"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setViewItemModalOpen(false)}>Cancel</Button>
                                    <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => {
                                        toast.success("Comment saved (Simulated)");
                                        setViewItemModalOpen(false);
                                    }}><Save className="w-4 h-4 mr-2" /> Save Comment</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
