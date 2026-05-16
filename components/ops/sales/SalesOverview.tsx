"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, CheckCircle2, XCircle, Clock, MoreVertical, Eye, FileDown, ArrowRight } from "lucide-react";
import { SalesRequestModal } from "./SalesRequestModal";
import { toast } from "sonner";

export function SalesOverview({ type }: { type: "QUOTATION" | "SO" | "PI" | "INVOICE" }) {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/ops/sales/request?type=${type}`);
            if (res.ok) setDocs(await res.json());
        } catch (e) {
            toast.error("Failed to fetch documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, [type]);

    const filteredDocs = docs.filter(d => 
        d.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customer?.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Approved</Badge>;
            case "PENDING": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pending</Badge>;
            case "REJECTED": return <Badge className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>;
            case "PARTIAL": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Partially Invoiced</Badge>;
            case "COMPLETED": return <Badge className="bg-emerald-600 text-white">Completed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
                        {type.replace("_", " ")}S
                    </h1>
                    <p className="text-sm text-zinc-500">Manage and track your {type.toLowerCase()} requests.</p>
                </div>
                <SalesRequestModal type={type} onSuccess={fetchDocs} />
            </div>

            <Card className="border-zinc-200 shadow-sm">
                <CardHeader className="border-b bg-zinc-50/50 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input 
                                placeholder="Search by number or customer..." 
                                className="pl-9 h-9 text-xs" 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 text-xs">Filter</Button>
                            <Button variant="outline" size="sm" className="h-9 text-xs">Export</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="text-[10px] font-bold uppercase w-12">#</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase">Document No</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase">Customer</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase">Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-right">Amount</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={7} className="h-12 animate-pulse bg-zinc-50/30" /></TableRow>
                                ))
                            ) : filteredDocs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-sm italic">
                                        No documents found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDocs.map((doc, idx) => (
                                    <TableRow key={doc.id} className="group hover:bg-zinc-50/50">
                                        <TableCell className="text-zinc-400 text-xs font-medium">{idx + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-900">{doc.documentNumber}</span>
                                                {doc.parentDocument && <span className="text-[10px] text-zinc-400">from {doc.parentDocument.documentNumber}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{doc.customer.customerName}</span>
                                                <span className="text-[10px] text-zinc-400">{doc.customer.slno}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-500">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-sm text-zinc-700">
                                            ₹{doc.items.reduce((s: number, it: any) => s + it.total, 0).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {type === "SO" && doc.status === "APPROVED" && (
                                                    <SalesRequestModal 
                                                        type="INVOICE" 
                                                        initialData={doc} 
                                                        onSuccess={fetchDocs} 
                                                    />
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
