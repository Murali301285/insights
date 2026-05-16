"use client"

import { useState, useEffect } from "react"
import { Plus, MoreHorizontal, Pencil, Eye, History, User, MessageSquare, Paperclip, X, File as FileIcon, Download, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SmartSummaryGrid } from "@/components/data-entry/SmartSummaryGrid"

const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export function OrderManager({ onClose, activeCompanyId }: { onClose?: () => void, activeCompanyId?: string }) {
    const [orders, setOrders] = useState<any[]>([])
    const [stages, setStages] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [weeklyItems, setWeeklyItems] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    const [viewOrder, setViewOrder] = useState<any>(null)
    const [timelineOrder, setTimelineOrder] = useState<any>(null)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [viewTab, setViewTab] = useState<"Summary" | "Ongoing" | "Completed" | "Closed">("Summary");
    const [closeOrderModal, setCloseOrderModal] = useState(false);
    const [closeReason, setCloseReason] = useState("");
    const [closeFiles, setCloseFiles] = useState<File[]>([]);

    useEffect(() => {
        fetchData();
    }, [activeCompanyId]);

    async function fetchData() {
        setLoading(true)
        try {
            const url = activeCompanyId ? `/api/manufacturing/orders?companyId=${activeCompanyId}` : `/api/manufacturing/orders`;
            const [ordersRes, stageRes, userRes, wrRes] = await Promise.all([
                fetch(url),
                fetch("/api/config/stage"),
                fetch("/api/users"),
                fetch("/api/weekly-review?type=items")
            ]);
            if (ordersRes.ok) setOrders(await ordersRes.json());
            if (stageRes.ok) setStages(await stageRes.json());
            if (userRes.ok) setUsers(await userRes.json());
            if (wrRes.ok) {
                const wrItems = await wrRes.json();
                setWeeklyItems(Array.isArray(wrItems) ? wrItems.filter((i: any) => i.module === 'manufacturing').map((i: any) => i.itemId) : []);
            }
        } catch (error) {
            toast.error("Failed to load Orders")
        } finally {
            setLoading(false)
        }
    }

    const toggleWeeklyReview = async (id: string) => {
        try {
            const res = await fetch("/api/weekly-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle_item", module: "manufacturing", itemId: id })
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

    const [stageUpdateModal, setStageUpdateModal] = useState<{ open: boolean; stageId: number | null }>({ open: false, stageId: null });
    const [updateRemarks, setUpdateRemarks] = useState("");
    const [updateFiles, setUpdateFiles] = useState<File[]>([]);

    function openStageUpdateModal(newStageId: number) {
        if (!viewOrder && !timelineOrder) return;
        setStageUpdateModal({ open: true, stageId: newStageId });
        setUpdateRemarks("");
        setUpdateFiles([]);
    }

    const convertFilesToBase64 = async (files: File[]) => {
        return Promise.all(
            files.map((file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result });
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            })
        );
    };

    async function handleConfirmStatusUpdate() {
        const activeItem = viewOrder || timelineOrder;
        if (!activeItem || stageUpdateModal.stageId === null) return;
        if (!updateRemarks.trim()) {
            toast.error("Remarks are mandatory for stage updates.");
            return;
        }
        setUpdatingStatus(true);
        try {
            const attachments = await convertFilesToBase64(updateFiles);
            const newStageId = stageUpdateModal.stageId;
            const res = await fetch("/api/manufacturing/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: activeItem.id, 
                    currentStageId: newStageId,
                    remarks: updateRemarks,
                    attachments: attachments.length > 0 ? attachments : null
                })
            });
            if (res.ok) {
                const updated = await res.json();
                toast.success("Stage advanced natively");
                fetchData();
                if (viewOrder) {
                    setViewOrder({ ...viewOrder, currentStageId: newStageId, history: updated.history || viewOrder.history });
                }
                if (timelineOrder) {
                    setTimelineOrder({ ...timelineOrder, currentStageId: newStageId, history: updated.history || timelineOrder.history });
                }
                setStageUpdateModal({ open: false, stageId: null });
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.error || "Failed to update status");
                console.error("Stage Update Error:", errorData);
            }
        } catch (e: any) { 
            toast.error(e.message || "Fail update"); 
            console.error("Stage Update Local Error:", e);
        }
        finally { setUpdatingStatus(false); }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const valid = filesArray.filter(f => f.type.includes('pdf') || f.type.includes('image'));
            if (updateFiles.length + valid.length > 5) {
                toast.error("You can only upload a maximum of 5 files (PDF/Image)");
                return;
            }
            setUpdateFiles(prev => [...prev, ...valid]);
        }
    };

    const removeFile = (index: number) => {
        setUpdateFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCloseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const valid = filesArray.filter(f => f.type.includes('pdf') || f.type.includes('image'));
            setCloseFiles(prev => [...prev, ...valid].slice(0, 5));
        }
    };

    const removeCloseFile = (index: number) => {
        setCloseFiles(prev => prev.filter((_, i) => i !== index));
    };

    async function handleConfirmCloseOrder() {
        if (!viewOrder || !closeReason.trim()) {
            toast.error("Reason is mandatory to close this project.");
            return;
        }
        setUpdatingStatus(true);
        try {
            const attachments = await convertFilesToBase64(closeFiles);
            const res = await fetch("/api/manufacturing/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: viewOrder.id, 
                    isClosed: true,
                    closeReason: closeReason,
                    closeAttachments: attachments.length > 0 ? attachments : null
                })
            });
            if (res.ok) {
                toast.success("Order manually marked as Closed");
                fetchData();
                setViewOrder({ ...viewOrder, isClosed: true, closeReason, closeAttachments: attachments.length > 0 ? attachments : null });
                setCloseOrderModal(false);
            } else {
                toast.error("Failed to close order");
            }
        } catch (e) { toast.error("Fail closure"); }
        finally { setUpdatingStatus(false); }
    }

    async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        let updates = [];
        const newTargetDate = formData.get("targetDate") || null;
        const oldTargetDate = viewOrder?.targetDate ? new Date(viewOrder.targetDate).toISOString().split('T')[0] : null;
        if (newTargetDate !== oldTargetDate) {
            updates.push(`• Target date changed from ${oldTargetDate ? new Date(oldTargetDate).toLocaleDateString() : 'None'} to ${newTargetDate ? new Date(newTargetDate as string).toLocaleDateString() : 'None'}`);
        }
        const newVal = formData.get("orderValue") !== null ? (formData.get("orderValue") as string).replace(/[^0-9.]/g, '') : undefined;
        const oldVal = viewOrder?.orderValue !== null && viewOrder?.orderValue !== undefined ? viewOrder.orderValue.toString() : '';
        if (newVal !== undefined && newVal !== oldVal && newVal !== '') {
            updates.push(`• Order Value updated to ₹ ${new Intl.NumberFormat('en-IN').format(parseFloat(newVal))}`);
        } else if (newVal === '' && oldVal !== '') {
            updates.push(`• Order Value override removed`);
        }

        const newIncharge = formData.get("orderIncharge") === "unassigned" ? null : formData.get("orderIncharge");
        if (newIncharge !== viewOrder?.orderIncharge) {
            const userName = users.find(u => u.id === newIncharge)?.name || "Unassigned";
            updates.push(`• Order Incharge designated to ${userName}`);
        }

        try {
            const res = await fetch("/api/manufacturing/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: viewOrder.id,
                    orderIncharge: newIncharge,
                    targetDate: newTargetDate,
                    orderValue: newVal,
                    currentStageId: updates.length > 0 ? viewOrder.currentStageId : undefined,
                    remarks: updates.length > 0 ? "System Auto-Log:\n" + updates.join('\n') : undefined
                })
            });
            if (res.ok) {
                const updated = await res.json();
                toast.success("Preferences Saved Successfully");
                fetchData();
                setViewOrder({ 
                    ...viewOrder, 
                    orderValue: formData.get("orderValue") ? parseFloat((formData.get("orderValue") as string).replace(/,/g, '')) : null,
                    history: updated.history || viewOrder.history
                });
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(`Update failed: ${errData.error || res.statusText}`);
                console.error("PUT Failure:", errData);
            }
        } catch (error: any) {
            toast.error(`Network error: ${error.message}`);
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "orderNo",
            header: "Order No.",
            cell: ({ row }) => {
                const isWeekly = weeklyItems.includes(row.original.id);
                return (
                    <div className="flex items-center gap-2">
                        {isWeekly && <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" title="Marked for Weekly Review" />}
                        <div className={cn("font-bold px-2.5 py-1 rounded-md border inline-block shadow-sm", isWeekly ? "text-violet-900 bg-violet-100 border-violet-200/50" : "text-emerald-700 bg-emerald-50 border-emerald-100/50")}>
                            {row.original.orderNo}
                        </div>
                    </div>
                );
            }
        },
        {
            id: "customer",
            header: "Customer",
            accessorFn: (row: any) => row.opportunity?.customer?.customerName || "Unknown",
            cell: ({ row }) => <span className="font-medium text-zinc-800">{row.original.opportunity?.customer?.customerName || "Unknown"}</span>
        },
        {
            id: "opportunity",
            header: "Project",
            accessorFn: (row: any) => row.opportunity?.opportunityName,
            cell: ({ row }) => <span className="text-zinc-600">{row.original.opportunity?.opportunityName}</span>
        },
        {
            id: "dates",
            header: "Win Date To Target Date",
            accessorFn: (row: any) => {
                const target = row.targetDate ? new Date(row.targetDate) : null;
                const dateStr = formatDate(row.date);
                if (!target) return dateStr;
                return `${dateStr} to ${formatDate(target)}`;
            },
            cell: ({ row }) => {
                const target = row.original.targetDate ? new Date(row.original.targetDate) : null;
                let daysLeft = null;
                let isLate = false;
                if (target) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Normalize to local midnight
                    const targetNorm = new Date(target);
                    targetNorm.setHours(0, 0, 0, 0);
                    daysLeft = Math.ceil((targetNorm.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    isLate = daysLeft < 0;
                }
                
                return (
                    <div className="flex flex-col gap-0.5 mt-1">
                        <span className="font-semibold text-emerald-700">{formatDate(row.original.date)}</span>
                        {target && (
                            <div className="text-[10px] font-bold text-zinc-500 uppercase flex flex-col gap-0.5">
                                <span>To {formatDate(target)}</span>
                                <span className={cn(
                                    "font-black tracking-wider",
                                    isLate ? "text-red-600 animate-pulse" : "text-sky-600"
                                )}>
                                    ({Math.abs(daysLeft!)} {isLate ? "days overdue" : "days left"})
                                </span>
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            id: "stage",
            header: "Current Stage",
            accessorFn: (row: any) => row.currentStage?.stageName || "Pending Setup",
            cell: ({ row }) => {
                const order = row.original;
                let daysLeft = null;
                let isLate = false;
                
                if (order.targetDate && order.currentStage) {
                    const winDate = new Date(order.date || new Date());
                    winDate.setHours(0,0,0,0);
                    const targetDate = new Date(order.targetDate);
                    targetDate.setHours(0,0,0,0);
                    const totalProjectDays = Math.max(1, Math.ceil((targetDate.getTime() - winDate.getTime()) / (1000 * 3600 * 24)));
                    
                    let pointer = new Date(winDate.getTime());
                    const sortedStages = [...stages].filter(s => s.isActive).sort((a, b) => a.order - b.order);
                    
                    for (const stage of sortedStages) {
                        const stagePercentage = stage.percentage || 0;
                        const estDays = Math.round(totalProjectDays * (stagePercentage / 100));
                        pointer.setDate(pointer.getDate() + estDays);
                        
                        if (stage.slno === order.currentStage?.slno) {
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            
                            daysLeft = Math.ceil((pointer.getTime() - today.getTime()) / (1000 * 3600 * 24));
                            isLate = daysLeft < 0;
                            break;
                        }
                    }
                }

                return (
                    <div className="flex flex-col gap-0.5 items-start mt-0.5">
                        <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                            {order.currentStage?.stageName || "Pending Setup"}
                        </span>
                        {daysLeft !== null && (
                            <span className={cn(
                                "text-[10px] font-black tracking-widest uppercase",
                                isLate ? "text-red-600 animate-pulse" : "text-indigo-500"
                            )}>
                                ({Math.abs(daysLeft)} {isLate ? "days overdue" : "days left"})
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: "orderIncharge",
            header: "Incharge",
            accessorFn: (row: any) => users.find((u: any) => u.id === row.orderIncharge)?.name || "Unassigned",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-zinc-700">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-medium">{users.find(u => u.id === row.original.orderIncharge)?.name || "Unassigned"}</span>
                </div>
            )
        },
        {
            id: "value",
            header: "Value",
            accessorFn: (row: any) => row.orderValue !== null && row.orderValue !== undefined ? row.orderValue : (row.opportunity?.value || 0),
            cell: ({ row }) => {
                const val = row.original.orderValue !== null && row.original.orderValue !== undefined ? row.original.orderValue : (row.original.opportunity?.value || 0);
                return <span className="font-semibold text-zinc-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)}</span>;
            }
        },
        {
            accessorKey: "elapsedDays",
            header: "No of days old",
            cell: ({ row }) => (
                <div className="font-bold text-zinc-700">
                    {row.original.elapsedDays} <span className="text-xs font-normal text-zinc-400">days</span>
                </div>
            )
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => {
                const item = row.original;
                const isWeekly = weeklyItems.includes(item.id);
                return (
                    <div className="flex gap-1.5 items-center">
                        <button 
                            onClick={() => toggleWeeklyReview(item.id)}
                            className="p-1 hover:bg-zinc-200/50 rounded text-zinc-400 hover:text-violet-600 transition-colors"
                            title={isWeekly ? "Remove from Weekly Review" : "Add for Weekly Review"}
                        >
                            <div className={cn("w-4 h-4 border rounded flex items-center justify-center", isWeekly ? "bg-violet-600 border-violet-600" : "border-zinc-300")}>
                                {isWeekly && <Check className="w-3 h-3 text-white" />}
                            </div>
                        </button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setViewOrder(item)}>
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setTimelineOrder(item)}>
                            <MessageSquare className="w-4 h-4" />
                        </Button>
                    </div>
                )
            }
        }
    ];

    const isCompletedStage = (stageName?: string) => stageName?.toLowerCase().includes("dispatch") || false;

    const displayedOrders = orders.filter(o => {
        if (viewTab === "Closed") return o.isClosed;
        if (viewTab === "Completed") return !o.isClosed && isCompletedStage(o.currentStage?.stageName);
        return !o.isClosed && !isCompletedStage(o.currentStage?.stageName);
    });

    const ongoingCount = orders.filter(o => !o.isClosed && !isCompletedStage(o.currentStage?.stageName)).length;
    const completedCount = orders.filter(o => !o.isClosed && isCompletedStage(o.currentStage?.stageName)).length;
    const closedCount = orders.filter(o => o.isClosed).length;

    return (
        <div className="w-full flex-1 flex flex-col h-full bg-white relative overflow-hidden">
            <div className="px-5 pt-5 pb-2">
                <div className="flex bg-zinc-100 p-1 rounded-lg w-max shadow-inner">
                    {["Summary", "Ongoing", "Completed", "Closed"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setViewTab(tab as any)}
                            className={cn(
                                "px-6 py-1.5 text-sm font-semibold rounded-md transition-all",
                                viewTab === tab
                                    ? "bg-white text-zinc-900 shadow-sm"
                                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                            )}
                        >
                            {tab === "Summary" && "Summary"}
                            {tab === "Ongoing" && `Ongoing (${ongoingCount})`}
                            {tab === "Completed" && `Completed (${completedCount})`}
                            {tab === "Closed" && `Closed (${closedCount})`}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 p-5 pt-0 overflow-auto flex flex-col">
                {viewTab === "Summary" ? (
                    <div className="flex-1 rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <SmartSummaryGrid module="manufacturing" activeCompanyId={activeCompanyId} />
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <span className="text-sm font-medium text-zinc-500 animate-pulse">Fetching orders...</span>
                    </div>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={displayedOrders} 
                        searchKey="orderNo" 
                        rowClassName={(row) => weeklyItems.includes(row.id) ? "[&>td]:!bg-violet-50/60 hover:[&>td]:!bg-violet-100/60" : ""}
                        reportName={`Order Fulfilment - ${viewTab} Report`}
                        fileName={`insight-orderfulfillment-${viewTab.toLowerCase()}`}
                    />
                )}
            </div>

            {/* Deep Dive Modal */}
            <Dialog open={!!viewOrder} onOpenChange={(o) => !o && setViewOrder(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-zinc-50 flex flex-col h-[85vh] shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] border-zinc-200">
                    <DialogHeader className="p-6 bg-white border-b border-zinc-200">
                        <div className="flex justify-between items-start pr-8">
                            <div>
                                <DialogTitle className="text-2xl font-bold flex flex-col gap-1">
                                    <span className="text-sm font-medium text-emerald-600 uppercase tracking-widest leading-none">Order Details {viewOrder?.opportunity?.customer?.company?.companyName ? `for ${viewOrder.opportunity.customer.company.companyName}` : ''}</span>
                                    {viewOrder?.orderNo}
                                </DialogTitle>
                                <div className="flex flex-wrap items-center gap-2.5 mt-3 text-sm font-medium">
                                    <span className="flex items-center gap-1.5 text-zinc-500" title="Date & Age">
                                        {formatDate(viewOrder?.date)}
                                        <span className="text-zinc-600 text-xs bg-zinc-200 px-1.5 py-0.5 rounded font-bold">
                                            {viewOrder?.elapsedDays || 0} days old
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-zinc-800 px-2.5 py-1 rounded-full text-white shadow-sm" title="Customer">{viewOrder?.opportunity?.customer?.customerName || '-'}</span>
                                    <span className="flex items-center gap-1.5 bg-indigo-600 px-2.5 py-1 rounded-full text-white shadow-sm" title="Project">{viewOrder?.opportunity?.opportunityName}</span>
                                    <span className="flex items-center gap-1.5 bg-orange-500 px-2.5 py-1 rounded-full text-white shadow-sm" title="Incharge">
                                        <User className="w-3 h-3" />
                                        {(() => {
                                            if (!viewOrder?.orderIncharge) return 'Unassigned';
                                            const u = users.find(x => x.id === viewOrder.orderIncharge);
                                            return u ? u.name : 'Unassigned';
                                        })()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex gap-4 items-center mb-1">
                                    <label className={cn(
                                        "flex items-center gap-2 cursor-pointer group pr-4 border-r border-zinc-200 transition-opacity", 
                                        viewOrder?.isClosed ? "opacity-60 pointer-events-none" : ""
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 rounded-sm border-[2px] flex items-center justify-center transition-all",
                                            viewOrder?.isClosed 
                                                ? "bg-rose-500 border-rose-500" 
                                                : "border-rose-400 group-hover:border-rose-500 bg-white"
                                        )}>
                                            {viewOrder?.isClosed && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                        </div>
                                        <span className={cn(
                                            "font-bold text-xs uppercase tracking-widest transition-colors", 
                                            viewOrder?.isClosed ? "text-rose-500" : "text-rose-600 group-hover:text-rose-700"
                                        )}>
                                            {viewOrder?.isClosed ? "Closed" : "Mark as Closed"}
                                        </span>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={!!viewOrder?.isClosed || closeOrderModal}
                                            disabled={viewOrder?.isClosed}
                                            onChange={(e) => {
                                                if (e.target.checked && !viewOrder?.isClosed) {
                                                    setCloseReason("");
                                                    setCloseFiles([]);
                                                    setCloseOrderModal(true);
                                                }
                                            }}
                                        />
                                    </label>
                                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider w-full text-right">Current Stage</label>
                                </div>
                                <select
                                    className="h-9 w-[220px] rounded-lg border-2 border-indigo-200 bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 focus:border-indigo-400 focus:ring-0 disabled:opacity-50"
                                    value={viewOrder?.currentStageId || ""}
                                    onChange={(e) => openStageUpdateModal(parseInt(e.target.value))}
                                    disabled={updatingStatus}
                                >
                                    {stages.filter(s => s.isActive).map(s => {
                                        const currentStageOrder = viewOrder?.currentStageId
                                            ? stages.find(cs => cs.slno === viewOrder.currentStageId)?.order || 0
                                            : 0;
                                        return (
                                            <option key={s.slno} value={s.slno} disabled={s.order < currentStageOrder}>
                                                Order {s.order} - {s.stageName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* History Timeline Computation Grid */}
                    <div className="flex-1 overflow-auto p-6 grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-4 pr-4 border-r border-zinc-200/50">
                            <h3 className="font-bold flex items-center gap-2 text-zinc-800"><History className="w-4 h-4" /> Stage Tracking</h3>
                            <div className="space-y-4 pl-2 border-l-2 border-emerald-100 relative">
                                {(() => {
                                    const winDate = new Date(viewOrder?.date || new Date());
                                    const targetDate = viewOrder?.targetDate ? new Date(viewOrder.targetDate) : null;
                                    const totalProjectDays = targetDate ? Math.max(1, Math.ceil((targetDate.getTime() - winDate.getTime()) / (1000 * 3600 * 24))) : 0;

                                    let currentEstimationPointer = new Date(winDate.getTime());

                                    return stages.filter(s => s.isActive).sort((a, b) => a.order - b.order).map((stage: any) => {
                                        const actualHistoryRow = viewOrder?.history?.find((h: any) => h.stageId === stage.slno);
                                        const actualStart = actualHistoryRow ? new Date(actualHistoryRow.startDate) : null;
                                        const actualEnd = actualHistoryRow?.endDate ? new Date(actualHistoryRow.endDate) : null;

                                        const pendingOrCurrentDate = new Date();
                                        const actualDays = actualStart ? Math.max(1, Math.ceil(((actualEnd || pendingOrCurrentDate).getTime() - actualStart.getTime()) / (1000 * 3600 * 24))) : null;

                                        const stagePercentage = stage.percentage || 0;
                                        const estDaysForStage = targetDate ? Math.round(totalProjectDays * (stagePercentage / 100)) : 0;

                                        currentEstimationPointer.setDate(currentEstimationPointer.getDate() + estDaysForStage);
                                        const stageEstEndDate = new Date(currentEstimationPointer.getTime());

                                        const daysDifference = actualDays !== null ? actualDays - estDaysForStage : 0;

                                        const isCompleted = !!actualEnd;
                                        const isCurrent = !!actualStart && !actualEnd;
                                        const isFuture = !actualStart;

                                        const markerColor = isCompleted ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'bg-white border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]' : 'bg-white border-zinc-300';

                                        return (
                                            <div key={stage.slno} className={`relative pl-8 pb-3 ${isFuture ? 'opacity-50' : ''}`}>
                                                <div className={`absolute w-3.5 h-3.5 border-2 rounded-full -left-[8px] top-1 transition-all ${markerColor}`} />
                                                <div className={`flex flex-col bg-white p-3 rounded-lg border ${isCurrent ? 'border-blue-200 bg-blue-50/30' : 'border-zinc-200'} shadow-sm relative`}>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-zinc-900 text-[13px] uppercase tracking-wide">
                                                            Order {stage.order} : {stage.stageName}
                                                        </span>
                                                        {isCurrent && (
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => openStageUpdateModal(stage.slno)} className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 rounded px-2 py-0.5 shadow-sm hover:bg-blue-50 transition-colors flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Update Status</button>
                                                                <span className="text-[9px] uppercase font-bold tracking-widest bg-blue-100 text-blue-700 px-2 flex items-center rounded">Active</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                                        <div className="flex flex-col gap-1 border-r border-zinc-100 pr-2">
                                                            <span className="text-[9px] font-bold text-zinc-400 tracking-wider">ESTIMATED ({stagePercentage}%)</span>
                                                            <span className="text-xs text-zinc-600 font-medium">{targetDate ? formatDate(stageEstEndDate) : '-'}</span>
                                                            <span className="text-xs text-zinc-500">Allocated: <strong className="text-zinc-700">{estDaysForStage}</strong>d</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-bold text-zinc-400 tracking-wider">ACTUAL RUNTIME</span>
                                                            <span className="text-xs text-zinc-600 font-medium">
                                                                {isFuture ? '-' : isCompleted ? formatDate(actualEnd) : 'In Progress'}
                                                            </span>
                                                            {!isFuture && (
                                                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                                    Diff: <strong className={`font-bold ${daysDifference > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                        {daysDifference > 0 ? '+' : ''}{daysDifference}
                                                                    </strong>d
                                                                    ({actualDays} total)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {actualHistoryRow && (
                                                        <div className="mt-3 pt-2 border-t border-zinc-100 flex flex-col gap-2">
                                                            {actualHistoryRow.remarks && (
                                                                <div className="bg-zinc-50 p-2 rounded border border-zinc-100 flex gap-2 items-start">
                                                                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 mt-0.5" />
                                                                    <p className="text-xs text-zinc-600 whitespace-pre-wrap">{actualHistoryRow.remarks}</p>
                                                                </div>
                                                            )}
                                                            {actualHistoryRow.attachments && Array.isArray(actualHistoryRow.attachments) && actualHistoryRow.attachments.length > 0 && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {actualHistoryRow.attachments.map((att: any, i: number) => (
                                                                        <a key={i} href={att.data} download={att.name} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm cursor-pointer" title="Download Document">
                                                                            <Download className="w-3 h-3 text-emerald-600" />
                                                                            <span className="max-w-[100px] truncate">{att.name}</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                                                                <span>By: {actualHistoryRow.enteredBy || 'System'}</span>
                                                                <span>{formatDate(actualHistoryRow.createdAt)} {new Date(actualHistoryRow.createdAt).toLocaleTimeString()}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Order Operations */}
                        <div className="col-span-1 flex flex-col h-full pl-2">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-zinc-800"><Pencil className="w-4 h-4" /> Admin Operations</h3>
                            
                            {viewOrder?.isClosed && viewOrder?.closeReason && (
                                <div className="mb-6 bg-rose-50/50 border border-rose-200/50 rounded-xl p-5 shadow-sm">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5"><History className="w-3 h-3"/> Formal Closure Report</h4>
                                    <p className="text-sm text-rose-900/80 leading-relaxed font-medium mb-3">{viewOrder.closeReason}</p>
                                    {viewOrder.closeAttachments && Array.isArray(viewOrder.closeAttachments) && viewOrder.closeAttachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-rose-100/50">
                                            {viewOrder.closeAttachments.map((att: any, i: number) => (
                                                <a key={i} href={att.data} download={att.name} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-rose-100 rounded-md text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors shadow-sm cursor-pointer" title="Download Document">
                                                    <Download className="w-3.5 h-3.5 text-rose-400" />
                                                    <span className="max-w-[150px] truncate">{att.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-6">
                                <form onSubmit={handleUpdate} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Assign Order Incharge</label>
                                        <Select name="orderIncharge" defaultValue={viewOrder?.orderIncharge || "unassigned"}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Incharge" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {users.map(u => (
                                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                        <label className="text-sm font-bold text-indigo-900 uppercase tracking-widest">Target Date</label>
                                        <Input type="date" name="targetDate" defaultValue={viewOrder?.targetDate ? new Date(viewOrder.targetDate).toISOString().split('T')[0] : ''} className="h-10 text-indigo-900 border-indigo-200 focus-visible:ring-indigo-500" />
                                    </div>

                                    <div className="space-y-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                        <label className="text-sm font-bold text-emerald-900 uppercase tracking-widest flex items-center justify-between">
                                            Order / Contract Value
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-emerald-700 font-bold">₹</span>
                                            <Input type="text" name="orderValue" defaultValue={viewOrder?.orderValue !== null && viewOrder?.orderValue !== undefined ? new Intl.NumberFormat('en-IN').format(viewOrder.orderValue) : (viewOrder?.opportunity?.value ? new Intl.NumberFormat('en-IN').format(viewOrder.opportunity.value) : '')} className="h-10 pl-7 text-emerald-900 border-emerald-200 focus-visible:ring-emerald-500 font-bold" />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-[150px] bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-sm font-bold tracking-wide">Save Preferences</Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Stage Update Modal */}
            <Dialog open={stageUpdateModal.open} onOpenChange={(o) => !o && setStageUpdateModal({ open: false, stageId: null })}>
                <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-zinc-200 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-800">
                            Update Stage
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">REMARKS *</label>
                            <textarea 
                                className="w-full mt-1 p-3 border border-zinc-200 rounded-lg text-sm bg-zinc-50 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                rows={3}
                                placeholder="Add comments, delays, or update notes..."
                                value={updateRemarks}
                                onChange={(e) => setUpdateRemarks(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Attachments (PDF/Image, Max 5)</label>
                            <div className="flex flex-col gap-2">
                                <label className="cursor-pointer border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:border-emerald-400 hover:text-emerald-600 transition-colors group">
                                    <Paperclip className="w-6 h-6 mb-2 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                                    <span className="text-sm font-medium">Click to upload files</span>
                                    <span className="text-xs text-zinc-400 mt-1">Each file up to 5MB</span>
                                    <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                                {updateFiles.length > 0 && (
                                    <div className="space-y-2 mt-2 max-h-[150px] overflow-auto pr-1">
                                        {updateFiles.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                                                        <FileIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                    </div>
                                                    <span className="text-xs text-emerald-900 truncate font-semibold">{f.name}</span>
                                                </div>
                                                <button onClick={() => removeFile(i)} className="text-emerald-700 hover:bg-emerald-200 hover:text-emerald-900 p-1 rounded-full transition-colors"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-zinc-100 flex justify-end gap-3">
                            <Button variant="ghost" className="font-semibold text-zinc-600 hover:bg-zinc-100" onClick={() => setStageUpdateModal({ open: false, stageId: null })}>Cancel</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-sm" onClick={handleConfirmStatusUpdate} disabled={updatingStatus}>
                                {updatingStatus ? "Saving..." : "Confirm Update"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Mark as Closed Modal */}
            <Dialog open={closeOrderModal} onOpenChange={setCloseOrderModal}>
                <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-zinc-200 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-600">
                            Mark Complete / Closed
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reason (Mandatory) *</label>
                            <textarea 
                                className="w-full mt-1 p-3 border border-zinc-200 rounded-lg text-sm bg-zinc-50 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                                rows={3}
                                placeholder="Why is this order being closed..."
                                value={closeReason}
                                onChange={(e) => setCloseReason(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Attachments (PDF/Image, Max 5)</label>
                            <div className="flex flex-col gap-2">
                                <label className="cursor-pointer border-2 border-dashed border-zinc-200 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:border-rose-400 hover:text-rose-600 transition-colors group">
                                    <Paperclip className="w-6 h-6 mb-2 text-zinc-400 group-hover:text-rose-500 transition-colors" />
                                    <span className="text-sm font-medium">Click to upload files</span>
                                    <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={handleCloseFileChange} />
                                </label>
                                {closeFiles.length > 0 && (
                                    <div className="space-y-2 mt-2 max-h-[150px] overflow-auto pr-1">
                                        {closeFiles.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-rose-50 rounded-lg border border-rose-100 shadow-sm transition-all hover:shadow-md">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="p-1.5 bg-white rounded-md shadow-sm">
                                                        <FileIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                                    </div>
                                                    <span className="text-xs text-rose-900 truncate font-semibold">{f.name}</span>
                                                </div>
                                                <button onClick={() => removeCloseFile(i)} className="text-rose-700 hover:bg-rose-200 hover:text-rose-900 p-1 rounded-full transition-colors"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-zinc-100 flex justify-end gap-3">
                            <Button variant="ghost" className="font-semibold text-zinc-600 hover:bg-zinc-100" onClick={() => setCloseOrderModal(false)}>Cancel</Button>
                            <Button className="bg-rose-600 hover:bg-rose-700 font-bold shadow-sm" onClick={handleConfirmCloseOrder} disabled={updatingStatus}>
                                {updatingStatus ? "Saving..." : "Confirm Close"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Timeline View Modal */}
            <Dialog open={!!timelineOrder} onOpenChange={(o) => !o && setTimelineOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden bg-zinc-50 flex flex-col shadow-xl border-zinc-200">
                    <DialogHeader className="p-6 pb-4 bg-white border-b border-zinc-200 shrink-0 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex flex-col gap-1 text-zinc-800">
                                <span className="text-sm font-medium text-blue-600 uppercase tracking-widest leading-none">Order Timeline & Comments</span>
                                {timelineOrder?.orderNo}
                            </DialogTitle>
                        </div>
                        {timelineOrder?.currentStageId && !timelineOrder?.isClosed && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold tracking-wide shadow-sm mr-6" onClick={() => openStageUpdateModal(timelineOrder.currentStageId)}>
                                <MessageSquare className="w-4 h-4 mr-1.5" /> Add Log
                            </Button>
                        )}
                    </DialogHeader>
                    <div className="flex-1 overflow-auto p-6">
                        {timelineOrder?.history?.length > 0 ? (
                            <div className="space-y-6">
                                {timelineOrder.history.map((h: any, i: number) => (
                                    <div key={i} className="flex flex-col bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative">
                                        <div className="flex justify-between items-start mb-2 border-b border-zinc-100 pb-2">
                                            <div>
                                                <span className="font-bold text-zinc-900 text-sm">{h.stage?.stageName || 'General Update'}</span>
                                                <p className="text-xs text-zinc-500 font-medium">{formatDate(h.startDate)} to {h.endDate ? formatDate(h.endDate) : 'Present'}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold uppercase text-zinc-400">By {h.enteredBy || 'System'}</span>
                                            </div>
                                        </div>
                                        {h.remarks && (
                                            <div className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-100 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                                                {h.remarks}
                                            </div>
                                        )}
                                        {h.attachments && Array.isArray(h.attachments) && h.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {h.attachments.map((att: any, idx: number) => (
                                                    <a key={idx} href={att.data} download={att.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm cursor-pointer" title="Download Document">
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span className="max-w-[150px] truncate">{att.name}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500 font-medium">
                                No comments or history records found.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
