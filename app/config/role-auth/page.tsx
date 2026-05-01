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

    const [selectedRole, setSelectedRole] = useState<string>("")
    const [roles, setRoles] = useState<{ id: string, name: string }[]>([])
    const [pages, setPages] = useState<any[]>([])
    const [roleAccesses, setRoleAccesses] = useState<Record<string, boolean>>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [rolesRes, pagesRes] = await Promise.all([
                    fetch("/api/config/roles"),
                    fetch("/api/config/pages")
                ])
                if (rolesRes.ok) setRoles(await rolesRes.json())
                if (pagesRes.ok) setPages(await pagesRes.json())
            } catch (error) {
                console.error("Error fetching data", error)
            }
        }
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (!selectedRole) {
            setRoleAccesses({})
            return
        }
        const fetchAccesses = async () => {
            try {
                const res = await fetch(`/api/config/role-auth?roleId=${selectedRole}`)
                if (res.ok) {
                    const data = await res.json()
                    const accessMap: Record<string, boolean> = {}
                    data.forEach((acc: any) => {
                        accessMap[acc.pageId] = acc.canView
                    })
                    setRoleAccesses(accessMap)
                }
            } catch (error) {
                console.error("Error fetching access", error)
            }
        }
        fetchAccesses()
    }, [selectedRole])

    const handleSaveMatrix = async () => {
        if (!selectedRole) return
        setLoading(true)
        try {
            const res = await fetch('/api/config/role-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleId: selectedRole,
                    accesses: roleAccesses
                })
            })
            if (res.ok) {
                toast.success("Security permissions committed successfully.")
            } else {
                toast.error("Failed to save permissions")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    // Process pages into modules
    const modules: { name: string; id: string; items: any[] }[] = []
    
    // Group by parent
    const topLevel = pages.filter(p => !p.parentId).sort((a, b) => a.orderIndex - b.orderIndex)
    
    topLevel.forEach(parent => {
        const children = pages.filter(p => p.parentId === parent.id).sort((a, b) => a.orderIndex - b.orderIndex)
        modules.push({
            name: parent.pageName,
            id: parent.id,
            items: children.length > 0 ? children : [parent] // If no children, the parent is the item
        })
    })

    const handleCheckboxChange = (pageId: string, checked: boolean) => {
        setRoleAccesses(prev => ({
            ...prev,
            [pageId]: checked
        }))
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
                                        <label key={item.id} className="flex items-center justify-between cursor-pointer text-sm font-medium hover:bg-zinc-50 p-2 rounded-md -mx-2 transition-colors">
                                            <span className="text-zinc-700">{item.pageName}</span>
                                            <input 
                                                type="checkbox" 
                                                className="accent-indigo-600 w-4 h-4 rounded cursor-pointer" 
                                                checked={!!roleAccesses[item.id]} 
                                                onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                                            />
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
