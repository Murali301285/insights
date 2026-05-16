"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Landmark, Plus, Trash, CheckCircle2, AlertCircle, FileImage, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

type BankAccount = {
    id?: string
    bankName: string
    accountType: string
    accountNumber: string
    ifscCode: string
    branchName: string
    address?: string
    chequeLeaf?: string
    isPrimary: boolean
}

const ACCOUNT_TYPES = ["Current", "Savings", "Cash Credit (CC)", "Overdraft (OD)", "Loan Account"];

export function CompanyBankManager({ 
    company, 
    open, 
    onOpenChange 
}: { 
    company: any, 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const [accounts, setAccounts] = useState<BankAccount[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [retypeAccount, setRetypeAccount] = useState("")
    const [formData, setFormData] = useState<BankAccount>({
        bankName: "",
        accountType: "Current",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        address: "",
        isPrimary: false
    })

    useEffect(() => {
        if (open && company) fetchAccounts()
    }, [open, company])

    async function fetchAccounts() {
        try {
            const res = await fetch(`/api/companies/banks?companyId=${company.id}`)
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
                if (data.length === 0) setIsAdding(true)
            }
        } catch (e) {
            toast.error("Failed to load accounts")
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                toast.error("File size must be less than 3MB")
                e.target.value = ""
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData({ ...formData, chequeLeaf: reader.result as string })
            }
            reader.readAsDataURL(file)
        }
    }

    async function handleSave() {
        // Validations
        if (!formData.bankName || !formData.accountNumber || !formData.ifscCode) {
            toast.error("Please fill required fields")
            return
        }

        if (formData.accountNumber !== retypeAccount) {
            toast.error("Account Numbers do not match!")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/companies/banks", {
                method: formData.id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, companyId: company.id })
            })

            if (res.ok) {
                toast.success(formData.id ? "Account updated" : "Account added")
                setIsAdding(false)
                setFormData({ bankName: "", accountType: "Current", accountNumber: "", ifscCode: "", branchName: "", address: "", isPrimary: false })
                setRetypeAccount("")
                fetchAccounts()
            } else {
                const err = await res.text()
                toast.error(err || "Save failed")
            }
        } catch (e) {
            toast.error("Network error")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Remove this bank account?")) return
        try {
            const res = await fetch(`/api/companies/banks?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Account removed")
                fetchAccounts()
            }
        } catch (e) {
            toast.error("Delete failed")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 border-b bg-zinc-50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <Landmark className="h-5 w-5 text-emerald-600" />
                                Bank Account Management
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground mt-1">Manage multiple bank accounts for {company?.name}</p>
                        </div>
                        {!isAdding && (
                            <Button onClick={() => setIsAdding(true)} size="sm" className="bg-emerald-600">
                                <Plus className="h-4 w-4 mr-2" /> Add New Account
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {isAdding ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Bank Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        list="banks-list"
                                        placeholder="e.g. HDFC Bank" 
                                        autoComplete="off"
                                        value={formData.bankName} 
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} 
                                    />
                                    <datalist id="banks-list">
                                        {Array.from(new Set(accounts.map(a => a.bankName))).map(b => <option key={b} value={b} />)}
                                        <option value="HDFC Bank" /><option value="ICICI Bank" /><option value="SBI" /><option value="Axis Bank" />
                                    </datalist>
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Type</Label>
                                    <select 
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.accountType}
                                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                    >
                                        {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Number <span className="text-red-500">*</span></Label>
                                    <Input 
                                        autoComplete="off"
                                        placeholder="Enter A/C Number" 
                                        value={formData.accountNumber} 
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Verify Account Number <span className="text-red-500">*</span></Label>
                                    <Input 
                                        autoComplete="off"
                                        placeholder="Retype A/C Number" 
                                        value={retypeAccount} 
                                        onChange={(e) => setRetypeAccount(e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>IFSC Code <span className="text-red-500">*</span></Label>
                                    <Input 
                                        placeholder="HDFC0001234" 
                                        className="uppercase"
                                        autoComplete="off"
                                        value={formData.ifscCode} 
                                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Branch Name</Label>
                                    <Input 
                                        placeholder="Main Branch, City" 
                                        autoComplete="off"
                                        value={formData.branchName} 
                                        onChange={(e) => setFormData({ ...formData, branchName: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Branch Address (Optional)</Label>
                                    <Input 
                                        placeholder="Full address of the branch" 
                                        autoComplete="off"
                                        value={formData.address} 
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <FileImage className="h-4 w-4 text-zinc-400" />
                                        Cheque Leaf (Optional)
                                    </Label>
                                    <Input type="file" accept="image/*" onChange={handleFileChange} className="text-xs" />
                                    {formData.chequeLeaf && <p className="text-[10px] text-emerald-600">File attached ✓</p>}
                                </div>
                                <div className="flex items-center justify-between border p-3 rounded-lg bg-zinc-50 mt-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Set as Primary</Label>
                                        <p className="text-[10px] text-muted-foreground">This account will be used in all document templates.</p>
                                    </div>
                                    <Switch 
                                        checked={formData.isPrimary} 
                                        onCheckedChange={(val) => setFormData({ ...formData, isPrimary: val })} 
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => { setIsAdding(false); setFormData({ bankName: "", accountType: "Current", accountNumber: "", ifscCode: "", branchName: "", address: "", isPrimary: false }); }}>Cancel</Button>
                                <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 min-w-[100px]">
                                    {loading ? "Saving..." : formData.id ? "Update Account" : "Add Account"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {accounts.map(acc => (
                                <div key={acc.id} className={`p-4 rounded-xl border-2 transition-all relative group ${acc.isPrimary ? 'border-emerald-500 bg-emerald-50/30' : 'border-zinc-100 hover:border-zinc-200 bg-white'}`}>
                                    {acc.isPrimary && (
                                        <div className="absolute -top-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-lg">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-zinc-400 uppercase tracking-tighter">{acc.accountType}</p>
                                            <h3 className="font-bold text-lg leading-tight">{acc.bankName}</h3>
                                            <p className="text-sm font-medium font-mono text-zinc-600">XXXX-XXXX-{acc.accountNumber.slice(-4)}</p>
                                        </div>
                                        <Landmark className={`h-8 w-8 ${acc.isPrimary ? 'text-emerald-200' : 'text-zinc-100'}`} />
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
                                        <div className="text-[10px]">
                                            <p className="text-zinc-400 font-bold uppercase">IFSC</p>
                                            <p className="font-medium">{acc.ifscCode}</p>
                                        </div>
                                        <div className="text-[10px]">
                                            <p className="text-zinc-400 font-bold uppercase">Branch</p>
                                            <p className="font-medium truncate">{acc.branchName || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => { setFormData(acc); setRetypeAccount(acc.accountNumber); setIsAdding(true); }}>Edit</Button>
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-red-500" onClick={() => handleDelete(acc.id!)}>Delete</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
