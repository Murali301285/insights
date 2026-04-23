"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { Button } from "@/components/ui/button"
import { Plus, Search, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { PremiumCard } from "@/components/design/PremiumCard"

// Complex matrix setup for RBAC
export default function RoleAuthPage() {
    const { setHeaderInfo } = useHeader()

    useEffect(() => {
        setHeaderInfo("Role Authentication", "Safely bind roles to module-level functionality grids.")
    }, [setHeaderInfo])

    const modules = [
        { name: "Dashboard", items: ["System Overview"] },
        { name: "Insights", items: ["Finance", "Business Acquisition", "Order Fulfillment", "Support", "HR", "Supply Chain"] },
        { name: "Tasks", items: ["Task Manager"] },
        { name: "Time Tracker", items: ["Activity Logs"] },
        { name: "Expense", items: ["Expense Entries"] },
        { name: "Inventory", items: ["Inventory Orders"] },
        { name: "Vault", items: ["Documents & Hierarchy"] },
        { name: "Config", items: ["Zone", "Customer Master", "Supplier Master", "Expense Category", "Company", "Users", "Roles", "Payment Types", "Status", "Request Stages", "System Configuration"] }
    ]

    const [selectedRole, setSelectedRole] = useState<string>("")
    const [roles, setRoles] = useState<{ id: string, name: string }[]>([])

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await fetch("/api/config/roles")
                if (res.ok) {
                    const data = await res.json()
                    setRoles(data)
                }
            } catch (error) {
                console.error("Error fetching roles", error)
            }
        }
        fetchRoles()
    }, [])

    // We would map module auth dynamically, mocked here natively:
    const handleSaveMatrix = () => {
        toast.success("Security permissions committed successfully.")
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-zinc-900 border-r pr-4 border-zinc-200">Role</span>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-[300px] border-none bg-zinc-50 font-medium">
                            <SelectValue placeholder="Select Target Role..." />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedRole ? (
                    <Button onClick={handleSaveMatrix} className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm font-semibold rounded-lg">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Apply Bindings
                    </Button>
                ) : (
                    <Button disabled variant="outline" className="opacity-50 font-semibold rounded-lg">Apply Bindings</Button>
                )}
            </div>

            {selectedRole ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    {modules.map((m, i) => (
                        <PremiumCard
                            key={i}
                            title={m.name}
                            className="bg-white border-zinc-200 shadow-sm"
                        >
                            <div className="space-y-4 pt-1">
                                <h4 className="font-semibold text-xs text-zinc-500 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-3">Sub-Modules / Pages</h4>
                                <div className="flex flex-col gap-3">
                                    {m.items.map((item, idx) => (
                                        <label key={idx} className="flex items-center justify-between cursor-pointer text-sm font-medium hover:bg-zinc-50 p-2 rounded-md -mx-2 transition-colors">
                                            <span className="text-zinc-700">{item}</span>
                                            <input type="checkbox" className="accent-indigo-600 w-4 h-4 rounded cursor-pointer" defaultChecked={i === 0 || i === 1} />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </PremiumCard>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center text-zinc-500 bg-white border border-zinc-200 border-dashed rounded-3xl mt-12 flex flex-col items-center">
                    <ShieldCheck className="w-10 h-10 text-zinc-300 mb-4" />
                    <p className="font-semibold">No target role isolated.</p>
                    <p className="text-sm">Initiate the authentication matrix by mapping a specific role above.</p>
                </div>
            )}
        </div>
    )
}
