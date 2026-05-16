"use client"

import React from "react"
import { Landmark, ShieldCheck } from "lucide-react"

type DocumentData = {
    company: any
    partner: any
    items: any[]
    totals: {
        subTotal: number
        discount: number
        tax: number
        grandTotal: number
        roundOff: number
        amountInWords: string
    }
    bank?: any
    docType: string
    docNumber?: string
    docDate?: string
}

export function DocumentRenderer({ 
    template, 
    data 
}: { 
    template: any, 
    data: DocumentData 
}) {
    if (!template) return null

    const config = template.layoutConfig
    const { company, partner, items, totals, bank, docType, docNumber, docDate } = data

    const formatPreviewText = (text: string) => {
        if (!text) return "";
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/^- (.*)/gm, '• $1')
            .replace(/\n/g, '<br />');
        return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="print-document bg-white shadow-2xl p-12 flex flex-col relative mx-auto overflow-hidden" 
             style={{ 
                 width: '800px', 
                 minHeight: '1120px', 
                 fontSize: config.fontSize || '11pt',
                 fontFamily: 'Inter, sans-serif'
             }}>
            
            {/* Styles for Printing */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-document, .print-document * { visibility: visible; }
                    .print-document { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100% !important; 
                        height: 100% !important;
                        padding: 40px !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            {/* Pattern Bar */}
            {config.presetId === 'corporate' && (
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: config.themeColor }} />
            )}

            {/* Header */}
            <div className={`flex items-start mb-8 pb-6 ${config.presetId === 'modern' ? '' : 'border-b-2'}`} 
                style={{ 
                    borderColor: config.themeColor, 
                    flexDirection: config.logoPosition === 'right' ? 'row-reverse' : config.logoPosition === 'center' ? 'column' : 'row',
                    textAlign: config.logoPosition === 'center' ? 'center' : 'left'
                }}
            >
                <div className="flex-1">
                    {company.logo ? (
                        <div className={`flex ${config.logoPosition === 'center' ? 'justify-center' : config.logoPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                            <img src={company.logo} className={`h-20 ${config.logoPosition === 'center' ? 'mb-4' : 'mb-2'}`} />
                        </div>
                    ) : (
                        <div className={`h-16 w-32 bg-zinc-100 rounded flex items-center justify-center text-zinc-400 text-[10px] border border-dashed ${config.logoPosition === 'right' ? 'ml-auto' : config.logoPosition === 'center' ? 'mx-auto' : ''}`}>LOGO</div>
                    )}
                    {config.presetId === 'executive' && (
                        <div className="mt-2">
                            <h2 className="text-xl font-bold tracking-widest uppercase">{company.name}</h2>
                            <div className="h-0.5 w-16 bg-zinc-200 mx-auto mt-1" />
                        </div>
                    )}
                </div>
                
                <div className={`flex-1 ${config.logoPosition === 'center' ? 'w-full mt-4' : config.logoPosition === 'right' ? 'text-left' : 'text-right'}`}>
                    <h1 className="text-3xl font-black uppercase tracking-tighter" style={{ color: config.themeColor }}>
                        {docType}
                    </h1>
                    <div className="mt-2 space-y-0.5">
                        <p className="text-sm font-bold text-zinc-600">No: {docNumber || "DRAFT"}</p>
                        <p className="text-xs text-zinc-400">Dated: {docDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Address Blocks */}
            <div className={`grid grid-cols-2 gap-12 mb-8 ${config.presetId === 'industrial' ? 'border p-4 bg-zinc-50/50' : ''}`}>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Company Details</p>
                    {config.presetId !== 'executive' && <p className="text-sm font-black">{company.name}</p>}
                    <p className="text-[11px] text-zinc-600 leading-relaxed">{company.address}</p>
                    <div className="pt-2">
                        <p className="text-[11px] font-bold">GSTIN: <span className="text-zinc-600">{company.registrationNumber}</span></p>
                        <p className="text-[11px] font-bold">Contact: <span className="text-zinc-600">{company.contactPhone || company.contactEmail}</span></p>
                    </div>
                </div>
                <div className={`space-y-1 ${config.presetId === 'industrial' ? 'border-l pl-8' : 'text-right'}`}>
                    <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Vendor / Party</p>
                    <p className="text-sm font-black text-zinc-800">{partner.supplierName || partner.name}</p>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">{partner.address || partner.supplierAddress}</p>
                    <div className="pt-2">
                        <p className="text-[11px] font-bold">GSTIN: <span className="text-zinc-600">{partner.gstNumber || partner.registrationNumber || "N/A"}</span></p>
                        <p className="text-[11px] font-bold">Contact: <span className="text-zinc-600">{partner.contactPhone || partner.email}</span></p>
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="flex-1 overflow-hidden">
                <table className={`w-full text-xs ${config.presetId === 'modern' ? 'border-collapse' : 'border'}`}>
                    <thead>
                        <tr className={`${config.presetId === 'modern' ? 'border-b-2' : 'border-b'}`} style={{ backgroundColor: config.presetId === 'corporate' ? config.themeColor + '10' : '#f9fafb', borderColor: config.themeColor }}>
                            <th className="py-3 px-4 text-left font-black">#</th>
                            <th className="py-3 px-4 text-left font-black">DESCRIPTION OF GOODS</th>
                            <th className="py-3 px-4 text-center font-black">QTY</th>
                            <th className="py-3 px-4 text-right font-black">RATE</th>
                            <th className="py-3 px-4 text-right font-black">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody className={`${config.presetId === 'modern' ? '' : 'divide-y'}`}>
                        {items.map((item, i) => (
                            <tr key={i} className={`${config.presetId === 'corporate' && i % 2 === 0 ? 'bg-zinc-50/50' : ''}`}>
                                <td className="py-3 px-4 text-zinc-400 align-top">{i + 1}</td>
                                <td className="py-3 px-4 align-top">
                                    <p className="font-bold text-zinc-800">{item.description}</p>
                                    <p className="text-[10px] text-zinc-400">HSN/SAC: {item.hsnCode || "N/A"}</p>
                                </td>
                                <td className="py-3 px-4 text-center align-top font-medium">{item.quantity}</td>
                                <td className="py-3 px-4 text-right align-top">{formatCurrency(item.rate).replace('₹', '')}</td>
                                <td className="py-3 px-4 text-right align-top font-black text-zinc-800">{formatCurrency(item.total).replace('₹', '')}</td>
                            </tr>
                        ))}
                        {/* Empty rows to maintain height if needed */}
                        {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
                            <tr key={`empty-${i}`} className="h-10 border-none"><td colSpan={5}></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="mt-8 flex justify-between items-start">
                <div className="flex-1 pr-8">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase mb-1">Amount in Words</div>
                    <div className="p-3 bg-zinc-50 rounded-lg italic text-[11px] text-zinc-700 leading-relaxed border">
                        {totals.amountInWords}
                    </div>
                </div>
                <div className={`w-72 space-y-2 ${config.presetId === 'modern' ? '' : 'border p-4 bg-zinc-50/30 rounded-lg shadow-sm'}`}>
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500 font-medium">Subtotal</span>
                        <span className="font-bold">{formatCurrency(totals.subTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-red-500">
                        <span>Discount (-)</span>
                        <span className="font-bold">{formatCurrency(totals.discount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                        <span>Total Tax (+)</span>
                        <span>{formatCurrency(totals.tax)}</span>
                    </div>
                    <div className={`flex justify-between text-xs ${totals.roundOff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        <span>Round Off</span>
                        <span>{formatCurrency(totals.roundOff)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black pt-2 mt-2 border-t-2" style={{ borderColor: config.themeColor, color: config.themeColor }}>
                        <span>TOTAL</span>
                        <span>{formatCurrency(totals.grandTotal)}</span>
                    </div>
                </div>
            </div>

            {/* Conditions & Signature */}
            <div className="mt-10 pt-6 border-t border-zinc-100 space-y-8">
                <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-4">
                        {config.sections.find((s: any) => s.id === 'terms')?.visible && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-zinc-400">Terms & Conditions</p>
                                <div className="text-[10px] text-zinc-600 leading-relaxed">
                                    {formatPreviewText(config.termsContent)}
                                </div>
                            </div>
                        )}
                        {config.sections.find((s: any) => s.id === 'bank')?.visible && bank && (
                            <div className="p-3 bg-zinc-50 border rounded-lg">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Payment Details</p>
                                <div className="text-[10px] space-y-1">
                                    <p><span className="text-zinc-400 uppercase font-bold text-[9px]">Bank:</span> <span className="font-semibold">{bank.bankName}</span></p>
                                    <p><span className="text-zinc-400 uppercase font-bold text-[9px]">A/C No:</span> <span className="font-semibold">{bank.accountNumber}</span></p>
                                    <p><span className="text-zinc-400 uppercase font-bold text-[9px]">IFSC:</span> <span className="font-semibold">{bank.ifscCode}</span></p>
                                    <p><span className="text-zinc-400 uppercase font-bold text-[9px]">Branch:</span> <span className="font-semibold">{bank.branchName}</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-center justify-end text-center space-y-4 min-h-[140px]">
                        {config.sections.find((s: any) => s.id === 'signature')?.visible && (
                            <>
                                <div className="relative h-20 w-32 flex items-center justify-center">
                                    {company.seal && <img src={company.seal} className="h-20 w-20 opacity-30 absolute top-0 left-0" />}
                                    {company.signature && <img src={company.signature} className="h-14 relative z-10" />}
                                </div>
                                <div className="w-full border-t border-zinc-300 pt-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Authorized Signatory</p>
                                    <p className="text-[9px] text-zinc-400">for {company.name}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {config.sections.find((s: any) => s.id === 'generatedNote')?.visible && (
                    <p className="text-[9px] text-center text-zinc-400 italic">
                        * {config.generatedNoteContent}
                    </p>
                )}
            </div>
        </div>
    )
}
