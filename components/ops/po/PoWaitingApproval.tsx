"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

export function PoWaitingApproval() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPo, setSelectedPo] = useState<any>(null);
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [actionType, setActionType] = useState<"APPROVE" | "REJECT">("APPROVE");
    const [remarks, setRemarks] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/ops/po/request?type=pending");
            if (res.ok) setData(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async () => {
        if (actionType === "REJECT" && !remarks) {
            toast.error("Please provide remarks for rejection.");
            return;
        }

        try {
            const res = await fetch("/api/ops/po/request", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedPo.id,
                    action: actionType,
                    remarks
                })
            });

            if (res.ok) {
                toast.success(`PO ${actionType === "APPROVE" ? "Approved" : "Rejected"} successfully.`);
                setIsActionOpen(false);
                setSelectedPo(null);
                setRemarks("");
                fetchData();
            } else {
                toast.error("Failed to process action.");
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
            accessorKey: "company.name",
            header: "Company"
        },
        {
            accessorKey: "supplier.supplierName",
            header: "Supplier"
        },
        {
            accessorKey: "createdBy.profileName",
            header: "Raised By",
            cell: ({ row }) => row.original.createdBy.profileName || row.original.createdBy.email
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
            id: "actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        onClick={() => { setSelectedPo(row.original); setActionType("APPROVE"); setIsActionOpen(true); }}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        onClick={() => { setSelectedPo(row.original); setActionType("REJECT"); setIsActionOpen(true); }}
                    >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border shadow-sm p-2">
                <DataTable columns={columns} data={data} searchKey="poNumber" />
            </div>

            <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{actionType === "APPROVE" ? "Approve" : "Reject"} Purchase Order - {selectedPo?.poNumber}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="bg-zinc-50 p-4 rounded-lg border space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Supplier:</span>
                                <span className="font-bold">{selectedPo?.supplier.supplierName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Total Amount:</span>
                                <span className="font-bold text-emerald-700">
                                    {selectedPo?.items.reduce((sum: number, item: any) => sum + item.total, 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </span>
                            </div>
                            <div className="pt-2 border-t text-sm">
                                <span className="text-zinc-500">Justification:</span>
                                <p className="mt-1 italic">"{selectedPo?.justification || "N/A"}"</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Remarks / Comments {actionType === "REJECT" && <span className="text-red-500">*</span>}</Label>
                            <Input 
                                value={remarks} 
                                onChange={e => setRemarks(e.target.value)} 
                                placeholder={actionType === "APPROVE" ? "Add optional remarks..." : "Please explain why this is being rejected."}
                                required={actionType === "REJECT"}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsActionOpen(false)}>Cancel</Button>
                        <Button 
                            className={actionType === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                            onClick={handleAction}
                        >
                            {actionType === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
