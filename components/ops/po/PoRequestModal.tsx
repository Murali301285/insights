"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileUp, X, Eye, Printer, AlertCircle, Layout, Clock, Save } from "lucide-react";
import { toast } from "sonner";
import { DocumentRenderer } from "@/components/ops/shared/DocumentRenderer";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

    // Template States
    const [templates, setTemplates] = useState<any[]>([]);
    const [templateId, setTemplateId] = useState("");
    const [primaryBank, setPrimaryBank] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Draft States
    const [drafts, setDrafts] = useState<any[]>([]);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState("");

    const fetchDrafts = async (cid: string) => {
        const res = await fetch(`/api/ops/po/drafts?companyId=${cid}`);
        if (res.ok) setDrafts(await res.json());
    };

    const handleSaveDraft = async () => {
        if (!companyId) return toast.error("Select company first");
        
        const finalDraftName = draftName || `Draft ${drafts.length + 1}`;
        const payload = {
            id: activeDraftId,
            companyId,
            name: finalDraftName,
            data: {
                supplierSlno,
                workflowId,
                targetDate,
                paymentTerms,
                justification,
                items,
                templateId
            }
        };

        const res = await fetch("/api/ops/po/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const saved = await res.json();
            setActiveDraftId(saved.id);
            toast.success("Draft saved");
            fetchDrafts(companyId);
        }
    };

    const loadDraft = (draft: any) => {
        const d = draft.data;
        setSupplierSlno(d.supplierSlno || "");
        setWorkflowId(d.workflowId || "");
        setTargetDate(d.targetDate || "");
        setPaymentTerms(d.paymentTerms || "");
        setJustification(d.justification || "");
        setItems(d.items || []);
        setTemplateId(d.templateId || "");
        setActiveDraftId(draft.id);
        setDraftName(draft.name);
        toast.info(`Loaded: ${draft.name}`);
    };

    const deleteDraft = async (id: string) => {
        const res = await fetch(`/api/ops/po/drafts?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Draft deleted");
            if (activeDraftId === id) {
                setActiveDraftId(null);
                setDraftName("");
            }
            fetchDrafts(companyId);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetch("/api/companies").then(r => r.json()).then(setCompanies);
            fetch("/api/config/supplier").then(r => r.json()).then(setSuppliers);
        }
    }, [isOpen]);

    useEffect(() => {
        if (companyId) {
            // Fetch Workflows
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
                        setWorkflows([]);
                    }
                    setWorkflowId("");
                });

            // Fetch Templates
            fetch(`/api/companies/templates?companyId=${companyId}`)
                .then(r => r.json())
                .then(data => {
                    const poTemplates = data.filter((t: any) => t.docType === "PO" || t.docType === "INVOICE");
                    setTemplates(poTemplates);
                    if (poTemplates.length > 0) {
                        const def = poTemplates.find((t: any) => t.isDefault) || poTemplates[0];
                        setTemplateId(def.id);
                    } else {
                        setTemplateId("");
                    }
                });

            // Fetch Primary Bank
            fetch(`/api/companies/banks?companyId=${companyId}`)
                .then(r => r.json())
                .then(data => {
                    setPrimaryBank(data.find((b: any) => b.isPrimary) || data[0] || null);
                });

            // Fetch Drafts
            fetchDrafts(companyId);
        } else {
            setWorkflows([]);
            setWorkflowId("");
            setTemplates([]);
            setTemplateId("");
            setPrimaryBank(null);
            setDrafts([]);
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
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle>New Purchase Order Request</DialogTitle>
                    {companyId && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="flex items-center gap-2 border-dashed">
                                    <Clock className="h-4 w-4" />
                                    Drafts ({drafts.length})
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                                <div className="p-3 border-b bg-zinc-50 font-bold text-xs uppercase tracking-wider text-zinc-500">Saved Drafts</div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {drafts.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-400 text-xs italic">No drafts saved yet</div>
                                    ) : (
                                        drafts.map(d => (
                                            <div key={d.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-zinc-50 group cursor-pointer" onClick={() => loadDraft(d)}>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold truncate">{d.name}</p>
                                                    <p className="text-[10px] text-zinc-400">{new Date(d.updatedAt).toLocaleString()}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteDraft(d.id); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
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

                    <div className="flex justify-between items-center pt-4 border-t gap-4">
                        <div className="flex-1 max-w-xs">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Print Template</Label>
                            {companyId ? (
                                templates.length > 0 ? (
                                    <Select value={templateId} onValueChange={setTemplateId}>
                                        <SelectTrigger className="h-9 text-xs bg-zinc-50">
                                            <SelectValue placeholder="Select Template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map(t => <SelectItem key={t.id} value={t.id!}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>No PO templates found. <Link href="/config/company" className="underline font-bold">Create one</Link></span>
                                    </div>
                                )
                            ) : (
                                <div className="text-[10px] text-zinc-400 italic">Select company to load templates</div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            
                            {companyId && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="outline" className={`border-zinc-300 ${activeDraftId ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-zinc-700'}`}>
                                            <Save className="w-4 h-4 mr-2" /> 
                                            {activeDraftId ? "Update Draft" : "Save as Draft"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-4 space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Draft Name</Label>
                                            <Input 
                                                value={draftName} 
                                                onChange={(e) => setDraftName(e.target.value)} 
                                                placeholder={`Draft ${drafts.length + 1}`}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <Button className="w-full h-8 text-xs bg-zinc-900 text-white" onClick={handleSaveDraft}>
                                            Confirm Save
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            )}

                            {templateId && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="border-zinc-300 text-zinc-700"
                                    onClick={() => setIsPreviewOpen(true)}
                                >
                                    <Eye className="w-4 h-4 mr-2" /> Preview & Print
                                </Button>
                            )}
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">Submit for Approval</Button>
                        </div>
                    </div>
                </form>

                {/* Document Preview Modal */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-[900px] h-[95vh] p-0 flex flex-col bg-zinc-100 overflow-hidden">
                        <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between shrink-0">
                            <DialogTitle className="flex items-center gap-2">
                                <Layout className="h-5 w-5 text-emerald-600" />
                                Purchase Order Preview
                            </DialogTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                                <Button size="sm" className="bg-zinc-900 text-white" onClick={() => window.print()}>
                                    <Printer className="h-4 w-4 mr-2" /> Print PO
                                </Button>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-8 flex justify-center scrollbar-thin">
                            {templateId && (
                                <DocumentRenderer 
                                    template={templates.find(t => t.id === templateId)}
                                    data={{
                                        company: companies.find(c => c.id === companyId),
                                        partner: suppliers.find(s => s.slno.toString() === supplierSlno) || {},
                                        items: items,
                                        totals: {
                                            subTotal,
                                            discount: totalDiscount,
                                            tax: totalTax,
                                            grandTotal,
                                            roundOff,
                                            amountInWords: numberToIndianWords(grandTotal)
                                        },
                                        bank: primaryBank,
                                        docType: "PURCHASE ORDER"
                                    }}
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
