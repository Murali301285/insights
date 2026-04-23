"use client"

import React, { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, FolderTree, ArrowRight } from "lucide-react"

export default function PagesManagementPage() {
    const { setHeaderInfo } = useHeader()
    const [pages, setPages] = useState<any[]>([])
    const [openModal, setOpenModal] = useState(false)
    const [editPage, setEditPage] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setHeaderInfo("Page Details", "Configure application navigation hierarchy")
        fetchPages()
    }, [setHeaderInfo])

    const fetchPages = async () => {
        setLoading(true)
        const res = await fetch("/api/config/pages")
        if (res.ok) setPages(await res.json())
        setLoading(false)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const payload = {
            id: editPage?.id,
            pageName: fd.get("pageName"),
            path: fd.get("path"),
            icon: fd.get("icon"),
            parentId: fd.get("parentId") || null,
            orderIndex: fd.get("orderIndex"),
            remarks: fd.get("remarks"),
            isActive: fd.get("isActive") === "on",
        }

        const res = await fetch("/api/config/pages", {
            method: editPage ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            setOpenModal(false)
            fetchPages()
        } else {
            alert("Failed to save page configuration.")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? Removing a page removes it from the sidebar.")) return
        const res = await fetch(`/api/config/pages?id=${id}`, { method: "DELETE" })
        if (res.ok) fetchPages()
        else alert("Cannot delete page.")
    }

    // Structure flat array into tree for visual table logic
    const roots = pages.filter(p => !p.parentId).sort((a,b) => a.orderIndex - b.orderIndex);

    return (
        <div className="space-y-6">
            <div className="flex justify-end pt-4">
                <Button onClick={() => { setEditPage(null); setOpenModal(true); }} className="bg-sky-600 hover:bg-sky-700 font-bold px-6">
                    <Plus className="w-4 h-4 mr-2" /> Add Menu Item
                </Button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-b border-zinc-200 font-bold">
                        <tr>
                            <th className="px-6 py-4">Menu Structure</th>
                            <th className="px-6 py-4">Path</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-400">Loading...</td></tr>
                        ) : roots.map(root => (
                            <React.Fragment key={root.id}>
                                <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 bg-zinc-50/20">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-zinc-900 font-bold">
                                            <FolderTree className="w-4 h-4 mr-3 text-emerald-600" /> {root.pageName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">{root.path || 'Root Parent'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${root.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                            {root.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => { setEditPage(root); setOpenModal(true); }} className="text-sky-600 p-2 hover:bg-sky-50 rounded-lg">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(root.id)} className="text-rose-600 p-2 hover:bg-rose-50 rounded-lg ml-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                                {/* Map Children */}
                                {pages.filter(p => p.parentId === root.id).sort((a,b)=> a.orderIndex - b.orderIndex).map(child => (
                                    <tr key={child.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                                        <td className="px-6 py-3 pl-12">
                                            <div className="flex items-center text-zinc-700">
                                                <ArrowRight className="w-3 h-3 mr-3 text-zinc-400" /> {child.pageName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-zinc-500 font-medium">{child.path}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-lg ${child.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {child.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => { setEditPage(child); setOpenModal(true); }} className="text-sky-600 p-2 hover:bg-sky-50 rounded-lg">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(child.id)} className="text-rose-600 p-2 hover:bg-rose-50 rounded-lg ml-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {openModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-sm">
                        <form onSubmit={handleSave}>
                            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                                <h3 className="text-lg font-bold text-zinc-800">{editPage ? "Edit Menu Config" : "Create Menu Item"}</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Page Name</label>
                                    <input required name="pageName" defaultValue={editPage?.pageName} className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Relative Path</label>
                                    <input name="path" defaultValue={editPage?.path} className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl" placeholder="/dashboard" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Icon String</label>
                                        <input name="icon" defaultValue={editPage?.icon} className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl" placeholder="LayoutDashboard" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase">Order Index</label>
                                        <input type="number" name="orderIndex" defaultValue={editPage?.orderIndex || 0} className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase">Attach as Child To (Parent ID)</label>
                                    <select name="parentId" defaultValue={editPage?.parentId || ""} className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                                        <option value="">No Parent (Root Item)</option>
                                        {roots.filter(r => r.id !== editPage?.id).map(r => (
                                            <option key={r.id} value={r.id}>{r.pageName}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex items-center gap-3 mt-4">
                                    <input type="checkbox" name="isActive" id="isActive" defaultChecked={editPage ? editPage.isActive : true} className="w-4 h-4 text-emerald-600 rounded" />
                                    <label htmlFor="isActive" className="text-sm font-bold text-zinc-700">Display in Navigation</label>
                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
                                <Button type="button" variant="ghost" onClick={() => setOpenModal(false)} className="font-bold text-zinc-500">Cancel</Button>
                                <Button type="submit" className="bg-sky-600 hover:bg-sky-700 font-bold px-8">Save Item</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
