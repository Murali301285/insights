"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"

export default function RoleManagementPage() {
    const { setHeaderInfo } = useHeader()
    const [roles, setRoles] = useState<any[]>([])
    const [openModal, setOpenModal] = useState(false)
    const [editRole, setEditRole] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setHeaderInfo("Role Management", "Create and manage system roles")
        fetchRoles()
    }, [setHeaderInfo])

    const fetchRoles = async () => {
        setLoading(true)
        const res = await fetch("/api/config/roles")
        if (res.ok) setRoles(await res.json())
        setLoading(false)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const payload = {
            id: editRole?.id,
            name: fd.get("name"),
            remarks: fd.get("remarks"),
            isActive: fd.get("isActive") === "on",
        }

        const res = await fetch("/api/config/roles", {
            method: editRole ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            setOpenModal(false)
            fetchRoles()
        } else {
            alert("Failed to save role. Name may not be unique.")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This role cannot be deleted if assigned to users or permissions.")) return
        const res = await fetch(`/api/config/roles?id=${id}`, { method: "DELETE" })
        if (res.ok) fetchRoles()
        else alert("Cannot delete role. It is likely bound to users.")
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => { setEditRole(null); setOpenModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Add New Role
                </Button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-b border-zinc-200 font-bold">
                        <tr>
                            <th className="px-6 py-4">Role Name</th>
                            <th className="px-6 py-4">Remarks</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-400">Loading...</td></tr>
                        ) : roles.map((r) => (
                            <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                                <td className="px-6 py-4 font-bold text-zinc-900">{r.name}</td>
                                <td className="px-6 py-4 text-zinc-500">{r.remarks || "-"}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${r.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                        {r.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => { setEditRole(r); setOpenModal(true); }} className="text-sky-600 p-2 hover:bg-sky-50 rounded-lg">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(r.id)} className="text-rose-600 p-2 hover:bg-rose-50 rounded-lg ml-2">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {openModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleSave}>
                            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                                <h3 className="text-xl font-bold text-zinc-800">{editRole ? "Edit Role" : "Create New Role"}</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Role Name</label>
                                    <input required name="name" defaultValue={editRole?.name} className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl" placeholder="e.g. Finance Admin" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Remarks</label>
                                    <textarea name="remarks" defaultValue={editRole?.remarks} className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl" rows={3}></textarea>
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <input type="checkbox" name="isActive" id="isActive" defaultChecked={editRole ? editRole.isActive : true} className="w-4 h-4 text-emerald-600 rounded" />
                                    <label htmlFor="isActive" className="text-sm font-bold text-zinc-700">Active Role</label>
                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
                                <Button type="button" variant="ghost" onClick={() => setOpenModal(false)} className="font-bold text-zinc-500">Cancel</Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8">Save Role</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
