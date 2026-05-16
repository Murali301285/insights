"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, History } from "lucide-react";
import { PoRequestModal } from "./PoRequestModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

export function PoOverview() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPo, setSelectedPo] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/ops/po/request?type=all");
            if (res.ok) setData(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "poNumber",
            header: "PO Number",
            cell: ({ row }) => <span className="font-bold text-zinc-900">{row.original.poNumber}</span>
        },
        {
            accessorKey: "company.name",
            header: "Company"
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
                return <span className="font-semibold text-emerald-700">{total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const colors: any = {
                    "PENDING_APPROVAL": "bg-amber-100 text-amber-700 border-amber-200",
                    "APPROVED": "bg-emerald-100 text-emerald-700 border-emerald-200",
                    "REJECTED": "bg-red-100 text-red-700 border-red-200",
                    "CANCELLED": "bg-zinc-100 text-zinc-700 border-zinc-200"
                };
                return <Badge className={`${colors[status] || ""} border shadow-none px-2`}>{status.replace('_', ' ')}</Badge>
            }
        },
        {
            id: "stage",
            header: "Approval Stage",
            cell: ({ row }) => {
                const po = row.original;
                if (po.status === "APPROVED") return <span className="text-emerald-600 font-medium">Released</span>;
                if (po.status === "REJECTED") return <span className="text-red-500 font-medium text-xs">Returned to Creator</span>;
                const currentStep = po.workflow.steps.find((s: any) => s.stepOrder === po.currentStepOrder);
                return (
                    <div className="flex flex-col">
                        <span className="text-xs text-zinc-500">Waiting for Step {po.currentStepOrder}</span>
                        <span className="text-sm font-medium">{currentStep?.user?.profileName || currentStep?.user?.email}</span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <Button variant="ghost" size="sm" onClick={() => setSelectedPo(row.original)} className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4 text-zinc-500" />
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <h2 className="text-lg font-bold text-zinc-800">All Purchase Orders</h2>
                <PoRequestModal onSuccess={fetchData} />
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-2">
                <DataTable columns={columns} data={data} searchKey="poNumber" />
            </div>

            {selectedPo && (
                <PoTimelineModal 
                    po={selectedPo} 
                    isOpen={!!selectedPo} 
                    onClose={() => setSelectedPo(null)} 
                />
            )}
        </div>
    );
}

function PoTimelineModal({ po, isOpen, onClose }: { po: any, isOpen: boolean, onClose: () => void }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-600" />
                        PO Approval Timeline - {po.poNumber}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-6 px-2">
                    <div className="relative border-l-2 border-zinc-200 ml-4 space-y-8">
                        {po.history.map((entry: any, i: number) => (
                            <div key={i} className="relative pl-8">
                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                    entry.action === "APPROVED" ? "bg-emerald-500" : 
                                    entry.action === "REJECTED" ? "bg-red-500" : 
                                    entry.action === "RESUBMITTED" ? "bg-amber-500" : "bg-zinc-900"
                                }`} />
                                <div className="flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-zinc-900">
                                            {entry.action === "CREATED" ? "Request Raised" : entry.action}
                                            {entry.stepOrder > 0 && ` (Step ${entry.stepOrder})`}
                                        </h4>
                                        <span className="text-xs text-zinc-400">{format(new Date(entry.timestamp), "PPp")}</span>
                                    </div>
                                    <p className="text-sm text-zinc-600 font-medium">By {entry.user?.profileName || entry.user?.email}</p>
                                    {entry.remarks && (
                                        <p className="text-sm bg-zinc-50 border p-2 rounded mt-2 text-zinc-500 italic">"{entry.remarks}"</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
