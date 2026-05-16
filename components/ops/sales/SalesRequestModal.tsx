"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, Printer, AlertCircle, Layout, Clock, Save, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { DocumentRenderer } from "@/components/ops/shared/DocumentRenderer";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type SalesItem = {
    id?: string;
    description: string;
    quantity: number;
    invoicedQty?: number; // For partial invoicing
    rate: number;
    taxType: "IGST" | "CGST_SGST";
    cgst: number;
    sgst: number;
    igst: number;
    discount: number;
    total: number;
    parentItemId?: string;
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
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
};

export function SalesRequestModal({ 
    type, 
    initialData, 
    onSuccess 
}: { 
    type: "QUOTATION" | "SO" | "PI" | "INVOICE",
    initialData?: any, // Used for SO -> Invoice conversion
    onSuccess?: () => void 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    
    const [companyId, setCompanyId] = useState(initialData?.companyId || "");
    const [customerSlno, setCustomerSlno] = useState(initialData?.customerSlno?.toString() || "");
    const [workflowId, setWorkflowId] = useState("");
    const [targetDate, setTargetDate] = useState(initialData?.targetDate || "");
    const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms || "");
    const [justification, setJustification] = useState(initialData?.justification || "");
    
    // Invoice specific
    const [dispatchDetails, setDispatchDetails] = useState("");
    const [lrNumber, setLrNumber] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [placeOfSupply, setPlaceOfSupply] = useState("");

    const [items, setItems] = useState<SalesItem[]>(
        initialData?.items?.map((it: any) => ({
            ...it,
            parentItemId: it.id,
            quantity: it.quantity - (it.invoicedQty || 0),
            total: (it.quantity - (it.invoicedQty || 0)) * it.rate // rough calc
        })) || [
            { description: "", quantity: 1, rate: 0, taxType: "CGST_SGST", cgst: 0, sgst: 0, igst: 0, discount: 0, total: 0 }
        ]
    );

    // Template & Bank States
    const [templates, setTemplates] = useState<any[]>([]);
    const [templateId, setTemplateId] = useState("");
    const [primaryBank, setPrimaryBank] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Draft States
    const [drafts, setDrafts] = useState<any[]>([]);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState("");

    const typeLabels = {
        "QUOTATION": { title: "New Quotation", btn: "Create Quotation", prefix: "QT" },
        "SO": { title: "New Sales Order", btn: "Create Sales Order", prefix: "SO" },
        "PI": { title: "New Proforma Invoice", btn: "Create Proforma", prefix: "PI" },
        "INVOICE": { title: "New Tax Invoice", btn: "Generate Invoice", prefix: "INV" }
    };

    useEffect(() => {
        if (isOpen) {
            fetch("/api/companies").then(r => r.json()).then(setCompanies);
            fetch("/api/config/customer").then(r => r.json()).then(setCustomers);
        }
    }, [isOpen]);

    useEffect(() => {
        if (companyId) {
            // Fetch Workflows
            fetch(`/api/ops/sales/workflow?companyId=${companyId}`)
                .then(r => r.json())
                .then(data => {
                    setWorkflows(data.filter((w: any) => w.docType === type));
                    setWorkflowId("");
                });

            // Fetch Templates
            fetch(`/api/companies/templates?companyId=${companyId}`)
                .then(r => r.json())
                .then(data => {
                    const filtered = data.filter((t: any) => t.docType === type || t.docType === "INVOICE");
                    setTemplates(filtered);
                    if (filtered.length > 0) setTemplateId(filtered[0].id);
                });

            // Fetch Primary Bank
            fetch(`/api/companies/banks?companyId=${companyId}`)
                .then(r => r.json())
                .then(data => setPrimaryBank(data.find((b: any) => b.isPrimary) || data[0] || null));

            // Fetch Drafts
            fetchDrafts(companyId);
        }
    }, [companyId, type]);

    const fetchDrafts = async (cid: string) => {
        const res = await fetch(`/api/ops/sales/drafts?companyId=${cid}&type=${type}`);
        if (res.ok) setDrafts(await res.json());
    };

    const addItem = () => setItems([...items, { description: "", quantity: 1, rate: 0, taxType: "CGST_SGST", cgst: 0, sgst: 0, igst: 0, discount: 0, total: 0 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

    const updateItem = (index: number, field: keyof SalesItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };
        
        const qty = field === 'quantity' ? parseFloat(value) : item.quantity;
        const rate = field === 'rate' ? parseFloat(value) : item.rate;
        const disc = field === 'discount' ? parseFloat(value) : item.discount;
        const taxType = field === 'taxType' ? value : item.taxType;
        const cgst = field === 'cgst' ? parseFloat(value) : item.cgst;
        const sgst = field === 'sgst' ? parseFloat(value) : item.sgst;
        const igst = field === 'igst' ? parseFloat(value) : item.igst;

        const subtotal = (qty * rate);
        const taxableAmount = subtotal - disc;
        let taxAmount = taxType === "IGST" ? (taxableAmount * igst) / 100 : (taxableAmount * (cgst + sgst)) / 100;
        item.total = taxableAmount + taxAmount;
        
        newItems[index] = item;
        setItems(newItems);
    };

    const handleSaveDraft = async () => {
        if (!companyId) return toast.error("Select company first");
        const res = await fetch("/api/ops/sales/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: activeDraftId,
                companyId,
                type,
                name: draftName || `Draft ${drafts.length + 1}`,
                data: { customerSlno, workflowId, targetDate, paymentTerms, justification, items, templateId }
            })
        });
        if (res.ok) {
            toast.success("Draft saved");
            fetchDrafts(companyId);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId || !customerSlno || items.length === 0) return toast.error("Fill required fields");

        const res = await fetch("/api/ops/sales/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type, companyId, customerSlno, items, targetDate, paymentTerms, justification,
                dispatchDetails, lrNumber, vehicleNumber, placeOfSupply,
                parentDocumentId: initialData?.id,
                creatorId: "clw... (mock)" // Needs real user ID
            })
        });

        if (res.ok) {
            toast.success(`${typeLabels[type].title} created successfully`);
            setIsOpen(false);
            onSuccess?.();
        }
    };

    const subTotal = items.reduce((sum, it) => sum + (it.quantity * it.rate), 0);
    const totalDiscount = items.reduce((sum, it) => sum + it.discount, 0);
    const totalTax = items.reduce((sum, it) => {
        const taxable = (it.quantity * it.rate) - it.discount;
        return sum + (it.taxType === "IGST" ? (taxable * it.igst / 100) : (taxable * (it.cgst + it.sgst) / 100));
    }, 0);
    const grandTotal = Math.round(subTotal - totalDiscount + totalTax);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {initialData ? (
                    <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                        <ArrowRight className="w-4 h-4 mr-2" /> Convert to {type}
                    </Button>
                ) : (
                    <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
                        <Plus className="w-4 h-4 mr-2" /> {typeLabels[type].btn}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto hidden-scrollbar">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle>{typeLabels[type].title} {initialData && <span className="text-zinc-400 font-normal text-sm">from {initialData.documentNumber}</span>}</DialogTitle>
                    <div className="flex items-center gap-2">
                        {companyId && (
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-dashed"><Clock className="h-4 w-4 mr-2" /> Drafts ({drafts.length})</Button></PopoverTrigger>
                                <PopoverContent className="w-64 p-0">
                                    <div className="p-2 bg-zinc-50 border-b font-bold text-[10px] uppercase tracking-widest text-zinc-400">Saved Drafts</div>
                                    {drafts.map(d => (
                                        <div key={d.id} className="p-3 border-b hover:bg-zinc-50 cursor-pointer flex justify-between group" onClick={() => { setActiveDraftId(d.id); setDraftName(d.name); setCustomerSlno(d.data.customerSlno); setItems(d.data.items); }}>
                                            <span className="text-sm font-bold truncate">{d.name}</span>
                                            <Trash2 className="h-4 w-4 text-red-400 opacity-0 group-hover:opacity-100" />
                                        </div>
                                    ))}
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Company <span className="text-red-500">*</span></Label>
                            <Select value={companyId} onValueChange={setCompanyId}>
                                <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
                                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Customer <span className="text-red-500">*</span></Label>
                            <Select value={customerSlno} onValueChange={setCustomerSlno}>
                                <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                                <SelectContent>{customers.map(c => <SelectItem key={c.slno} value={c.slno.toString()}>{c.customerName}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{type === "QUOTATION" ? "Validity Date" : "Expected Delivery Date"}</Label>
                            <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                        </div>
                    </div>

                    {(type === "INVOICE" || type === "PI") && (
                        <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <div className="space-y-1 col-span-2">
                                <Label className="text-[10px] uppercase font-bold text-blue-600">Dispatch Details</Label>
                                <Input placeholder="e.g. Courier, Local Transport" value={dispatchDetails} onChange={e => setDispatchDetails(e.target.value)} className="h-8 text-xs bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-blue-600">LR / Docket No.</Label>
                                <Input placeholder="LR123..." value={lrNumber} onChange={e => setLrNumber(e.target.value)} className="h-8 text-xs bg-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-blue-600">Vehicle No.</Label>
                                <Input placeholder="KA 01..." value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} className="h-8 text-xs bg-white" />
                            </div>
                        </div>
                    )}

                    <div className="border rounded-lg p-4 bg-zinc-50 space-y-4">
                        <div className="flex justify-between items-center"><h3 className="font-semibold text-zinc-700">Line Items</h3><Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button></div>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-[1fr_80px_110px_100px_90px_130px_40px] gap-3 bg-white p-3 border rounded shadow-sm items-start">
                                    <Input value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} placeholder="Description" required className="text-xs h-9" />
                                    <Input type="number" step="0.01" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="text-xs h-9 text-center font-bold" />
                                    <Input type="number" step="0.01" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} className="text-xs h-9 text-right font-bold text-emerald-700" />
                                    <Select value={item.taxType} onValueChange={v => updateItem(index, 'taxType', v as any)}><SelectTrigger className="text-[10px] h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="IGST">IGST</SelectItem><SelectItem value="CGST_SGST">CGST/SGST</SelectItem></SelectContent></Select>
                                    <Input type="number" value={item.discount} onChange={e => updateItem(index, 'discount', e.target.value)} placeholder="Disc" className="text-xs h-9 text-red-500" />
                                    <div className="h-9 border rounded bg-zinc-900 flex items-center justify-end px-3 font-bold text-sm text-emerald-400 tracking-tighter">{formatIndianCurrency(item.total).replace('₹', '')}</div>
                                    <Button type="button" variant="ghost" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 h-9 w-9 p-0"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t gap-4">
                        <div className="flex-1 max-w-xs">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Document Template</Label>
                            <Select value={templateId} onValueChange={setTemplateId}>
                                <SelectTrigger className="h-9 text-xs bg-zinc-50"><SelectValue placeholder="Select Template" /></SelectTrigger>
                                <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id!}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Popover>
                                <PopoverTrigger asChild><Button type="button" variant="outline" className="border-zinc-300 text-zinc-700"><Save className="w-4 h-4 mr-2" /> Draft</Button></PopoverTrigger>
                                <PopoverContent className="w-64 p-3 space-y-2"><Label className="text-[10px] font-bold uppercase">Draft Name</Label><Input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder={`Draft ${drafts.length + 1}`} className="h-8 text-xs" /><Button className="w-full h-8 text-xs bg-zinc-900 text-white" onClick={handleSaveDraft}>Save Progress</Button></PopoverContent>
                            </Popover>
                            {templateId && <Button type="button" variant="outline" className="border-zinc-300 text-zinc-700" onClick={() => setIsPreviewOpen(true)}><Eye className="w-4 h-4 mr-2" /> Preview</Button>}
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">Raise for Approval</Button>
                        </div>
                    </div>
                </form>

                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-[900px] h-[95vh] p-0 flex flex-col bg-zinc-100 overflow-hidden">
                        <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between shrink-0">
                            <DialogTitle className="flex items-center gap-2"><Layout className="h-5 w-5 text-emerald-600" /> {typeLabels[type].title} Preview</DialogTitle>
                            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>Close</Button><Button size="sm" className="bg-zinc-900 text-white" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button></div>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-8 flex justify-center scrollbar-thin">
                            {templateId && (
                                <DocumentRenderer 
                                    template={templates.find(t => t.id === templateId)}
                                    data={{
                                        company: companies.find(c => c.id === companyId),
                                        partner: customers.find(s => s.slno.toString() === customerSlno) || {},
                                        items: items,
                                        totals: { subTotal, discount: totalDiscount, tax: totalTax, grandTotal, roundOff: 0, amountInWords: numberToIndianWords(grandTotal) },
                                        bank: primaryBank,
                                        docType: typeLabels[type].title.toUpperCase()
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
