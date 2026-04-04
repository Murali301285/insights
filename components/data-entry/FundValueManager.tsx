"use client"
import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Pencil, Trash, Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface FundValueManagerProps {
    activeCompanyId: string
}

export function FundValueManager({ activeCompanyId }: FundValueManagerProps) {
    const [funds, setFunds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    
    // Header Modal State
    const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false)

    // Form States
    const [gridFormData, setGridFormData] = useState({
        id: '',
        date: new Date().toISOString().split('T')[0],
        utilised: '',
        remarks: ''
    })

    const [headerFormData, setHeaderFormData] = useState({
        id: '',
        date: new Date().toISOString().split('T')[0],
        fundValue: '',
        remarks: ''
    })

    const fetchFunds = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/finance/fund-value?companyId=${activeCompanyId}`)
            const data = await res.json()
            setFunds(Array.isArray(data) ? data : [])
        } catch (e) {
            toast.error("Failed to load fund values")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeCompanyId) fetchFunds()
    }, [activeCompanyId])

    // Math Engine
    const { totalFund, totalUtilised, available, fyFunds, fyUtilised } = useMemo(() => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const startYear = currentDate.getMonth() >= 3 ? currentYear : currentYear - 1;
        const fyStart = new Date(startYear, 3, 1).getTime();
        const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59).getTime();

        const currentFyFunds = funds.filter(f => {
            const time = new Date(f.date).getTime();
            return time >= fyStart && time <= fyEnd;
        })

        const fundingOnly = currentFyFunds.filter(f => f.fundValue > 0)
        const utilisedOnly = currentFyFunds.filter(f => f.utilised > 0)

        const tFund = fundingOnly.reduce((sum, f) => sum + (f.fundValue || 0), 0)
        const tUtilised = utilisedOnly.reduce((sum, f) => sum + (f.utilised || 0), 0)

        return {
            totalFund: tFund,
            totalUtilised: tUtilised,
            available: tFund - tUtilised,
            fyFunds: fundingOnly,
            fyUtilised: utilisedOnly
        }
    }, [funds])

    const handleNumberChange = (key: 'utilised' | 'fundValue', value: string, form: 'grid' | 'header') => {
        let rawValue = value.replace(/[^0-9.]/g, '');
        const parts = rawValue.split('.');
        if (parts[0]) {
            let numStr = parts[0];
            let lastThree = numStr.substring(numStr.length - 3);
            let otherDigits = numStr.substring(0, numStr.length - 3);
            if (otherDigits !== '') lastThree = ',' + lastThree;
            let formattedInt = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
            let formattedValue = parts.length > 1 ? `${formattedInt}.${parts[1].substring(0, 2)}` : formattedInt;
            
            if (form === 'grid') setGridFormData(prev => ({ ...prev, [key]: formattedValue }));
            if (form === 'header') setHeaderFormData(prev => ({ ...prev, [key]: formattedValue }));
        } else {
            if (form === 'grid') setGridFormData(prev => ({ ...prev, [key]: rawValue }));
            if (form === 'header') setHeaderFormData(prev => ({ ...prev, [key]: rawValue }));
        }
    }

    const resetGridForm = () => {
        setGridFormData({
            id: '',
            date: new Date().toISOString().split('T')[0],
            utilised: '',
            remarks: ''
        })
    }

    const resetHeaderForm = () => {
        setHeaderFormData({
            id: '',
            date: new Date().toISOString().split('T')[0],
            fundValue: '',
            remarks: ''
        })
    }

    const handleSave = async (form: 'grid' | 'header') => {
        const formData = form === 'grid' ? {
            id: gridFormData.id,
            date: gridFormData.date,
            fundValue: '0',
            utilised: gridFormData.utilised,
            remarks: gridFormData.remarks
        } : {
            id: headerFormData.id,
            date: headerFormData.date,
            fundValue: headerFormData.fundValue,
            utilised: '0',
            remarks: headerFormData.remarks
        };

        if (!formData.date || (!formData.fundValue && !formData.utilised)) {
            toast.error("Please enter a valid date and value")
            return
        }

        setSaving(true)
        try {
            const cleanFund = Number(formData.fundValue.replace(/,/g, '')) || 0
            const cleanUtilised = Number(formData.utilised.replace(/,/g, '')) || 0

            const res = await fetch('/api/finance/fund-value', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formData.id || undefined,
                    companyId: activeCompanyId,
                    date: formData.date,
                    fundValue: cleanFund,
                    utilised: cleanUtilised,
                    remarks: formData.remarks
                })
            })

            if (!res.ok) throw new Error("Failed")
            toast.success(formData.id ? "Record updated" : "Record added")
            
            if (form === 'grid') resetGridForm();
            if (form === 'header') resetHeaderForm();
            
            fetchFunds()
        } catch (e: any) {
            toast.error(e.message || "Failed to save")
        } finally {
            setSaving(false)
        }
    }

    const deleteFund = async (id: number) => {
        if (!confirm("Delete this record?")) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/finance/fund-value?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Deleted successfully");
                fetchFunds();
            }
        } finally {
            setSaving(false);
        }
    }

    const formatCurrency = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
    const formatAmount = (val: number) => val === 0 ? "-" : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return (
        <div className="flex-1 flex flex-col h-full bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm w-full mx-auto self-center">
            {/* Header Stats */}
            <div className="bg-zinc-50 border-b border-zinc-200 p-6 grid grid-cols-3 gap-6 shrink-0">
                <div 
                    onClick={() => setIsHeaderModalOpen(true)}
                    className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
                >
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 group-hover:text-indigo-600 transition-colors">Total Fund (FY) <span className="text-indigo-500 font-semibold lowercase ml-1 underline underline-offset-2">Click to Manage</span></p>
                        <p className="text-2xl font-black text-indigo-700">{formatCurrency(totalFund)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Utilised (FY)</p>
                        <p className="text-2xl font-black text-rose-600">{formatCurrency(totalUtilised)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Available Fund (FY)</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(available)}</p>
                    </div>
                </div>
            </div>

            {/* Sub-Header / ToolBar for Grid */}
            <div className="bg-white px-6 py-3 border-b border-zinc-100 shrink-0">
                <h4 className="text-[14px] font-bold text-zinc-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    Fund Utilisation Matrix
                </h4>
            </div>

            {/* Utilisation Table Area */}
            <div className="flex-1 overflow-auto bg-white relative">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] uppercase bg-zinc-50 text-zinc-500 border-b border-zinc-200 sticky top-0 z-30 shadow-sm font-black tracking-wide">
                        <tr>
                            <th className="px-6 py-4 w-[180px]">Date</th>
                            <th className="px-6 py-4 w-[250px]">Utilised Amount</th>
                            <th className="px-6 py-4">Remarks</th>
                            <th className="px-6 py-4 text-center w-[150px]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {/* Data Entry Row - Utilised */}
                        <tr className="bg-rose-50/20">
                            <td className="px-6 py-3">
                                <Input type="date" value={gridFormData.date} onChange={e => setGridFormData({ ...gridFormData, date: e.target.value })} className="h-9 bg-white border-rose-100" />
                            </td>
                            <td className="px-6 py-3 relative">
                                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                                <Input type="text" placeholder="0.00" value={gridFormData.utilised} onChange={e => handleNumberChange('utilised', e.target.value, 'grid')} className="h-9 bg-white pl-8 font-semibold text-rose-700 border-rose-100 focus-visible:ring-rose-500" />
                            </td>
                            <td className="px-6 py-3">
                                <Input placeholder="Add usage context..." value={gridFormData.remarks} onChange={e => setGridFormData({ ...gridFormData, remarks: e.target.value })} className="h-9 bg-white border-rose-100 focus-visible:ring-rose-500" />
                            </td>
                            <td className="px-6 py-3 text-center">
                                <Button size="sm" onClick={() => handleSave('grid')} disabled={saving} className="h-9 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 shadow-sm">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : gridFormData.id ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {gridFormData.id ? 'Save' : 'Add'}
                                </Button>
                                {gridFormData.id && (
                                    <button onClick={resetGridForm} className="text-xs text-zinc-500 hover:text-zinc-700 mt-1 block w-full text-center font-medium underline-offset-2 hover:underline">Cancel Edit</button>
                                )}
                            </td>
                        </tr>

                        {/* History Rows - Utilised */}
                        {loading ? (
                            <tr><td colSpan={4} className="py-12 text-center text-zinc-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></td></tr>
                        ) : fyUtilised.length === 0 ? (
                            <tr><td colSpan={4} className="py-12 text-center text-zinc-400 font-medium text-sm">No utilisation records recorded for current FY.</td></tr>
                        ) : (
                            fyUtilised.map(f => (
                                <tr key={f.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-zinc-700">{new Date(f.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-bold text-rose-700 text-[15px]">
                                        {formatAmount(f.utilised)}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600">{f.remarks || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    setGridFormData({
                                                        id: f.id.toString(),
                                                        date: new Date(f.date).toISOString().split('T')[0],
                                                        utilised: f.utilised ? f.utilised.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : "",
                                                        remarks: f.remarks || ''
                                                    })
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                            </button>
                                            <button 
                                                onClick={() => deleteFund(f.id)}
                                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Total Funds Management Modal */}
            <Dialog open={isHeaderModalOpen} onOpenChange={setIsHeaderModalOpen}>
                <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
                    <div className="p-6 border-b border-zinc-200 bg-zinc-50">
                        <DialogTitle className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                            Manage Total Funds
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 ml-2">Current FY</span>
                        </DialogTitle>
                        <p className="text-sm text-zinc-500 mt-1">Add, edit, or remove overall fund declarations. These sums will construct your <span className="font-bold text-zinc-700">Available Fund</span> baseline.</p>
                    </div>

                    <div className="flex-1 overflow-auto bg-white max-h-[60vh] relative">
                         <table className="w-full text-sm text-left">
                            <thead className="text-[11px] uppercase bg-zinc-50 text-zinc-500 border-b border-zinc-200 sticky top-0 z-30 font-black tracking-wide">
                                <tr>
                                    <th className="px-6 py-4 w-[180px]">Date</th>
                                    <th className="px-6 py-4 w-[250px]">Fund Value Add</th>
                                    <th className="px-6 py-4">Source / Remarks</th>
                                    <th className="px-6 py-4 text-center w-[150px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {/* Setup Fund Row */}
                                <tr className="bg-indigo-50/20">
                                    <td className="px-6 py-3">
                                        <Input type="date" value={headerFormData.date} onChange={e => setHeaderFormData({ ...headerFormData, date: e.target.value })} className="h-9 bg-white border-indigo-100" />
                                    </td>
                                    <td className="px-6 py-3 relative">
                                        <span className="absolute left-9 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">₹</span>
                                        <Input type="text" placeholder="0.00" value={headerFormData.fundValue} onChange={e => handleNumberChange('fundValue', e.target.value, 'header')} className="h-9 bg-white pl-8 font-semibold text-indigo-700 border-indigo-100 focus-visible:ring-indigo-500" />
                                    </td>
                                    <td className="px-6 py-3">
                                        <Input placeholder="Govt Grant, Tranche A..." value={headerFormData.remarks} onChange={e => setHeaderFormData({ ...headerFormData, remarks: e.target.value })} className="h-9 bg-white border-indigo-100 focus-visible:ring-indigo-500" />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <Button size="sm" onClick={() => handleSave('header')} disabled={saving} className="h-9 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-sm">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : headerFormData.id ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            {headerFormData.id ? 'Save' : 'Add'}
                                        </Button>
                                        {headerFormData.id && (
                                            <button onClick={resetHeaderForm} className="text-xs text-zinc-500 hover:text-zinc-700 mt-1 block w-full text-center font-medium underline-offset-2 hover:underline">Cancel Edit</button>
                                        )}
                                    </td>
                                </tr>

                                {/* History Rows - Funding */}
                                {loading ? (
                                    <tr><td colSpan={4} className="py-12 text-center text-zinc-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></td></tr>
                                ) : fyFunds.length === 0 ? (
                                    <tr><td colSpan={4} className="py-12 text-center text-zinc-400 font-medium text-sm">No funding records found.</td></tr>
                                ) : (
                                    fyFunds.map(f => (
                                        <tr key={f.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-zinc-700">{new Date(f.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-bold text-indigo-700 text-[15px]">
                                                {formatAmount(f.fundValue)}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600">{f.remarks || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setHeaderFormData({
                                                                id: f.id.toString(),
                                                                date: new Date(f.date).toISOString().split('T')[0],
                                                                fundValue: f.fundValue ? f.fundValue.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : "",
                                                                remarks: f.remarks || ''
                                                            })
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 font-semibold transition-colors"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteFund(f.id)}
                                                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
