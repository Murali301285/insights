"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash, Ban } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface User {
    id: string
    email: string
    username: string
    profileName: string
    phoneNumber?: string
    role?: any
    roleId?: string
    isBlocked: boolean
    companies?: { id: string, name: string }[]
    hasGlobalAccess?: boolean
    hasVaultAccess?: boolean
}

interface Company {
    id: string
    name: string
}

export default function UserManagementPage() {
    const { setHeaderInfo } = useHeader()
    const [users, setUsers] = useState<User[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [roles, setRoles] = useState<any[]>([])
    
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
    const [hasGlobalAccess, setHasGlobalAccess] = useState<boolean>(false)
    const [hasVaultAccess, setHasVaultAccess] = useState<boolean>(false)

    const toggleCompany = (id: string) => {
        if (selectedCompanyIds.includes(id)) setSelectedCompanyIds(selectedCompanyIds.filter(c => c !== id))
        else setSelectedCompanyIds([...selectedCompanyIds, id])
    }

    const resetForm = () => {
        setEditingUser(null)
        setSelectedCompanyIds([])
        setHasGlobalAccess(false)
        setHasVaultAccess(false)
    }

    const openEdit = (user: User) => {
        setEditingUser(user)
        setSelectedCompanyIds(user.companies?.map(c => c.id) || [])
        setHasGlobalAccess(user.hasGlobalAccess || false)
        setHasVaultAccess(user.hasVaultAccess || false)
    }

    useEffect(() => {
        setHeaderInfo("User Management", "Manage user accounts, roles, access levels, and security controls.")
        fetchData()
    }, [setHeaderInfo])

    async function fetchData() {
        setLoading(true)
        try {
            const [usersRes, companiesRes, rolesRes] = await Promise.all([
                fetch("/api/users"),
                fetch("/api/config/company"),
                fetch("/api/config/roles")
            ])
            if (usersRes.ok) setUsers(await usersRes.json())
            if (companiesRes.ok) setCompanies(await companiesRes.json())
            if (rolesRes.ok) setRoles(await rolesRes.json())
        } catch (error) {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const payload = {
            username: formData.get("username"),
            profileName: formData.get("profileName"),
            email: formData.get("email"),
            phoneNumber: formData.get("phoneNumber"),
            password: formData.get("password"),
            roleId: formData.get("roleId"),
            companyIds: selectedCompanyIds,
            hasGlobalAccess,
            hasVaultAccess,
            isBlocked: formData.get("isBlocked") === "on"
        }

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            })

            if (res.ok) {
                toast.success("User created successfully")
                setIsAddOpen(false)
                fetchData()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to create user")
            }
        } catch (err) {
            toast.error("Something went wrong")
        }
    }

    async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!editingUser) return

        const formData = new FormData(e.currentTarget)
        const password = formData.get("password") as string
        const payload: any = {
            id: editingUser.id,
            username: formData.get("username"),
            profileName: formData.get("profileName"),
            email: formData.get("email"),
            phoneNumber: formData.get("phoneNumber"),
            roleId: formData.get("roleId"),
            companyIds: selectedCompanyIds,
            hasGlobalAccess,
            hasVaultAccess,
            isBlocked: formData.get("isBlocked") === "on"
        }

        if (password) payload.password = password

        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            })
            if (res.ok) {
                toast.success("User updated successfully")
                setEditingUser(null)
                fetchData()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to update user")
            }
        } catch (err) {
            toast.error("Something went wrong")
        }
    }

    async function handleDeleteUser(id: string) {
        if (!confirm("Are you sure you want to delete this user?")) return
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("User deleted successfully")
                fetchData()
            } else {
                toast.error("Failed to delete user")
            }
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    async function handleBlockToggle(id: string, isBlocked: boolean) {
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                body: JSON.stringify({ id, isBlocked }),
                headers: { "Content-Type": "application/json" }
            })
            if (res.ok) {
                toast.success("User status updated")
                fetchData()
            } else {
                toast.error("Failed to update status")
            }
        } catch {
            toast.error("Something went wrong")
        }
    }

    const columns: ColumnDef<User>[] = [
        {
            id: "index",
            header: "Sl No.",
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "profileName",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.profileName || row.original.username}</span>
                    <span className="text-xs text-zinc-500">{row.original.email}</span>
                </div>
            )
        },
        {
            accessorKey: "phoneNumber",
            header: "Phone",
            cell: ({ row }) => (
                <span className="text-sm font-medium">{row.original.phoneNumber || "-"}</span>
            )
        },
        {
            accessorKey: "role",
            header: "Role & Access",
            cell: ({ row }) => {
                const roleName = row.original.role?.name || "Unassigned";
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className={roleName === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-zinc-50 text-zinc-700 border-zinc-200"}>
                            {roleName}
                        </Badge>
                        {row.original.hasVaultAccess && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 border border-amber-200 rounded">VAULT</span>
                        )}
                    </div>
                )
            }
        },
        {
            id: "companies",
            header: "Company",
            cell: ({ row }) => {
                if (row.original.hasGlobalAccess) {
                    return <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded">Global/All</span>;
                }
                const comps = row.original.companies;
                if (!comps || comps.length === 0) return <span className="text-sm text-zinc-400">-</span>;
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {comps.map(c => (
                            <span key={c.id} className="text-[11px] font-medium bg-zinc-100 border border-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded">
                                {c.name}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            accessorKey: "isBlocked",
            header: "Status",
            cell: ({ row }) => (
                <span className={row.original.isBlocked ? "text-red-500 font-medium text-xs" : "text-emerald-500 font-medium text-xs"}>
                    {row.original.isBlocked ? "Blocked" : "Active"}
                </span>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="text-zinc-700" onClick={() => openEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-orange-600" onClick={() => handleBlockToggle(user.id, !user.isBlocked)}>
                                <Ban className="mr-2 h-4 w-4" /> {user.isBlocked ? "Unblock" : "Block"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user.id)}>
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">System Users</h2>
                <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-zinc-900 hover:bg-zinc-800">
                            <Plus className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" name="username" required autoComplete="off" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profileName">Display Name</Label>
                                    <Input id="profileName" name="profileName" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required autoComplete="off" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" name="phoneNumber" placeholder="+91 xxxxx xxxxx" autoComplete="new-password" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required autoComplete="new-password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roleId">Role</Label>
                                    <select name="roleId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="">Select Role...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Assign Company Access</Label>
                                    <label className="flex items-center gap-2 cursor-pointer border px-3 py-1 rounded bg-zinc-50 hover:bg-zinc-100 transition-colors">
                                        <Checkbox checked={hasGlobalAccess} onCheckedChange={(c) => setHasGlobalAccess(!!c)} />
                                        <span className="text-sm font-semibold text-zinc-800">Global (All Companies)</span>
                                    </label>
                                </div>
                                <div className={`p-3 border rounded-md max-h-40 overflow-y-auto grid grid-cols-2 gap-2 ${hasGlobalAccess ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {companies.map(c => (
                                        <label key={c.id} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer hover:text-emerald-700">
                                            <input type="checkbox" checked={selectedCompanyIds.includes(c.id)} onChange={() => toggleCompany(c.id)} className="rounded border-gray-300 text-emerald-600" />
                                            {c.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center space-x-6 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="hasVaultAccess" name="hasVaultAccess" checked={hasVaultAccess} onCheckedChange={(c) => setHasVaultAccess(!!c)} />
                                    <Label htmlFor="hasVaultAccess" className="text-sm font-medium leading-none">Access to Vault</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="isBlocked" name="isBlocked" />
                                    <Label htmlFor="isBlocked" className="text-sm font-medium leading-none">Block access</Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit">Create User</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable columns={columns} data={users} searchKey="profileName" />

            {/* Edit Modal */}
            <Dialog open={!!editingUser} onOpenChange={(o) => !o && resetForm()}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-username">Username</Label>
                                    <Input id="edit-username" name="username" defaultValue={editingUser.username} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-profileName">Display Name</Label>
                                    <Input id="edit-profileName" name="profileName" defaultValue={editingUser.profileName} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input id="edit-email" name="email" type="email" defaultValue={editingUser.email} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                                    <Input id="edit-phoneNumber" name="phoneNumber" defaultValue={editingUser.phoneNumber} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-password">Password (Optional)</Label>
                                    <Input id="edit-password" name="password" type="password" placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-roleId">Role</Label>
                                    <select name="roleId" defaultValue={editingUser.roleId || ""} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="">Select Role...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Assign Company Access</Label>
                                    <label className="flex items-center gap-2 cursor-pointer border px-3 py-1 rounded bg-zinc-50 hover:bg-zinc-100 transition-colors">
                                        <Checkbox checked={hasGlobalAccess} onCheckedChange={(c) => setHasGlobalAccess(!!c)} />
                                        <span className="text-sm font-semibold text-zinc-800">Global (All)</span>
                                    </label>
                                </div>
                                <div className={`p-3 border rounded-md max-h-40 overflow-y-auto grid grid-cols-2 gap-2 ${hasGlobalAccess ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {companies.map(c => (
                                        <label key={c.id} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer hover:text-emerald-700">
                                            <input type="checkbox" checked={selectedCompanyIds.includes(c.id)} onChange={() => toggleCompany(c.id)} className="rounded border-gray-300 text-emerald-600" />
                                            {c.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center space-x-6 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="edit-hasVaultAccess" name="hasVaultAccess" checked={hasVaultAccess} onCheckedChange={(c) => setHasVaultAccess(!!c)} />
                                    <Label htmlFor="edit-hasVaultAccess" className="text-sm font-medium leading-none">Access to Vault</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="edit-isBlocked" name="isBlocked" defaultChecked={editingUser.isBlocked} />
                                    <Label htmlFor="edit-isBlocked" className="text-sm font-medium leading-none">Blocked Access</Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
