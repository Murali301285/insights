"use client"

import { useState, useEffect, useMemo } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { useFilter } from "@/components/providers/FilterProvider"
import { Folder, Lock, ArrowLeft, MoreVertical, FileText, BrainCircuit, Eye, Trash2, Bot, Loader2 } from "lucide-react"
import { VaultUploader } from "@/components/vault/VaultUploader"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const CATEGORIES = [
    "Budgetary estimates",
    "Quotations",
    "Sales Orders",
    "Pro-forma Invoice",
    "Invoice",
    "Purchase Orders",
    "Purchase bills",
    "Credit Notes",
    "Debit Notes",
    "GRN",
    "DC"
];

export default function VaultPage() {
    const { setHeaderInfo } = useHeader()
    const { selectedCompanyIds } = useFilter()

    const [hasAccess, setHasAccess] = useState<boolean | null>(null)
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [mockAiOpen, setMockAiOpen] = useState(false) // Trigger mock generative UI
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

    const [viewDoc, setViewDoc] = useState<any>(null)
    
    const viewPdfUrl = useMemo(() => {
        if (!viewDoc?.fileData) return null;
        try {
            const arr = viewDoc.fileData.split(',');
            if (arr.length < 2) return viewDoc.fileData;
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
            const bstr = window.atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            const blob = new Blob([u8arr], { type: mime });
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error(e);
            return viewDoc.fileData;
        }
    }, [viewDoc]);

    useEffect(() => {
        return () => {
            if (viewPdfUrl && viewPdfUrl.startsWith('blob:')) {
                URL.revokeObjectURL(viewPdfUrl);
            }
        }
    }, [viewPdfUrl]);

    const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<any>(null)
    const [selectedAiDoc, setSelectedAiDoc] = useState<any>(null)
    const [aiInput, setAiInput] = useState("")
    const [aiResponse, setAiResponse] = useState("")
    const [aiLoading, setAiLoading] = useState(false)

    useEffect(() => {
        setHeaderInfo("Secure Vault", "Central repository for categorized organizational documents")
    }, [setHeaderInfo])

    // Checking authentication and vault bounds
    useEffect(() => {
        fetch('/api/auth/session').then(res => res.json()).then(data => {
            const user = data?.user;
            if (user && (user.role === 'admin' || user.hasVaultAccess)) {
                setHasAccess(true)
            } else {
                setHasAccess(false)
            }
        })
    }, [])

    const companyId = selectedCompanyIds[0] || 'all';

    const fetchCounts = async () => {
        if (companyId === 'all') {
            setCategoryCounts({});
            return;
        }
        try {
            const res = await fetch(`/api/vault?companyId=${companyId}&counts=true`)
            if (res.ok) {
                const data = await res.json()
                const countsMap: Record<string, number> = {}
                if (Array.isArray(data)) {
                    data.forEach((item: any) => {
                        countsMap[item.category] = item._count.id
                    })
                }
                setCategoryCounts(countsMap)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (hasAccess) {
            fetchCounts()
        }
    }, [hasAccess, companyId])

    const fetchDocuments = async (cat: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/vault?companyId=${companyId}&category=${encodeURIComponent(cat)}`)
            if (res.ok) {
                const data = await res.json()
                setDocuments(Array.isArray(data) ? data : [])
            }
        } catch(error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const openCategory = (cat: string) => {
        if (companyId === 'all') {
            alert("Please select a specific company from the filter before accessing vault folders.");
            return;
        }
        setActiveCategory(cat)
        fetchDocuments(cat)
    }

    const handleDelete = async () => {
        if (!deleteConfirmDoc) return;
        try {
            const res = await fetch(`/api/vault?id=${deleteConfirmDoc.id}`, { method: 'DELETE' });
            if (res.ok) {
                setDeleteConfirmDoc(null);
                fetchDocuments(activeCategory as string);
                fetchCounts();
            }
        } catch (e) {
            console.error(e);
        }
    }

    const handleChatAI = async () => {
        if (!selectedAiDoc || !aiInput.trim() || aiLoading) return;
        setAiLoading(true);
        setAiResponse("");
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: aiInput }],
                    docId: selectedAiDoc.id
                })
            });
            
            if (!res.ok) {
                const text = await res.text();
                setAiResponse(`Failed to process document. Server responded with: ${res.status} ${res.statusText}. Payload: ${text.substring(0, 100)}`);
                setAiLoading(false);
                return;
            }

            const data = await res.json();
            if (data.content) setAiResponse(data.content);
            else setAiResponse(data.error || "Failed to process document.");
        } catch(e: any) {
            setAiResponse(`Connection error: ${e.message}`);
        } finally {
            setAiLoading(false);
            setAiInput("");
        }
    }

    if (hasAccess === null) return <div className="p-12 text-center animate-pulse text-zinc-400">Verifying security bounds...</div>
    if (hasAccess === false) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h2>
            <p className="text-zinc-500 max-w-md">Your account does not have authorization to access the Secure Vault compartment. Please contact an administrator if you require access.</p>
        </div>
    )

    if (activeCategory) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => setActiveCategory(null)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-semibold">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Vault Root
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMockAiOpen(!mockAiOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${mockAiOpen ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
                            <BrainCircuit className="w-4 h-4" />
                            {mockAiOpen ? "Close AI Workspace" : "Ask AI / Generate"}
                        </button>
                    </div>
                </div>

                {mockAiOpen && (
                    <div className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl animate-in slide-in-from-top-4 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <BrainCircuit className="w-6 h-6" />
                                Generative Document AI
                            </h3>
                            {selectedAiDoc ? (
                                <p className="text-violet-100 text-sm mb-4">Chatting with: <strong className="text-white">{selectedAiDoc.fileName}</strong></p>
                            ) : (
                                <p className="text-violet-100 text-sm max-w-2xl mb-6">Select a file's Chat icon below to ask questions about its content.</p>
                            )}
                            
                            <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md">
                                <input 
                                    type="text" 
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleChatAI();
                                        }
                                    }}
                                    placeholder={selectedAiDoc ? "Ask a question about this document... e.g. 'Summarize this in 2 lines'" : "Please select a document first..."}
                                    disabled={!selectedAiDoc || aiLoading}
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-violet-200 px-4 text-sm"
                                />
                                <button onClick={handleChatAI} disabled={!selectedAiDoc || aiLoading || !aiInput.trim()} className="bg-white text-violet-600 px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-zinc-50 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Execute"}
                                </button>
                            </div>
                            {aiResponse && (
                                <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/20 text-sm animate-in fade-in">
                                    <p className="whitespace-pre-wrap">{aiResponse}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                    <Folder className="w-8 h-8 text-sky-500 fill-sky-100" />
                    <h2 className="text-2xl font-bold text-zinc-900">{activeCategory} {documents.length > 0 && <span className="text-zinc-500 font-medium ml-2">({documents.length} files)</span>}</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 font-bold text-sm text-zinc-800">
                            Stored Documents
                        </div>
                        {loading ? (
                            <div className="p-12 text-center text-zinc-400 animate-pulse">Loading documents...</div>
                        ) : documents.length === 0 ? (
                            <div className="p-16 text-center text-zinc-400">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-zinc-200" />
                                <p>No documents found in this category.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-zinc-100">
                                {documents.map(doc => (
                                    <li key={doc.id} className="flex justify-between items-center p-4 hover:bg-zinc-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-zinc-900 cursor-pointer hover:underline" onClick={() => window.open(doc.fileData, '_blank')}>{doc.fileName}</p>
                                                <p className="text-xs text-zinc-500">Uploaded by {doc.uploadedBy?.profileName || 'System'} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                                            <button onClick={() => setViewDoc(doc)} title="View" className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { setSelectedAiDoc(doc); setMockAiOpen(true); }} title="Chat with AI" className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                                                <Bot className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteConfirmDoc(doc)} title="Delete" className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <VaultUploader companyId={companyId} category={activeCategory} onUploaded={() => { fetchDocuments(activeCategory); fetchCounts(); }} />
                    </div>
                </div>

            <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-6">
                    <DialogHeader>
                        <DialogTitle>{viewDoc?.fileName}</DialogTitle>
                        <DialogDescription>Secure Vault Document Viewer</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 bg-zinc-100 rounded-2xl overflow-hidden mt-4">
                        {viewDoc && viewPdfUrl && (
                            <iframe src={viewPdfUrl} className="w-full h-full border-0">
                                <div className="p-12 text-center text-zinc-500">
                                    <p>Your browser does not support embedded PDFs.</p>
                                    <a href={viewDoc.fileData} download={viewDoc.fileName} className="text-sky-600 hover:underline mt-2 inline-block">Download instead</a>
                                </div>
                            </iframe>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteConfirmDoc} onOpenChange={(open) => !open && setDeleteConfirmDoc(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteConfirmDoc?.fileName}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <button onClick={() => setDeleteConfirmDoc(null)} className="px-4 py-2 border border-zinc-200 rounded-xl text-zinc-700 hover:bg-zinc-50 font-bold transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-md shadow-rose-200">
                            Yes, Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-emerald-50 text-emerald-900 p-6 rounded-3xl border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold">Encrypted Vault Storage</h3>
                    <p className="text-sm opacity-80 mt-1 max-w-xl">Store and manage strict PDF documents linked directly to organizational hierarchies. Ensure the global company filter matches your target bucket.</p>
                </div>
                <div className="text-emerald-700 bg-white px-4 py-2 rounded-xl shadow-sm text-sm font-bold border border-emerald-100 shrink-0">
                    Target: {companyId === 'all' ? 'Unselected (Global)' : 'Active Company Bucket'}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {CATEGORIES.map(cat => {
                    const count = categoryCounts[cat] || 0;
                    return (
                        <div 
                            key={cat} 
                            onClick={() => openCategory(cat)}
                            className={`bg-white p-6 rounded-3xl border ${companyId === 'all' ? 'border-zinc-200 opacity-60 cursor-not-allowed' : 'border-zinc-200 shadow-sm hover:shadow-md cursor-pointer hover:border-sky-200 transition-all group'} flex flex-col items-center justify-center text-center relative`}
                        >
                            {count > 0 && (
                                <div className="absolute top-4 right-4 bg-sky-50 text-sky-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-sky-100 shadow-sm animate-in zoom-in-95 duration-200">
                                    {count} {count === 1 ? 'file' : 'files'}
                                </div>
                            )}
                            <Folder className={`w-12 h-12 mb-4 transition-transform ${companyId === 'all' ? 'text-zinc-300' : 'text-sky-400 group-hover:scale-110 group-hover:fill-sky-100'}`} />
                            <h4 className="font-bold text-zinc-800 text-sm">{cat}</h4>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
