"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileUp, X } from "lucide-react";
import { toast } from "sonner";

type PoItem = {
    description: string;
    quantity: number;
    rate: number;
    taxType: "IGST" | "CGST_SGST";
    cgst: number;
    sgst: number;
    igst: number;
    discount: number;
    total: number;
};

const numberToIndianWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inWords(n % 100) : "");
        if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
        return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
    };

    const n = Math.floor(num);
    if (n === 0) return "Zero";
    return inWords(n).trim() + " Rupees";
};

const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
};

export function PoRequestModal({ onSuccess }: { onSuccess?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    
    const [companyId, setCompanyId] = useState("");
    const [supplierSlno, setSupplierSlno] = useState("");
    const [workflowId, setWorkflowId] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("");
    const [justification, setJustification] = useState("");
    const [items, setItems] = useState<PoItem[]>([
        { description: "", quantity: 1, rate: 0, taxType: "CGST_SGST", cgst: 0, sgst: 0, igst: 0, discount: 0, total: 0 }
    ]);

    useEffect(() => {
        if (isOpen) {
            fetch("/api/companies").then(r => r.json()).then(setCompanies);
            fetch("/api/config/supplier").then(r => r.json()).then(setSuppliers);
        }
    }, [isOpen]);

    useEffect(() => {
        if (companyId) {
            fetch("/api/ops/po/workflow")
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const filtered = data.filter((w: any) => 
                            (w.companyId === companyId || w.company?.id === companyId) && 
                            w.isActive && !w.isDelete
                        );
                        setWorkflows(filtered);
                    } else {
                        console.error("Invalid workflow data received:", data);
                        setWorkflows([]);
                    }
                    setWorkflowId(""); // Reset selection
                })
                .catch(err => {
                    console.error("Failed to fetch workflows:", err);
                    setWorkflows([]);
                });
        } else {
            setWorkflows([]);
            setWorkflowId("");
        }
    }, [companyId]);

    const selectedWorkflow = workflows.find(w => w.id === workflowId);

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, rate: 0, taxType: "CGST_SGST", cgst: 0, sgst: 0, igst: 0, discount: 0, total: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof PoItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };
        
        // Calculate total
        const qty = field === 'quantity' ? parseFloat(value) : item.quantity;
        const rate = field === 'rate' ? parseFloat(value) : item.rate;
        const disc = field === 'discount' ? parseFloat(value) : item.discount;
        const taxType = field === 'taxType' ? value : item.taxType;
        
        const cgst = field === 'cgst' ? parseFloat(value) : item.cgst;
        const sgst = field === 'sgst' ? parseFloat(value) : item.sgst;
        const igst = field === 'igst' ? parseFloat(value) : item.igst;

        const subtotal = (qty * rate);
        const taxableAmount = subtotal - disc;
        
        let taxAmount = 0;
        if (taxType === "IGST") {
            taxAmount = (taxableAmount * igst) / 100;
        } else {
            taxAmount = (taxableAmount * (cgst + sgst)) / 100;
        }

        item.total = taxableAmount + taxAmount;
        
        newItems[index] = item;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!companyId || !supplierSlno || items.length === 0) {
            toast.error("Please fill in required fields.");
            return;
        }

        try {
            const res = await fetch("/api/ops/po/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId,
                    supplierSlno,
                    workflowId,
                    items,
                    targetDate,
                    paymentTerms,
                    justification
                })
            });

            if (res.ok) {
                toast.success("PO Request raised successfully.");
                setIsOpen(false);
                onSuccess?.();
                // Reset form
                setItems([{ description: "", quantity: 1, rate: 0, taxType: "CGST_SGST", cgst: 0, sgst: 0, igst: 0, discount: 0, total: 0 }]);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to raise PO.");
            }
        } catch (error) {
            toast.error("An error occurred.");
        }
    };

    const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const totalTax = items.reduce((sum, item) => {
        const taxable = (item.quantity * item.rate) - item.discount;
        if (item.taxType === "IGST") return sum + (taxable * item.igst / 100);
        return sum + (taxable * (item.cgst + item.sgst) / 100);
    }, 0);
    
    const actualTotal = subTotal - totalDiscount + totalTax;
    const grandTotal = Math.round(actualTotal);
    const roundOff = grandTotal - actualTotal;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
                    <Plus className="w-4 h-4 mr-2" /> Raise PO Request
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                <DialogHeader>
                    <DialogTitle>New Purchase Order Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company <span className="text-red-500">*</span></Label>
                            <Select value={companyId} onValueChange={setCompanyId}>
                                <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
                                <SelectContent>
                                    {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Supplier <span className="text-red-500">*</span></Label>
                            <Select value={supplierSlno} onValueChange={setSupplierSlno}>
                                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => <SelectItem key={s.slno} value={s.slno.toString()}>{s.supplierName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Target Delivery Date</Label>
                            <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Terms</Label>
                            <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. 50% Advance, 50% on Delivery" />
                        </div>
                        <div className="space-y-2">
                            <Label className={!companyId ? "text-zinc-400" : ""}>
                                Purchase Type (Workflow) <span className="text-red-500">*</span>
                            </Label>
                            <Select value={workflowId} onValueChange={setWorkflowId} disabled={!companyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={!companyId ? "Select Company First" : "Select Purchase Type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {workflows.length > 0 ? (
                                        workflows.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)
                                    ) : (
                                        <div className="p-4 text-center text-sm text-zinc-500">
                                            No active workflows found for this company.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedWorkflow && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-3">
                            <Label className="text-emerald-800 font-bold flex items-center gap-2">
                                Approval Workflow Sequence
                            </Label>
                            <div className="flex flex-wrap gap-4 items-center">
                                {selectedWorkflow.steps.map((step: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-emerald-600">Level {step.stepOrder}</span>
                                            <span className="text-sm font-semibold text-emerald-900">{step.user.profileName || step.user.email}</span>
                                        </div>
                                        {idx < selectedWorkflow.steps.length - 1 && <span className="text-emerald-300">→</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Justification / Purpose</Label>
                        <Textarea value={justification} onChange={e => setJustification(e.target.value)} placeholder="Why is this purchase required?" />
                    </div>

                    <div className="border rounded-lg p-4 bg-zinc-50 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-zinc-700">Line Items</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-[40px_1fr_70px_110px_130px_90px_90px_130px_40px] gap-3 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                <div>#</div>
                                <div>Description</div>
                                <div className="text-center">Qty</div>
                                <div>Rate</div>
                                <div>Tax Type</div>
                                <div>Tax (%)</div>
                                <div>Discount</div>
                                <div className="text-right">Total</div>
                                <div></div>
                            </div>
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-[40px_1fr_70px_110px_130px_90px_90px_130px_40px] gap-3 bg-white p-3 border rounded shadow-sm items-start">
                                    <div className="flex items-center h-10 font-bold text-zinc-400">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <Input value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} placeholder="Item description" required className="text-xs h-10" />
                                    </div>
                                    <div>
                                        <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} required className="text-sm font-bold text-center h-10" />
                                    </div>
                                    <div>
                                        <Input type="number" step="0.01" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} required className="text-base font-black text-emerald-800 bg-emerald-50/50 border-emerald-200 h-10" />
                                    </div>
                                    <div>
                                        <Select value={item.taxType} onValueChange={v => updateItem(index, 'taxType', v)}>
                                            <SelectTrigger className="text-[10px] h-10 px-2"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IGST">IGST</SelectItem>
                                                <SelectItem value="CGST_SGST">CGST & SGST</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        {item.taxType === "IGST" ? (
                                            <div className="space-y-1">
                                                <Input type="number" step="0.01" value={item.igst} onChange={e => updateItem(index, 'igst', e.target.value)} placeholder="IGST %" className="text-[10px] h-10" />
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <Input type="number" step="0.01" value={item.cgst} onChange={e => updateItem(index, 'cgst', e.target.value)} placeholder="CGST %" className="h-[18px] text-[9px] px-1" />
                                                <Input type="number" step="0.01" value={item.sgst} onChange={e => updateItem(index, 'sgst', e.target.value)} placeholder="SGST %" className="h-[18px] text-[9px] px-1" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Input type="number" step="0.01" value={item.discount} onChange={e => updateItem(index, 'discount', e.target.value)} placeholder="Disc." className="text-xs text-red-600 h-10" />
                                    </div>
                                    <div>
                                        <div className="h-10 border border-zinc-300 rounded bg-zinc-900 flex items-center justify-end px-3 font-black text-base text-emerald-400 shadow-lg tracking-tight">
                                            {formatIndianCurrency(item.total).replace('₹', '')}
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        {items.length > 1 && (
                                            <Button type="button" variant="ghost" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 h-10 w-10 p-0">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-4 border-t">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Amount in Words</div>
                                <div className="p-4 bg-white border rounded-lg italic text-zinc-700 font-serif leading-relaxed min-h-[80px]">
                                    {numberToIndianWords(grandTotal)}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-bold uppercase mt-2">Total Items: {items.length}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-zinc-500">Subtotal</span>
                                    <span className="font-semibold">{formatIndianCurrency(subTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1 text-red-600">
                                    <span>Discount (-)</span>
                                    <span className="font-semibold">{formatIndianCurrency(totalDiscount)}</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-zinc-500">Total Tax (+)</span>
                                    <span className="font-semibold">{formatIndianCurrency(totalTax)}</span>
                                </div>
                                <div className={`flex justify-between text-[11px] py-1 font-bold ${roundOff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    <span>Round Off ({roundOff >= 0 ? '+' : '-'})</span>
                                    <span>{formatIndianCurrency(Math.abs(roundOff))}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-zinc-300">
                                    <span className="text-lg font-bold text-zinc-700">Grand Total</span>
                                    <span className="text-2xl font-black text-emerald-600">{formatIndianCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">Submit for Approval</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
