"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCcw, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

export function PoMyRequests() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPo, setSelectedPo] = useState<any>(null);
    const [isResubmitOpen, setIsResubmitOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/ops/po/request?type=mine");
            if (res.ok) setData(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResubmit = async (po: any) => {
        try {
            const res = await fetch("/api/ops/po/request", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: po.id,
                    action: "RESUBMIT"
                })
            });

            if (res.ok) {
                toast.success("PO Resubmitted for approval.");
                fetchData();
            } else {
                toast.error("Failed to resubmit PO.");
            }
        } catch (error) {
            toast.error("An error occurred.");
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "poNumber",
            header: "PO Number",
            cell: ({ row }) => <span className="font-bold text-zinc-900">{row.original.poNumber}</span>
        },
        {
            accessorKey: "supplier.supplierName",
            header: "Supplier"
        },
        {
            id: "total",
            header: "Grand Total",
            cell: ({ row }) => {
                const total = row.original.items.reduce((sum: number, item: any) => sum + item.total, 0);
                return <span className="font-semibold">{total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const colors: any = {
                    "PENDING_APPROVAL": "bg-amber-100 text-amber-700",
                    "APPROVED": "bg-emerald-100 text-emerald-700",
                    "REJECTED": "bg-red-100 text-red-700",
                    "CANCELLED": "bg-zinc-100 text-zinc-700"
                };
                return <Badge className={`${colors[status] || ""} border shadow-none`}>{status.replace('_', ' ')}</Badge>
            }
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPo(row.original)} className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4 text-zinc-500" />
                    </Button>
                    {row.original.status === "REJECTED" && (
                        <Button variant="ghost" size="sm" onClick={() => handleResubmit(row.original)} className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700">
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border shadow-sm p-2">
                <DataTable columns={columns} data={data} searchKey="poNumber" />
            </div>

            {selectedPo && (
                <PoDetailsModal 
                    po={selectedPo} 
                    isOpen={!!selectedPo} 
                    onClose={() => setSelectedPo(null)} 
                />
            )}
        </div>
    );
}

function PoDetailsModal({ po, isOpen, onClose }: { po: any, isOpen: boolean, onClose: () => void }) {
    const total = po.items.reduce((sum: number, item: any) => sum + item.total, 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>PO Details - {po.poNumber}</span>
                        <Badge className={po.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                            {po.status}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-4">
                    <div className="space-y-1 text-sm">
                        <p className="text-zinc-500">Company</p>
                        <p className="font-semibold">{po.company.name}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="text-zinc-500">Supplier</p>
                        <p className="font-semibold">{po.supplier.supplierName}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="text-zinc-500">Raised By</p>
                        <p className="font-semibold">{po.createdBy.profileName || po.createdBy.email}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="text-zinc-500">Target Date</p>
                        <p className="font-semibold">{po.targetDate ? format(new Date(po.targetDate), "PPP") : "N/A"}</p>
                    </div>
                </div>

                {po.status === "REJECTED" && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-lg flex gap-3 mb-4">
                        <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-red-900">Rejection Reason</p>
                            <p className="text-sm text-red-700 italic">"{po.rejectedRemarks || "No remarks provided"}"</p>
                        </div>
                    </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50 border-b">
                            <tr>
                                <th className="text-left p-3 text-zinc-500">Description</th>
                                <th className="text-right p-3 text-zinc-500">Qty</th>
                                <th className="text-right p-3 text-zinc-500">Rate</th>
                                <th className="text-right p-3 text-zinc-500">Tax</th>
                                <th className="text-right p-3 text-zinc-500">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {po.items.map((item: any, i: number) => (
                                <tr key={i} className="border-b last:border-0">
                                    <td className="p-3 font-medium">{item.description}</td>
                                    <td className="p-3 text-right">{item.quantity}</td>
                                    <td className="p-3 text-right">{item.rate.toLocaleString('en-IN')}</td>
                                    <td className="p-3 text-right">{item.tax}%</td>
                                    <td className="p-3 text-right font-bold text-zinc-900">{item.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-zinc-50 font-bold border-t">
                            <tr>
                                <td colSpan={4} className="p-3 text-right text-zinc-500 uppercase text-xs tracking-wider">Grand Total</td>
                                <td className="p-3 text-right text-lg text-emerald-700">{total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="space-y-2 py-4">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Justification</p>
                    <p className="text-sm text-zinc-700 bg-zinc-50 p-3 border rounded leading-relaxed">{po.justification || "No justification provided."}</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
