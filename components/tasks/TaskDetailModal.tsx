"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
    Paperclip, MessageSquare, Clock, 
    CheckCircle2, AlertCircle, FileText, X
} from "lucide-react"

interface TaskDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task: any
    currentUser: any
    onTaskUpdated: () => void
}

export function TaskDetailModal({ open, onOpenChange, task, currentUser, onTaskUpdated }: TaskDetailModalProps) {
    const [status, setStatus] = useState("")
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState("")
    const [attachments, setAttachments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open && task) {
            setStatus(task.status)
            fetchComments()
        }
    }, [open, task])

    const fetchComments = async () => {
        if (!task) return
        try {
            const res = await fetch(`/api/tasks/${task.id}/comments`)
            const data = await res.json()
            setComments(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Failed to fetch comments", error)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        Array.from(files).forEach((file) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                setAttachments(prev => [...prev, { name: file.name, type: file.type, data: event.target?.result }])
            }
            reader.readAsDataURL(file)
        })
    }

    const updateStatus = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                setStatus(newStatus)
                onTaskUpdated()
            }
        } catch(error) {
            console.error(error)
        }
    }

    const postComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() && attachments.length === 0) return

        setLoading(true)
        try {
            const res = await fetch(`/api/tasks/${task.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: newComment, attachments: attachments.length > 0 ? attachments : null })
            })
            if (res.ok) {
                setNewComment("")
                setAttachments([])
                fetchComments() // reload thread
            } else {
                const err = await res.json().catch(() => ({ error: 'Network Error' }));
                alert(err.error || "Failed to post comment");
            }
        } catch(error) {
            console.error(error)
            alert("Unexpected error occurred while posting");
        } finally {
            setLoading(false)
        }
    }

    if (!task) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-50 border-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>Task Details & Comments</DialogTitle>
                </DialogHeader>
                <div className="bg-white p-6 border-b border-zinc-200 shadow-sm shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-1">{task.description}</h2>
                            <p className="text-sm font-semibold text-zinc-500">
                                Project: <span className="text-emerald-700">{task.project?.opportunityName || task.otherProject || "None"}</span>
                                <span className="mx-2">•</span>
                                Function: <span className="uppercase tracking-wider">{task.function}</span>
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            task.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                            {task.priority} Priority
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Due: {new Date(task.dueDate).toLocaleDateString('en-GB')}
                        </div>
                        <div className="w-px h-4 bg-zinc-300"></div>
                        <div>Assigned By: <span className="text-zinc-900">{task.assignedBy?.profileName || task.assignedBy?.email}</span></div>
                        <div className="w-px h-4 bg-zinc-300"></div>
                        <div>Assigned To: <span className="text-zinc-900">{task.assignedTo?.profileName || task.assignedTo?.email}</span></div>
                        
                        {/* Status Toggle Row */}
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-zinc-400">Current Status:</span>
                            <select 
                                className={`text-xs px-3 py-1.5 rounded-full font-bold border-0 outline-none ${
                                    status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                                    status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                                    status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 
                                    'bg-zinc-200 text-zinc-800'
                                }`}
                                value={status}
                                onChange={(e) => updateStatus(e.target.value)}
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Overdue" disabled>Overdue</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Thread */}
                    {comments.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400 text-sm">No comments or updates yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((c: any) => (
                                <div key={c.id} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <span className="text-emerald-700 font-bold text-sm">{(c.createdBy?.profileName || c.createdBy?.email)[0].toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-zinc-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-zinc-900 text-sm">{c.createdBy?.profileName || c.createdBy?.email}</span>
                                            <span className="text-xs font-semibold text-zinc-400">{new Date(c.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-zinc-700 whitespace-pre-wrap">{c.comment}</p>
                                        
                                        {/* Attachments */}
                                        {c.attachments && c.attachments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {c.attachments.map((att: any, idx: number) => (
                                                    <a key={idx} href={att.data} download={att.name} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer">
                                                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                                        <span className="text-xs font-medium text-zinc-700 truncate max-w-[150px]">{att.name}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 border-t border-zinc-200 shrink-0">
                    {attachments.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                            {attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-violet-50 text-violet-800 border border-violet-100 rounded-md text-xs font-semibold shrink-0">
                                    <FileText className="w-3 h-3" />
                                    <span className="truncate max-w-[100px]">{att.name}</span>
                                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-rose-600"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <form onSubmit={postComment} className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea 
                                rows={2}
                                placeholder="Add a comment or update..."
                                className="w-full pl-4 pr-12 py-3 border rounded-2xl bg-zinc-50 border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none custom-scrollbar"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute right-3 bottom-3 p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-lg transition-colors">
                                <Paperclip className="w-5 h-5" />
                                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            </button>
                        </div>
                        <Button type="submit" disabled={loading} className="shrink-0 rounded-2xl h-11 px-6 bg-emerald-600 hover:bg-emerald-700">
                            {loading ? "Posting..." : "Post Comments"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
