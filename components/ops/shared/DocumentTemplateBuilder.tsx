"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Layout, Settings2, Eye, Save, Trash, CheckCircle, Smartphone, Monitor, FileJson, Bold, Underline, List } from "lucide-react"
import { toast } from "sonner"

type Template = {
    id?: string
    name: string
    docType: string
    layoutConfig: any
    isDefault: boolean
}

const PRESETS = [
    { id: 'industrial', name: 'Industrial Pro', style: 'traditional', color: '#334155' },
    { id: 'modern', name: 'Modern Minimal', style: 'clean', color: '#10b981' },
    { id: 'corporate', name: 'Corporate Blue', style: 'structured', color: '#2563eb' },
    { id: 'compact', name: 'Compact Grid', style: 'dense', color: '#71717a' },
    { id: 'executive', name: 'Executive Gold', style: 'premium', color: '#d97706' }
];

export function DocumentTemplateBuilder({ 
    company, 
    open, 
    onOpenChange 
}: { 
    company: any, 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
    const [loading, setLoading] = useState(false)
    const [primaryBank, setPrimaryBank] = useState<any>(null)

    useEffect(() => {
        if (open && company) {
            fetchTemplates()
            fetchPrimaryBank()
        }
    }, [open, company])

    async function fetchPrimaryBank() {
        try {
            const res = await fetch(`/api/companies/banks?companyId=${company.id}`)
            if (res.ok) {
                const data = await res.json()
                setPrimaryBank(data.find((b: any) => b.isPrimary) || data[0] || null)
            }
        } catch (e) {}
    }

    async function fetchTemplates() {
        try {
            const res = await fetch(`/api/companies/templates?companyId=${company.id}`)
            if (res.ok) {
                const data = await res.json()
                setTemplates(data)
                if (data.length > 0) setActiveTemplate(data[0])
            }
        } catch (e) {
            toast.error("Failed to load templates")
        }
    }

    const handleCreateFromPreset = (preset: any) => {
        if (templates.length >= 10) {
            toast.error("Max 10 templates reached")
            return
        }

        const newTemplate: Template = {
            name: `${preset.name} New`,
            docType: "INVOICE",
            isDefault: templates.length === 0,
            layoutConfig: {
                presetId: preset.id,
                themeColor: preset.color,
                logoPosition: preset.id === 'executive' ? 'center' : 'left',
                showHeader: true,
                showFooter: true,
                repeatHeader: true,
                fontSize: preset.id === 'compact' ? '9pt' : '12pt',
                termsContent: company.conditions || "1. E.& O.E.\n2. Subject to jurisdiction.",
                footerContent: "Thank you for your business!",
                generatedNoteContent: "This is a computer generated document, no physical signature is required.",
                sections: [
                    { id: 'header', visible: true, order: 0 },
                    { id: 'partner', visible: true, order: 1 },
                    { id: 'items', visible: true, order: 2 },
                    { id: 'summary', visible: true, order: 3 },
                    { id: 'terms', visible: true, order: 4 },
                    { id: 'bank', visible: true, order: 5 },
                    { id: 'signature', visible: true, order: 6 },
                    { id: 'footer', visible: true, order: 7 },
                    { id: 'generatedNote', visible: true, order: 8 }
                ]
            }
        }
        setActiveTemplate(newTemplate)
    }

    async function handleSave() {
        if (!activeTemplate) return;
        setLoading(true)
        try {
            const res = await fetch("/api/companies/templates", {
                method: activeTemplate.id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...activeTemplate, companyId: company.id })
            })
            if (res.ok) {
                toast.success("Template saved successfully")
                fetchTemplates()
            }
        } catch (e) {
            toast.error("Failed to save template")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this template?")) return
        try {
            const res = await fetch(`/api/companies/templates?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Template deleted")
                fetchTemplates()
                setActiveTemplate(null)
            }
        } catch (e) {
            toast.error("Delete failed")
        }
    }

    const formatPreviewText = (text: string) => {
        if (!text) return "";
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/^- (.*)/gm, '• $1')
            .replace(/\n/g, '<br />');
        return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    const insertTag = (tagStart: string, tagEnd: string) => {
        const textarea = document.getElementById('terms-editor') as HTMLTextAreaElement;
        if (!textarea || !activeTemplate) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = activeTemplate.layoutConfig.termsContent || "";
        const selectedText = text.substring(start, end);
        const newText = text.substring(0, start) + tagStart + selectedText + tagEnd + text.substring(end);

        setActiveTemplate({
            ...activeTemplate,
            layoutConfig: { ...activeTemplate.layoutConfig, termsContent: newText }
        });
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tagStart.length, end + tagStart.length);
        }, 10);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-zinc-50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <Layout className="h-5 w-5 text-emerald-600" />
                                Document Template Builder
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">Customize your Quotations, Invoices, and Purchase Orders for {company?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={loading}>
                                <Save className="h-4 w-4 mr-2" /> Save Template
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-80 border-r bg-zinc-50/50 flex flex-col overflow-hidden">
                        <div className="p-4 flex-1 overflow-y-auto space-y-6">
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Saved Templates ({templates.length}/10)</Label>
                                <div className="space-y-1">
                                    {templates.map(t => (
                                        <div 
                                            key={t.id} 
                                            className={`p-2 rounded-lg cursor-pointer flex items-center justify-between group ${activeTemplate?.id === t.id ? 'bg-emerald-100 border-emerald-200 border' : 'hover:bg-zinc-100 border border-transparent'}`}
                                            onClick={() => setActiveTemplate(t)}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileJson className={`h-4 w-4 shrink-0 ${activeTemplate?.id === t.id ? 'text-emerald-600' : 'text-zinc-400'}`} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold truncate leading-tight">{t.name}</span>
                                                    <span className={`text-[10px] uppercase font-black tracking-tighter ${activeTemplate?.id === t.id ? 'text-emerald-600/70' : 'text-zinc-400'}`}>
                                                        {t.docType === 'INVOICE' ? 'Tax Invoice' : t.docType === 'PO' ? 'Purchase Order' : t.docType}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(t.id!); }}>
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <Label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Start from Design Pattern</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {PRESETS.map(p => (
                                        <button 
                                            key={p.id} 
                                            className="p-4 text-left border rounded-xl hover:border-emerald-500 transition-all bg-white shadow-sm hover:shadow-md"
                                            onClick={() => handleCreateFromPreset(p)}
                                        >
                                            <p className="text-sm font-black text-zinc-800">{p.name}</p>
                                            <p className="text-[10px] text-zinc-400 mb-2">Pattern: {p.style}</p>
                                            <div className="h-12 w-full bg-zinc-50 rounded border flex items-center justify-center">
                                                <div className="w-1/2 h-1 mx-0.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                <div className="w-1/4 h-1 mx-0.5 bg-zinc-200 rounded-full" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Builder */}
                    <div className="flex-1 flex flex-col bg-zinc-100 overflow-hidden relative">
                        {activeTemplate ? (
                            <div className="flex-1 flex overflow-hidden">
                                {/* Configuration Panel */}
                                <div className="w-80 border-r bg-white p-4 overflow-y-auto space-y-6 shrink-0 shadow-lg z-10">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Template Name</Label>
                                            <Input value={activeTemplate.name} onChange={(e) => setActiveTemplate({...activeTemplate, name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Document Type</Label>
                                            <select 
                                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                                                value={activeTemplate.docType}
                                                onChange={(e) => setActiveTemplate({...activeTemplate, docType: e.target.value})}
                                            >
                                                <option value="INVOICE">Tax Invoice</option>
                                                <option value="PO">Purchase Order</option>
                                                <option value="QUOTATION">Quotation</option>
                                                <option value="DC">Delivery Challan</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Design Overrides</Label>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs">Logo Position</Label>
                                                <select 
                                                    className="text-xs h-7 rounded border bg-zinc-50"
                                                    value={activeTemplate.layoutConfig.logoPosition}
                                                    onChange={(e) => setActiveTemplate({
                                                        ...activeTemplate, 
                                                        layoutConfig: {...activeTemplate.layoutConfig, logoPosition: e.target.value}
                                                    })}
                                                >
                                                    <option value="left">Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="right">Right</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs">Theme Color</Label>
                                                <input 
                                                    type="color" 
                                                    className="h-6 w-10 p-0 border-none rounded cursor-pointer"
                                                    value={activeTemplate.layoutConfig.themeColor}
                                                    onChange={(e) => setActiveTemplate({
                                                        ...activeTemplate, 
                                                        layoutConfig: {...activeTemplate.layoutConfig, themeColor: e.target.value}
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Content</Label>
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px]">Terms & Conditions</Label>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => insertTag('**', '**')}><Bold className="h-3 w-3"/></Button>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => insertTag('__', '__')}><Underline className="h-3 w-3"/></Button>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => insertTag('- ', '')}><List className="h-3 w-3"/></Button>
                                                    </div>
                                                </div>
                                                <Textarea 
                                                    id="terms-editor"
                                                    className="text-[10px] min-h-[80px]" 
                                                    value={activeTemplate.layoutConfig.termsContent}
                                                    onChange={(e) => setActiveTemplate({
                                                        ...activeTemplate,
                                                        layoutConfig: {...activeTemplate.layoutConfig, termsContent: e.target.value}
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px]">Footer Note</Label>
                                                <Input 
                                                    className="text-[10px] h-8" 
                                                    value={activeTemplate.layoutConfig.footerContent}
                                                    onChange={(e) => setActiveTemplate({
                                                        ...activeTemplate,
                                                        layoutConfig: {...activeTemplate.layoutConfig, footerContent: e.target.value}
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t pt-4">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Section Visibility</Label>
                                        <div className="space-y-2 pb-8">
                                            {activeTemplate.layoutConfig.sections.map((s: any) => (
                                                <div key={s.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg">
                                                    <span className="text-xs capitalize font-medium">{s.id === 'generatedNote' ? 'Computer Note' : s.id}</span>
                                                    <Switch 
                                                        checked={s.visible}
                                                        onCheckedChange={(val) => {
                                                            const newSections = activeTemplate.layoutConfig.sections.map((sec: any) => 
                                                                sec.id === s.id ? {...sec, visible: val} : sec
                                                            )
                                                            setActiveTemplate({
                                                                ...activeTemplate,
                                                                layoutConfig: {...activeTemplate.layoutConfig, sections: newSections}
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Canvas */}
                                <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-zinc-200 scrollbar-thin">
                                    <div className="w-[800px] min-h-[1100px] bg-white shadow-2xl p-12 flex flex-col relative" style={{ fontSize: activeTemplate.layoutConfig.fontSize }}>
                                        
                                        {/* PATTERN 1: CORPORATE (Banner style) */}
                                        {activeTemplate.layoutConfig.presetId === 'corporate' && (
                                            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: activeTemplate.layoutConfig.themeColor }} />
                                        )}

                                        {/* Header Pattern Logic */}
                                        <div className={`flex items-start mb-10 pb-6 ${activeTemplate.layoutConfig.presetId === 'modern' ? '' : 'border-b-2'}`} 
                                            style={{ 
                                                borderColor: activeTemplate.layoutConfig.themeColor, 
                                                flexDirection: activeTemplate.layoutConfig.logoPosition === 'right' ? 'row-reverse' : activeTemplate.layoutConfig.logoPosition === 'center' ? 'column' : 'row',
                                                textAlign: activeTemplate.layoutConfig.logoPosition === 'center' ? 'center' : 'left'
                                            }}
                                        >
                                            <div className="flex-1">
                                                {company.logo ? (
                                                    <div className={`flex ${activeTemplate.layoutConfig.logoPosition === 'center' ? 'justify-center' : activeTemplate.layoutConfig.logoPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                                                        <img src={company.logo} className={`h-20 ${activeTemplate.layoutConfig.logoPosition === 'center' ? 'mb-4' : 'mb-2'}`} />
                                                    </div>
                                                ) : (
                                                    <div className={`h-16 w-32 bg-zinc-100 rounded flex items-center justify-center text-zinc-400 text-[10px] border border-dashed ${activeTemplate.layoutConfig.logoPosition === 'right' ? 'ml-auto' : activeTemplate.layoutConfig.logoPosition === 'center' ? 'mx-auto' : ''}`}>LOGO</div>
                                                )}
                                                {activeTemplate.layoutConfig.presetId === 'executive' && (
                                                    <div className="mt-2">
                                                        <h2 className="text-xl font-bold tracking-widest uppercase">{company.name}</h2>
                                                        <div className="h-0.5 w-16 bg-zinc-200 mx-auto mt-1" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className={`flex-1 ${activeTemplate.layoutConfig.logoPosition === 'center' ? 'w-full' : activeTemplate.layoutConfig.logoPosition === 'right' ? 'text-left' : 'text-right'}`}>
                                                <h1 className={`text-3xl font-black uppercase tracking-tighter`} style={{ color: activeTemplate.layoutConfig.themeColor }}>
                                                    {activeTemplate.docType}
                                                </h1>
                                                <div className="mt-2 space-y-0.5">
                                                    <p className="text-xs font-bold text-zinc-600">No: {activeTemplate.docType}-2024-001</p>
                                                    <p className="text-[10px] text-zinc-400">Dated: 16 May 2024</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address Block Pattern Logic */}
                                        <div className={`grid grid-cols-2 gap-12 mb-10 ${activeTemplate.layoutConfig.presetId === 'industrial' ? 'border p-4 bg-zinc-50/50' : ''}`}>
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Company Details</p>
                                                {activeTemplate.layoutConfig.presetId !== 'executive' && <p className="text-sm font-black">{company.name}</p>}
                                                <p className="text-[10px] text-zinc-600 leading-relaxed">{company.address || "Company Address..."}</p>
                                                <div className="pt-2">
                                                    <p className="text-[10px] font-bold">GSTIN: <span className="text-zinc-600">{company.registrationNumber || "29AAAAA0000A1Z5"}</span></p>
                                                    <p className="text-[10px] font-bold">Contact: <span className="text-zinc-600">{company.contactPhone || company.contactEmail}</span></p>
                                                </div>
                                            </div>
                                            <div className={`space-y-1 ${activeTemplate.layoutConfig.presetId === 'industrial' ? 'border-l pl-8' : 'text-right'}`}>
                                                <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Billed To</p>
                                                <p className="text-sm font-black text-zinc-800">[Customer Name]</p>
                                                <p className="text-[10px] text-zinc-400 italic">Customer address will be loaded dynamically here...</p>
                                            </div>
                                        </div>

                                        {/* Table Pattern Logic */}
                                        <div className="flex-1">
                                            <table className={`w-full text-xs ${activeTemplate.layoutConfig.presetId === 'modern' ? 'border-collapse' : 'border'}`}>
                                                <thead>
                                                    <tr className={`${activeTemplate.layoutConfig.presetId === 'modern' ? 'border-b-2' : 'border-b'}`} style={{ backgroundColor: activeTemplate.layoutConfig.presetId === 'corporate' ? activeTemplate.layoutConfig.themeColor + '10' : '#f9fafb', borderColor: activeTemplate.layoutConfig.themeColor }}>
                                                        <th className="py-3 px-4 text-left font-black">#</th>
                                                        <th className="py-3 px-4 text-left font-black">DESCRIPTION OF GOODS</th>
                                                        <th className="py-3 px-4 text-right font-black">QTY</th>
                                                        <th className="py-3 px-4 text-right font-black">RATE</th>
                                                        <th className="py-3 px-4 text-right font-black">TOTAL</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`${activeTemplate.layoutConfig.presetId === 'modern' ? '' : 'divide-y'}`}>
                                                    {[1, 2, 3].map(i => (
                                                        <tr key={i} className={`${activeTemplate.layoutConfig.presetId === 'corporate' && i % 2 === 0 ? 'bg-zinc-50/50' : ''}`}>
                                                            <td className="py-4 px-4 text-zinc-500">{i}</td>
                                                            <td className="py-4 px-4">
                                                                <p className="font-bold text-zinc-800">Premium Product Item Alpha {i}</p>
                                                                <p className="text-[10px] text-zinc-400">HSN: 8471 | Warranty: 1 Year</p>
                                                            </td>
                                                            <td className="py-4 px-4 text-right">10.00</td>
                                                            <td className="py-4 px-4 text-right">150.00</td>
                                                            <td className="py-4 px-4 text-right font-black text-zinc-800">1,500.00</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Totals Block Pattern */}
                                        <div className="mt-10 flex justify-end">
                                            <div className={`w-72 space-y-2 ${activeTemplate.layoutConfig.presetId === 'modern' ? '' : 'border p-4 bg-zinc-50/30'}`}>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-zinc-500">Subtotal</span>
                                                    <span className="font-bold">4,500.00</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-zinc-500">
                                                    <span>Tax (IGST 18%)</span>
                                                    <span>810.00</span>
                                                </div>
                                                <div className={`flex justify-between text-base font-black pt-2 mt-2 border-t-2`} style={{ borderColor: activeTemplate.layoutConfig.themeColor, color: activeTemplate.layoutConfig.themeColor }}>
                                                    <span>TOTAL</span>
                                                    <span>₹ 5,310.00</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Block Pattern */}
                                        <div className={`mt-12 pt-8 border-t border-zinc-100 space-y-8`}>
                                            <div className="grid grid-cols-2 gap-12">
                                                <div className="space-y-4">
                                                    {activeTemplate.layoutConfig.sections.find((s: any) => s.id === 'terms')?.visible && (
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase text-zinc-400">Terms & Conditions</p>
                                                            <div className="text-[9px] text-zinc-600 leading-relaxed">
                                                                {formatPreviewText(activeTemplate.layoutConfig.termsContent)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {activeTemplate.layoutConfig.sections.find((s: any) => s.id === 'bank')?.visible && (
                                                        <div className="p-3 bg-zinc-50 border rounded-lg">
                                                            <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Bank Details</p>
                                                            <div className="text-[9px] grid grid-cols-1 gap-1">
                                                                <p><span className="text-zinc-400 font-bold uppercase">Bank:</span> {primaryBank?.bankName || "N/A"}</p>
                                                                <p><span className="text-zinc-400 font-bold uppercase">A/C No:</span> {primaryBank?.accountNumber || "N/A"}</p>
                                                                <p><span className="text-zinc-400 font-bold uppercase">IFSC:</span> {primaryBank?.ifscCode || "N/A"}</p>
                                                                <p><span className="text-zinc-400 font-bold uppercase">Branch:</span> {primaryBank?.branchName || "N/A"}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-col items-center justify-end text-center space-y-4">
                                                    {activeTemplate.layoutConfig.sections.find((s: any) => s.id === 'signature')?.visible && (
                                                        <>
                                                            <div className="relative">
                                                                {company.seal && <img src={company.seal} className="h-16 w-16 opacity-30 absolute -top-8 -left-8" />}
                                                                {company.signature && <img src={company.signature} className="h-12 relative z-10" />}
                                                            </div>
                                                            <div className="w-48 border-t border-zinc-300 pt-2">
                                                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Authorized Signatory</p>
                                                                <p className="text-[8px] text-zinc-400">for {company.name}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {activeTemplate.layoutConfig.sections.find((s: any) => s.id === 'generatedNote')?.visible && (
                                                <p className="text-[8px] text-center text-zinc-400 italic">
                                                    * {activeTemplate.layoutConfig.generatedNoteContent}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                                    <Settings2 className="h-10 w-10 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold">Select a Design Pattern</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-2">Choose from our curated professional layouts on the left to start customizing your document.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
