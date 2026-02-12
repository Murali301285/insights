"use client"

import { useState, useEffect } from "react"
import {
    X,
    Sparkles,
    FileText,
    CheckCircle2,
    Loader2,
    Download,
    Share2,
    BrainCircuit
} from "lucide-react"

interface AIReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIReportModal({ isOpen, onClose }: AIReportModalProps) {
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'synthesizing' | 'ready'>('idle')
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (isOpen && status === 'idle') {
            startGeneration()
        }
    }, [isOpen])

    const startGeneration = async () => {
        setStatus('analyzing')
        setProgress(0)

        // Mock Assessment Phase
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 15;
            })
        }, 500)

        // Simulate steps
        setTimeout(() => setStatus('synthesizing'), 2000)
        setTimeout(() => {
            clearInterval(interval)
            setProgress(100)
            setStatus('ready')
        }, 4500)
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-100">
                {/* Header */}
                <div className="bg-zinc-50 border-b border-zinc-100 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">AI Executive Briefing</h2>
                            <p className="text-xs text-zinc-500">Powered by Groq LPU™ Inference Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {status !== 'ready' ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-zinc-900">
                                    {status === 'analyzing' ? 'Analyzing Cross-Department Data...' : 'Synthesizing Key Insights...'}
                                </h3>
                                <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                                    {status === 'analyzing'
                                        ? "Scanning Financials, Sales Pipelines, and Production Logs for anomalies."
                                        : "Drafting executive summary and strategic recommendations."}
                                </p>
                            </div>
                            <div className="w-full max-w-md h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-4">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-emerald-900">Report Ready</h4>
                                    <p className="text-sm text-emerald-700">Analysis complete. Insights generated from 14,203 data points.</p>
                                </div>
                            </div>

                            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 text-sm leading-relaxed text-zinc-600 space-y-4 max-h-[300px] overflow-y-auto font-mono">
                                <p><strong className="text-zinc-900">EXECUTIVE SUMMARY</strong></p>
                                <p>Overall organizational health is strong (Score: 88/100). Revenue is tracking 12% above projection due to increased Sales Cycle Velocity. However, Manufacturing efficiency (OEE) has dipped slightly to 82%, correlating with a rise in Scrap Rate.</p>
                                <p><strong className="text-zinc-900">KEY FINDINGS:</strong></p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Finance:</strong> Cash Burn has stabilized; EBITDA Margin is healthy at 22%.</li>
                                    <li><strong>Sales:</strong> CAC decreased by 5% this month, improving LTV:CAC ratio.</li>
                                    <li><strong>Supply Chain:</strong> Supplier Risk Score elevated for 'TechComponents Ltd' (Geo-political factor).</li>
                                </ul>
                                <p><strong className="text-zinc-900">RECOMMENDATION:</strong> Investigate Manufacturing "Line 2" maintenance logs to address OEE dip. Diversify component sourcing to mitigate Supply Chain risk.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 bg-zinc-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </button>
                                <button className="flex-1 bg-white border border-zinc-200 text-zinc-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all">
                                    <Share2 className="w-4 h-4" />
                                    Share with Board
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
