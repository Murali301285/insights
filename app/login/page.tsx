"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { InsightLogo, InsightBackground } from "@/components/design/InsightLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email")
        const password = formData.get("password")

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (res.ok) {
                toast.success("Welcome back!", { duration: 2000 }) // Auto close 2s for quick redirect feel
                router.push("/")
                router.refresh()
            } else {
                toast.error(data.error || "Invalid credentials")
            }
        } catch (err) {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 relative overflow-hidden">
            <InsightBackground />

            <div className="z-10 w-full max-w-md px-4">
                <div className="mb-8 flex justify-center">
                    <InsightLogo className="text-3xl" />
                </div>

                <Card className="border-zinc-200 shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center tracking-tight">Welcome back</CardTitle>
                        <p className="text-center text-sm text-zinc-500">Sign in to your dashboard</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="admin@insight.com" required className="bg-white" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="bg-white pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <a href="#" className="text-xs text-emerald-600 hover:text-emerald-500 font-medium">Forgot password?</a>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-xs text-zinc-400">
                    &copy; 2026 Silotech. All rights reserved.
                </p>
            </div>
        </div>
    )
}
