"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) return;
        
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("New password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success("Password changed successfully");
                setTimeout(() => {
                    router.push("/");
                }, 1500);
            } else {
                toast.error(data.error || "Failed to change password");
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
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
                    Change Your Password
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-600">
                    For security reasons, you must change your temporary password before continuing.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-zinc-200/40 sm:rounded-2xl sm:px-10 border border-zinc-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <Label htmlFor="currentPassword" className="block text-sm font-medium text-zinc-700">
                                Current Password
                            </Label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="h-11"
                                    placeholder="••••••••"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="newPassword" className="block text-sm font-medium text-zinc-700">
                                New Password
                            </Label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="h-11 pr-10"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
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
                                Confirm New Password
                            </Label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="h-11"
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
                                {loading ? "Changing..." : "Change Password"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
