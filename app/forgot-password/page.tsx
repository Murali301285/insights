"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            
            if (res.ok) {
                setSuccess(true);
                toast.success("Reset link sent successfully");
            } else {
                toast.error(data.error || "Failed to send reset link");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-600">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-zinc-200/40 sm:rounded-2xl sm:px-10 border border-zinc-100">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                                <Mail className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-900">Check your email</h3>
                            <p className="text-sm text-zinc-500">
                                We've sent a password reset link to <strong>{email}</strong>. The link will expire in 10 minutes.
                            </p>
                            <div className="mt-6">
                                <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-1">
                                    <ArrowLeft className="w-4 h-4" /> Back to login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <Label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                                    Email address
                                </Label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="pl-10 h-11"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                                    disabled={loading}
                                >
                                    {loading ? "Sending link..." : "Send reset link"}
                                </Button>
                            </div>
                            
                            <div className="text-center">
                                <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                                    Back to login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
