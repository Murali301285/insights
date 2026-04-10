"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Undo2, Loader2, Bot, User, CheckCircle2, AlertCircle, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { useHeader } from "@/components/providers/HeaderProvider"

export default function ChatPage() {
    const { setHeaderInfo } = useHeader()
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: 'Hello! I am your AI system assistant. How can I assist you with your data today? Try typing "/finance" or uploading an excel payload!' }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [showCommands, setShowCommands] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const endOfMessagesRef = useRef<HTMLDivElement>(null)

    const AVAILABLE_COMMANDS = ['/finance', '/sales', '/manufacturing', '/supply-chain', '/support', '/hr', '/hierarchy']

    useEffect(() => {
        setHeaderInfo("Chat Intelligence", "Direct AI access to read, validate, and manage your dashboard systems.")
    }, [setHeaderInfo])

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSend = async (customMessage?: string, excelData?: any) => {
        const textToSend = customMessage || input;
        if (!textToSend.trim() && !excelData) return;

        const newMessages = [...messages, { role: 'user', content: textToSend }];
        if (!customMessage) setMessages(newMessages); // Don't show technical prompts directly
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages,
                    excelPayload: excelData,
                    categoryContext: textToSend.match(/\/([a-z]+)/i)?.[1] || null
                })
            });

            const data = await res.json();
            
            if (data.error) {
                toast.error(data.error);
                return;
            }

            setMessages(prev => [...prev, {
                role: data.role,
                content: data.content,
                validation: data.validationPayload
            }]);

        } catch (e) {
            toast.error("Failed to connect to AI server.");
        } finally {
            setLoading(false);
        }
    }

    const handleAudio = () => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Audio recording is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + " " + transcript);
        };
        recognition.onerror = () => {
            toast.error("Microphone error occurred.");
            setIsRecording(false);
        };

        recognition.start();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                toast.success(`Attached ${file.name}`);
                setMessages(prev => [...prev, { role: 'user', content: `[User attached file: ${file.name}]` }]);
                handleSend(`Please validate the attached Excel data for import.`, data);
            } catch (err) {
                toast.error("Failed to parse Excel file.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleRevoke = async () => {
        if (!confirm("Are you sure you want to attempt revoking the last transaction uploaded today?")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "REVOKE" })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setMessages(prev => [...prev, { role: 'assistant', content: `Success: ${data.message}` }]);
            } else {
                toast.error(data.message || "Failed to revoke");
                setMessages(prev => [...prev, { role: 'assistant', content: `Revoke Failed: ${data.message}` }]);
            }
        } catch (e) {
            toast.error("Execution failed.");
        } finally {
            setLoading(false);
        }
    }

    const confirmInsertion = async (payload: any) => {
        setLoading(true);
        try {
            // Usually this maps payload.category to /api/metrics endpoint
            const res = await fetch("/api/metrics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: payload.category || 'finance',
                    date: new Date().toISOString().split('T')[0],
                    data: payload.mappedData
                })
            });
            if (res.ok) {
                toast.success("Data securely verified and inserted into the system!");
                setMessages(prev => [...prev, { role: 'assistant', content: "I have successfully imported your validated data into the database! It will now display properly across the dashboards." }]);
            } else {
                toast.error("Insert rejected by system.");
            }
        } catch (e) {
            toast.error("Database error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200 shadow-sm">
                        <Bot className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-zinc-900">System Assistant</h2>
                        <p className="text-xs text-zinc-500">Powered by Groq • Strict Permissions Active</p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                    onClick={handleRevoke}
                    disabled={loading}
                >
                    <Undo2 className="w-4 h-4 mr-2" />
                    Revoke Last Upload
                </Button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-zinc-800' : 'bg-violet-600'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                        </div>
                        <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm filter ${msg.role === 'user' ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tr-sm' : 'bg-slate-800 text-slate-50 rounded-tl-sm'}`}>
                                {msg.content.includes("```") ? (
                                    <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">{msg.content.replace(/```json/g, '').replace(/```/g, '')}</pre>
                                ) : (
                                    <span>{msg.content}</span>
                                )}
                            </div>

                            {/* Validation UI Rendering */}
                            {msg.validation && msg.validation.validationStatus === "READY" && (
                                <div className="mt-2 w-[400px] border border-emerald-200 bg-emerald-50 rounded-xl p-4 shadow-sm animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <h4 className="font-bold text-emerald-900">Data Ready for DB Insertion</h4>
                                    </div>
                                    <div className="bg-white rounded border border-emerald-100 p-3 mb-4 text-xs font-mono overflow-auto max-h-32 text-zinc-700 shadow-inner">
                                        {Object.entries(msg.validation.mappedData).map(([k, v]) => (
                                            <div key={k} className="flex justify-between border-b border-zinc-50 py-1 last:border-0">
                                                <span className="font-semibold text-emerald-800">{k}:</span>
                                                <span>{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button 
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm font-bold"
                                        onClick={() => confirmInsertion(msg.validation)}
                                        disabled={loading}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve & Save to Dashboard
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Bot className="w-4 h-4 text-white animate-pulse" />
                        </div>
                        <div className="px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm bg-slate-800 text-slate-50 rounded-tl-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
                            <span className="text-violet-200">Processing...</span>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-zinc-200 bg-white shadow-[0_-4px_15px_rgba(0,0,0,0.02)] relative z-10">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2"
                >
                    <input 
                        type="file" 
                        accept=".xlsx,.xls,.csv" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0 rounded-full w-10 h-10 border-zinc-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        title="Upload Excel File"
                    >
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    {/* Slash Commands Overlay */}
                    {showCommands && (
                        <div className="absolute bottom-[72px] left-16 bg-white border border-zinc-200 rounded-xl shadow-lg w-64 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="bg-zinc-50 px-3 py-2 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Commands</div>
                            {AVAILABLE_COMMANDS.filter(cmd => cmd.startsWith(input)).map((cmd) => (
                                <button
                                    key={cmd}
                                    type="button"
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-violet-50 hover:text-violet-700 transition-colors border-b border-zinc-50 last:border-0"
                                    onClick={() => {
                                        setInput(cmd + ' ')
                                        setShowCommands(false)
                                    }}
                                >
                                    <span className="font-bold text-violet-600">{cmd.substring(0, 1)}</span>{cmd.substring(1)}
                                </button>
                            ))}
                        </div>
                    )}

                    <Input 
                        placeholder="Type a query (e.g. /finance) or attach an excel file to map..."
                        value={input}
                        onChange={e => {
                            setInput(e.target.value)
                            if (e.target.value.startsWith('/')) setShowCommands(true)
                            else setShowCommands(false)
                        }}
                        disabled={loading}
                        className="flex-1 rounded-full border-zinc-200 bg-zinc-50 focus-visible:ring-violet-500 h-11 px-6 shadow-inner text-[15px]"
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className={`shrink-0 rounded-full w-10 h-10 transition-colors border-0 ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-zinc-400 hover:bg-violet-50 hover:text-violet-600'}`}
                        onClick={handleAudio}
                        disabled={loading}
                        title="Voice Input"
                    >
                        <Mic className="w-4 h-4" />
                    </Button>
                    <Button 
                        type="submit" 
                        size="icon"
                        disabled={!input.trim() || loading}
                        className="shrink-0 rounded-full w-11 h-11 bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-200 transition-transform active:scale-95"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
