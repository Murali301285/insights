"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Invalid or missing reset token");
            router.push("/login");
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !confirmPassword) return;
        
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            
            if (res.ok) {
                setSuccess(true);
                toast.success("Password reset successfully");
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                toast.error(data.error || "Failed to reset password");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
                    Set new password
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-600">
                    Your new password must be different from previously used passwords.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-zinc-200/40 sm:rounded-2xl sm:px-10 border border-zinc-100">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-zinc-900">Password reset</h3>
                            <p className="text-sm text-zinc-500">
                                Your password has been successfully reset. You will be redirected to the login page shortly.
                            </p>
                            <div className="mt-6">
                                <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-1">
                                    Click here if you are not redirected <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <Label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                                    New password
                                </Label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="pl-10 pr-10 h-11"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">
                                    Confirm new password
                                </Label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="pl-10 h-11"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    {loading ? "Resetting..." : "Reset password"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
