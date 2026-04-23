"use client"

import { useState, useRef } from "react"
import { UploadCloud, FileText, X } from "lucide-react"

interface VaultUploaderProps {
    companyId: string
    category: string
    onUploaded: () => void
}

export function VaultUploader({ companyId, category, onUploaded }: VaultUploaderProps) {
    const [dragging, setDragging] = useState(false)
    const [pendingFile, setPendingFile] = useState<{name: string, data: string} | null>(null)
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)
    
    const fileRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") setDragging(true)
        else if (e.type === "dragleave") setDragging(false)
    }

    const processFile = (file: File) => {
        if (file.type !== "application/pdf") {
            alert("Only PDF files are allowed in the Vault.")
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === 'string') {
                setPendingFile({ name: file.name, data: e.target.result })
            }
        }
        reader.readAsDataURL(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
        }
    }

    const uploadDocument = async () => {
        if (!pendingFile || loading) return
        
        setLoading(true)
        try {
            const res = await fetch("/api/vault", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId,
                    category,
                    fileName: pendingFile.name,
                    fileData: pendingFile.data,
                    description
                })
            })

            if (res.ok) {
                setPendingFile(null)
                setDescription("")
                onUploaded()
            } else {
                const err = await res.json()
                alert(err.error || "Failed to upload document")
            }
        } catch(error) {
            console.error(error)
            alert("Network error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <h3 className="font-bold text-zinc-900 mb-4">Upload Document</h3>
            
            {pendingFile ? (
                <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-emerald-900 truncate">{pendingFile.name}</p>
                                <p className="text-xs text-emerald-600 font-semibold tracking-wide">READY TO UPLOAD</p>
                            </div>
                        </div>
                        <button onClick={() => setPendingFile(null)} className="text-emerald-500 hover:text-emerald-700 bg-white p-1 rounded-full shrink-0">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Document Description (Optional)</label>
                        <textarea 
                            rows={3} 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add tags, notes, or contextual metadata..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        ></textarea>
                    </div>

                    <button 
                        onClick={uploadDocument} 
                        disabled={loading}
                        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? "Encrypting & Storing..." : "Upload to Vault"}
                    </button>
                </div>
            ) : (
                <div 
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${dragging ? 'border-sky-400 bg-sky-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                >
                    <input type="file" accept=".pdf" className="hidden" ref={fileRef} onChange={handleInput} />
                    <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                        <UploadCloud className="w-8 h-8 text-sky-500" />
                    </div>
                    <h4 className="font-bold text-zinc-900 mb-1">Drag & Drop PDF</h4>
                    <p className="text-xs text-zinc-500">or click to browse your files</p>
                    <div className="mt-4 inline-block px-3 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        .PDF ONLY
                    </div>
                </div>
            )}
        </div>
    )
}
