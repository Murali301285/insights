"use client"

import { useState, useEffect, useRef } from "react"
import { Send, FileUp, Search, User as UserIcon, CheckCircle2, File as FileIcon, Paperclip, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ChatClient({ currentUser }: { currentUser: any }) {
    const [users, setUsers] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [inputText, setInputText] = useState("")
    const [loading, setLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pollingIntervalRef = useRef<any>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Load users on mount and periodically
    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/chat/users')
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    setUsers(data)
                    setErrorMsg(null)
                } else {
                    setErrorMsg("Invalid data: " + JSON.stringify(data))
                }
            } else {
                const err = await res.json().catch(()=>({}));
                setErrorMsg(`Status ${res.status}: ${err.error || "Unknown"}`)
            }
        } catch (error: any) {
            setErrorMsg("Fetch error: " + error.message)
        }
    }

    // Load active conversation messages
    const fetchMessages = async (contactId: string) => {
        try {
            const res = await fetch(`/api/chat/messages?userId=${contactId}`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (error) {}
    }

    // Auto-Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Global Polling (every 3 seconds)
    useEffect(() => {
        fetchUsers()
        
        pollingIntervalRef.current = setInterval(() => {
            fetchUsers()
            if (selectedUser) {
                fetchMessages(selectedUser.id)
            }
        }, 3000)

        return () => clearInterval(pollingIntervalRef.current)
    }, [selectedUser])

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!inputText.trim() && !loading) return

        if (!selectedUser) return;

        const payload = {
            receiverId: selectedUser.id,
            content: inputText.trim()
        }

        setInputText("")
        setLoading(true)

        try {
            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                fetchMessages(selectedUser.id)
                fetchUsers()
            } else {
                const err = await res.json()
                alert(err.error || "Failed to send message")
            }
        } catch (error) {
            alert("Network Error")
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedUser) return

        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large! Maximum limit is 5MB.")
            return
        }

        setIsUploading(true)

        const reader = new FileReader()
        reader.onload = async (event) => {
            const base64Data = event.target?.result
            if (typeof base64Data !== 'string') return

            const payload = {
                receiverId: selectedUser.id,
                content: "",
                attachment: {
                    name: file.name,
                    type: file.type,
                    data: base64Data
                }
            }

            try {
                const res = await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (res.ok) {
                    fetchMessages(selectedUser.id)
                    fetchUsers()
                } else {
                    const err = await res.json()
                    alert(err.error || "Upload failed")
                }
            } catch (error) {
                alert("Upload Network Error")
            } finally {
                setIsUploading(false)
                if (fileInputRef.current) fileInputRef.current.value = ""
            }
        }
        reader.readAsDataURL(file)
    }

    const filteredUsers = users.filter((u: any) => {
        const pName = u.profileName || u.email || "";
        return pName.toLowerCase().includes(search.toLowerCase());
    })

    const formatTime = (isoString?: string) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex h-full border-zinc-200">
            {/* Left Sidebar: Contacts */}
            <div className="w-[340px] border-r border-zinc-200 flex flex-col bg-zinc-50 shrink-0">
                <div className="p-4 border-b border-zinc-200 bg-white">
                    <h2 className="text-xl font-bold text-zinc-800 tracking-tight">Messages</h2>
                    <div className="mt-4 relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <Input 
                            placeholder="Search contacts..." 
                            className="pl-9 h-9 bg-zinc-100 border-transparent focus-visible:bg-white focus-visible:ring-emerald-500 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto hover-scroll">
                    {errorMsg && (
                        <div className="p-4 m-4 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 break-words">
                            {errorMsg}
                        </div>
                    )}
                    {filteredUsers.length === 0 && !errorMsg ? (
                        <div className="p-6 text-center text-zinc-400 text-sm">No contacts found</div>
                    ) : (
                        filteredUsers.map((user: any) => (
                            <div 
                                key={user.id} 
                                onClick={() => {
                                    setSelectedUser(user)
                                    fetchMessages(user.id)
                                }}
                                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 last:border-none ${selectedUser?.id === user.id ? 'bg-emerald-50' : 'hover:bg-zinc-100 bg-white'}`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold overflow-hidden border border-emerald-200 shrink-0">
                                        {user.image ? <img src={user.image} alt="User" /> : (user.profileName?.[0] || user.email[0]).toUpperCase()}
                                    </div>
                                    {user.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white">
                                            {user.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-semibold text-zinc-900 truncate pr-2">{user.profileName || user.email.split('@')[0]}</h3>
                                        <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">{formatTime(user.latestMessageDate)}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate">{user.latestMessage || "Click to start chatting"}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Pane: Chat Window */}
            <div className="flex-1 flex flex-col bg-[#e5ddd5]/10 relative min-w-0">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-zinc-200 z-10">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                                {(selectedUser.profileName?.[0] || selectedUser.email[0]).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="font-bold text-zinc-900 leading-tight">{selectedUser.profileName || selectedUser.email}</h2>
                                <p className="text-xs text-emerald-600 font-medium">{selectedUser.role?.name || "User"}</p>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 hover-scroll">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-zinc-400 bg-white px-4 py-2 rounded-full text-sm shadow-sm border border-zinc-100">Say hello! End-to-end secured chat.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMine = msg.senderId === currentUser.id;
                                    
                                    return (
                                        <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative group ${isMine ? 'bg-emerald-100 text-emerald-900 rounded-br-sm' : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm'}`}>
                                                
                                                {/* Attachments rendering */}
                                                {msg.attachment && (
                                                    <div className="mb-2">
                                                        {msg.attachment.type?.startsWith('image/') ? (
                                                            <img src={msg.attachment.data} alt="Attached image" className="max-w-full rounded-xl object-contain max-h-[300px]" />
                                                        ) : (
                                                            <a href={msg.attachment.data} download={msg.attachment.name} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMine ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-200/50' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}`}>
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMine ? 'bg-emerald-200 text-emerald-700' : 'bg-zinc-200 text-zinc-700'}`}>
                                                                    <FileIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold truncate leading-tight mb-0.5">{msg.attachment.name}</p>
                                                                    <p className="text-[10px] uppercase opacity-70 font-medium">{msg.attachment.type.split('/')[1] || "File"}</p>
                                                                </div>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {msg.content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                                
                                                <div className="flex justify-end items-center gap-1.5 mt-1">
                                                    <span className={`text-[10px] ${isMine ? 'text-emerald-700/70' : 'text-zinc-400 font-medium'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                    {isMine && (
                                                        <CheckCircle2 className={`w-3.5 h-3.5 ${msg.readStatus ? 'text-blue-500' : 'text-emerald-500/50'}`} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-zinc-50 border-t border-zinc-200 shrink-0">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-5xl mx-auto w-full">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload}
                                    accept="image/*,application/pdf"
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="shrink-0 h-12 w-12 rounded-full text-zinc-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading || isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : <Paperclip className="w-5 h-5" />}
                                </Button>
                                <Input 
                                    placeholder="Type a message..."
                                    className="flex-1 h-12 rounded-full px-6 border-zinc-300 shadow-sm text-[15px] focus-visible:ring-emerald-500 bg-white"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={loading || isUploading}
                                />
                                <Button 
                                    type="submit" 
                                    size="icon"
                                    className="shrink-0 h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-md transition-transform active:scale-95 disabled:opacity-50"
                                    disabled={(!inputText.trim() && !isUploading) || loading}
                                >
                                    <Send className="w-5 h-5 ml-1" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 text-center px-6">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-white">
                            <MessageSquare className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Enterprise Web Chat</h2>
                        <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">Select a contact from the sidebar to start a secure end-to-end encrypted messaging session. Connect with your team instantly.</p>
                        <hr className="w-16 border-zinc-300" />
                    </div>
                )}
            </div>
        </div>
    )
}
