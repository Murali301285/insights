"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { Button } from "@/components/ui/button"
import { Save, Search, ChevronRight, ChevronDown } from "lucide-react"

export default function AccessManagementPage() {
    const { setHeaderInfo } = useHeader()
    const [roles, setRoles] = useState<any[]>([])
    const [pages, setPages] = useState<any[]>([])
    
    const [selectedRole, setSelectedRole] = useState<string>("")
    const [accessMap, setAccessMap] = useState<any>({}) // map[pageId] = { canView, canAdd, canEdit, canDelete }
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        setHeaderInfo("Role Authorization", "Configure granular access permissions for each role")
        fetchRolesAndPages()
    }, [setHeaderInfo])

    const fetchRolesAndPages = async () => {
        const [rRes, pRes] = await Promise.all([
            fetch("/api/config/roles"),
            fetch("/api/config/pages")
        ])
        if (rRes.ok) setRoles(await rRes.json())
        if (pRes.ok) setPages(await pRes.json())
    }

    const loadRoleAccess = async (roleId: string) => {
        setSelectedRole(roleId)
        if (!roleId) return setAccessMap({})
        
        const res = await fetch(`/api/config/access?roleId=${roleId}`)
        if (res.ok) {
            const data = await res.json()
            const map: any = {}
            pages.forEach(p => {
                const existing = data.find((d: any) => d.pageId === p.id)
                map[p.id] = existing ? existing : { canView: false, canAdd: false, canEdit: false, canDelete: false }
            })
            setAccessMap(map)
        }
    }

    const handleCheckAll = (pageId: string) => {
        setAccessMap((prev: any) => {
            const newMap = { ...prev }
            const newPageData = { ...(newMap[pageId] || { canView: false, canAdd: false, canEdit: false, canDelete: false }) }
            
            const isAllChecked = newPageData.canView && newPageData.canAdd && newPageData.canEdit && newPageData.canDelete
            const newVal = !isAllChecked
            
            newPageData.canView = newVal
            newPageData.canAdd = newVal
            newPageData.canEdit = newVal
            newPageData.canDelete = newVal
            newMap[pageId] = newPageData

            const page = pages.find(p => p.id === pageId)
            if (page) {
                if (!page.parentId) {
                    pages.filter(p => p.parentId === pageId).forEach(child => {
                        newMap[child.id] = { 
                            ...(newMap[child.id] || {}), 
                            canView: newVal,
                            canAdd: newVal,
                            canEdit: newVal,
                            canDelete: newVal
                        }
                    })
                } else {
                    if (newVal) {
                        newMap[page.parentId] = { ...(newMap[page.parentId] || {}), canView: true }
                    }
                }
            }
            return newMap
        })
    }

    const handleCheck = (pageId: string, field: 'canView'|'canAdd'|'canEdit'|'canDelete') => {
        setAccessMap((prev: any) => {
            const newMap = { ...prev }
            const newPageData = { ...(newMap[pageId] || { canView: false, canAdd: false, canEdit: false, canDelete: false }) }
            const newVal = !newPageData[field]
            newPageData[field] = newVal
            newMap[pageId] = newPageData

            // Cascade logic
            const page = pages.find(p => p.id === pageId)
            if (page) {
                if (!page.parentId) {
                    // It's a parent. If checking View, check all children View. If unchecking View, uncheck all.
                    if (field === 'canView') {
                        pages.filter(p => p.parentId === pageId).forEach(child => {
                            newMap[child.id] = { ...(newMap[child.id] || {}), canView: newVal }
                        })
                    }
                } else {
                    // It's a child. If we check ANY box, we must force the parent's View to true.
                    if (newVal) {
                        newMap[page.parentId] = { ...(newMap[page.parentId] || {}), canView: true }
                    }
                }
            }
            return newMap
        })
    }

    const handleSave = async () => {
        if (!selectedRole) return
        const payload = Object.keys(accessMap).map(pageId => ({
            pageId,
            ...accessMap[pageId]
        }))

        const res = await fetch("/api/config/access", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleId: selectedRole, accesses: payload })
        })

        if (res.ok) {
            alert("Role authorization saved successfully.")
        } else {
            alert("Failed to save changes.")
        }
    }

    const roots = pages.filter(p => !p.parentId).sort((a,b)=> a.orderIndex - b.orderIndex)

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-6 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                <div className="flex-1 max-w-sm">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Select Role</label>
                    <select 
                        value={selectedRole} 
                        onChange={(e) => loadRoleAccess(e.target.value)}
                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                    >
                        <option value="">-- Choose Role --</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name} {r.remarks ? `(${r.remarks})` : ''}</option>
                        ))}
                    </select>
                </div>
                {selectedRole && (
                    <div className="flex-1 relative">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Search Menus</label>
                        <Search className="w-4 h-4 absolute bottom-4 left-3 text-zinc-400" />
                        <input 
                            placeholder="e.g. Dashboard..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                        />
                    </div>
                )}
                {selectedRole && (
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 py-6 mb-0.5 shadow-md border-b-4 border-indigo-800">
                        <Save className="w-5 h-5 mr-3" /> Save Matrix
                    </Button>
                )}
            </div>

            {selectedRole && (
                <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm pt-2 pb-6">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-100 font-bold text-xs uppercase tracking-wider bg-zinc-50/50 text-zinc-800 mt-2">
                        <div className="col-span-3">Menu Structure</div>
                        <div className="col-span-1 text-center text-zinc-600">All</div>
                        <div className="col-span-2 text-center text-emerald-700">View</div>
                        <div className="col-span-2 text-center text-sky-700">Add</div>
                        <div className="col-span-2 text-center text-amber-600">Edit</div>
                        <div className="col-span-2 text-center text-rose-600">Delete</div>
                    </div>

                    <div className="divide-y divide-zinc-50 mt-2">
                        {roots.filter(r => r.pageName.toLowerCase().includes(searchQuery.toLowerCase()) || pages.some(c => c.parentId === r.id && c.pageName.toLowerCase().includes(searchQuery.toLowerCase()))).map(root => (
                            <div key={root.id} className="group">
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-zinc-50/50 bg-zinc-50/30 font-medium border-l-4 border-emerald-500">
                                    <div className="col-span-3 flex items-center text-zinc-900 font-bold text-sm">
                                        <ChevronDown className="w-4 h-4 mr-2 text-zinc-400" /> {root.pageName}
                                    </div>
                                    <div className="col-span-1 text-center border-r border-zinc-200">
                                        <input type="checkbox" checked={accessMap[root.id]?.canView && accessMap[root.id]?.canAdd && accessMap[root.id]?.canEdit && accessMap[root.id]?.canDelete || false} onChange={() => handleCheckAll(root.id)} className="w-4 h-4 accent-zinc-800" />
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <input type="checkbox" checked={accessMap[root.id]?.canView || false} onChange={() => handleCheck(root.id, 'canView')} className="w-4 h-4 accent-emerald-600" />
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <input type="checkbox" checked={accessMap[root.id]?.canAdd || false} onChange={() => handleCheck(root.id, 'canAdd')} className="w-4 h-4 accent-sky-600" />
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <input type="checkbox" checked={accessMap[root.id]?.canEdit || false} onChange={() => handleCheck(root.id, 'canEdit')} className="w-4 h-4 accent-amber-600" />
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <input type="checkbox" checked={accessMap[root.id]?.canDelete || false} onChange={() => handleCheck(root.id, 'canDelete')} className="w-4 h-4 accent-rose-600" />
                                    </div>
                                </div>
                                {pages.filter(p => p.parentId === root.id && p.pageName.toLowerCase().includes(searchQuery.toLowerCase())).sort((a,b)=>a.orderIndex - b.orderIndex).map(child => (
                                    <div key={child.id} className="grid grid-cols-12 gap-4 px-6 py-2.5 items-center hover:bg-zinc-50 border-l-4 border-transparent text-sm">
                                        <div className="col-span-3 flex items-center pl-8 text-zinc-600">
                                            {child.pageName}
                                        </div>
                                        <div className="col-span-1 text-center border-r border-zinc-200">
                                            <input type="checkbox" checked={accessMap[child.id]?.canView && accessMap[child.id]?.canAdd && accessMap[child.id]?.canEdit && accessMap[child.id]?.canDelete || false} onChange={() => handleCheckAll(child.id)} className="w-4 h-4 accent-zinc-800" />
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <input type="checkbox" checked={accessMap[child.id]?.canView || false} onChange={() => handleCheck(child.id, 'canView')} className="w-4 h-4 accent-emerald-500" />
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <input type="checkbox" checked={accessMap[child.id]?.canAdd || false} onChange={() => handleCheck(child.id, 'canAdd')} className="w-4 h-4 accent-sky-500" />
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <input type="checkbox" checked={accessMap[child.id]?.canEdit || false} onChange={() => handleCheck(child.id, 'canEdit')} className="w-4 h-4 accent-amber-500" />
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <input type="checkbox" checked={accessMap[child.id]?.canDelete || false} onChange={() => handleCheck(child.id, 'canDelete')} className="w-4 h-4 accent-rose-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
