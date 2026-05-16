"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash, ArrowUpDown, Eye, EyeOff, ChevronDown } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type User = {
    id: string
    firstName?: string
    lastName?: string
    profileName?: string
    email: string
    userType: string
    phoneNumber?: string
    notificationEmails?: string
    primaryManagerId?: string
    secondaryManagerId?: string
    companyIds?: string[]
    companies?: any[]
    roleId?: string
    isBlocked: boolean
    createdAt: string
}

export default function UserConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<User[]>([])
    const [companies, setCompanies] = useState<any[]>([])
    const [roles, setRoles] = useState<any[]>([])

    // We'll use "data" itself for the manager list, since all users are loaded
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    // Form states for complex dropdowns
    const [selectedUserType, setSelectedUserType] = useState<string>("Entity")
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [selectedRole, setSelectedRole] = useState<string>("")
    const [selectedPrimaryManager, setSelectedPrimaryManager] = useState<string>("none")
    const [selectedSecondaryManager, setSelectedSecondaryManager] = useState<string>("none")

    const [generatedPassword, setGeneratedPassword] = useState("")
    const [isTempPassword, setIsTempPassword] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const generateTempPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
        let pass = ''
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setGeneratedPassword(pass)
        setIsTempPassword(true)
    }

    useEffect(() => {
        setHeaderInfo("User Management", "Configure and manage employee accounts and RBAC.")
        fetchInitialData()
    }, [setHeaderInfo])

    async function fetchInitialData() {
        setLoading(true)
        try {
            // In a real app we'd fetch /api/users, /api/companies, /api/roles
            // Assuming endpoints exist, using mock data fallback if they fail
            const [usersRes, compRes, roleRes] = await Promise.all([
                fetch("/api/users").catch(() => null),
                fetch("/api/companies").catch(() => null),
                fetch("/api/config/roles").catch(() => null)
            ])

            if (usersRes && usersRes.ok) setData(await usersRes.json())
            if (compRes && compRes.ok) setCompanies(await compRes.json())
            if (roleRes && roleRes.ok) setRoles(await roleRes.json())

        } catch (error) {
            toast.error("Failed to load user configuration data")
        } finally {
            setLoading(false)
        }
    }

    const openAddDialog = () => {
        setSelectedUserType("Entity")
        setSelectedCompanies([])
        setSelectedRole("")
        setSelectedPrimaryManager("none")
        setSelectedSecondaryManager("none")
        setGeneratedPassword("")
        setIsTempPassword(false)
        setIsAddOpen(true)
    }

    const openEditDialog = (user: User) => {
        // Safe defaults if API hasn't mapped properly yet
        setSelectedUserType(user.userType || "Entity")
        setSelectedCompanies(user.companies?.map(c => c.id) || [])
        setSelectedRole(user.roleId || "")
        setSelectedPrimaryManager(user.primaryManagerId || "none")
        setSelectedSecondaryManager(user.secondaryManagerId || "none")
        setEditingUser(user)
        setIsEditOpen(true)
    }

    const validateForm = (formData: FormData): boolean => {
        const notificationEmails = formData.get('notificationEmails') as string

        if (notificationEmails) {
            const emails = notificationEmails.split(',').map(e => e.trim()).filter(e => e)
            if (emails.length > 2) {
                toast.error("Maximum 2 notification emails allowed.")
                return false
            }
        }
        if (selectedUserType === "Entity") {
            if (selectedCompanies.length === 0) {
                toast.error("Please select at least one Company for Entity User.")
                return false
            }
            if (!selectedRole) {
                toast.error("Please select a Role for Entity User.")
                return false
            }
        }

        return true
    }

    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (!validateForm(formData)) return;

        const payload: any = Object.fromEntries(formData)

        payload.userType = selectedUserType
        
        if (selectedUserType === "Group") {
            payload.companyIds = selectedCompanies
            payload.roleId = selectedRole // Group users can have roles now!
            payload.primaryManagerId = null
            payload.secondaryManagerId = null
        } else {
            payload.companyIds = selectedCompanies
            payload.roleId = selectedRole
            payload.primaryManagerId = selectedPrimaryManager === 'none' ? null : selectedPrimaryManager
            payload.secondaryManagerId = selectedSecondaryManager === 'none' ? null : selectedSecondaryManager
        }

        payload.isBlocked = payload.isActive !== 'on'
        payload.isTempPassword = isTempPassword
        delete payload.isActive

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success("User successfully created")
                setIsAddOpen(false)
                fetchInitialData()
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || "Failed to create user (Ensure email is unique)")
            }
        } catch (error) {
            toast.error("Error creating user")
        }
    }

    async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!editingUser) return;

        const formData = new FormData(e.currentTarget)
        if (!validateForm(formData)) return;

        const payload: any = Object.fromEntries(formData)
        payload.userType = selectedUserType
        
        if (selectedUserType === "Group") {
            payload.companyIds = selectedCompanies
            payload.roleId = selectedRole
            payload.primaryManagerId = null
            payload.secondaryManagerId = null
        } else {
            payload.companyIds = selectedCompanies
            payload.roleId = selectedRole
            payload.primaryManagerId = selectedPrimaryManager === 'none' ? null : selectedPrimaryManager
            payload.secondaryManagerId = selectedSecondaryManager === 'none' ? null : selectedSecondaryManager
        }

        payload.isBlocked = payload.isActive !== 'on'
        delete payload.isActive

        if (!payload.password) delete payload.password // don't update if empty

        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingUser.id, ...payload })
            })
            if (res.ok) {
                toast.success("User updated successfully")
                setIsEditOpen(false)
                setEditingUser(null)
                fetchInitialData()
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || "Failed to update user")
            }
        } catch (error) {
            toast.error("Error updating user")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("User deleted")
                fetchInitialData()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    const FormContent = ({ defaultData }: { defaultData?: User }) => (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>First Name <span className="text-red-500">*</span></Label>
                    <Input name="firstName" maxLength={20} required defaultValue={defaultData?.firstName} />
                </div>
                <div className="space-y-2">
                    <Label>Last Name <span className="text-red-500">*</span></Label>
                    <Input name="lastName" maxLength={20} required defaultValue={defaultData?.lastName} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Email Id <span className="text-zinc-400 text-[10px] lowercase font-normal">(login id)</span> <span className="text-red-500">*</span></Label>
                    <Input name="email" type="email" required defaultValue={defaultData?.email} className="lowercase" autoComplete="off" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>User Type <span className="text-red-500">*</span></Label>
                    <Select value={selectedUserType} onValueChange={setSelectedUserType} required>
                        <SelectTrigger><SelectValue placeholder="Select User Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Entity">Entity User (Standard)</SelectItem>
                            <SelectItem value="Group">Group User (Read-Only across companies)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Contact No</Label>
                    <Input name="phoneNumber" type="tel" defaultValue={defaultData?.phoneNumber} autoComplete="off" />
                </div>
            </div>

            {/* Passwords */}
            <div className="space-y-2 max-w-md">
                <div className="flex justify-between items-center">
                    <Label>Password {defaultData ? "" : <span className="text-red-500">*</span>}</Label>
                    {!defaultData && (
                        <button 
                            type="button" 
                            onClick={generateTempPassword}
                            className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                            Generate
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Input 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        required={!defaultData} 
                        placeholder={defaultData ? "Leave blank to keep current" : ""} 
                        autoComplete="new-password"
                        defaultValue={!defaultData ? generatedPassword : undefined}
                        key={`pass-${generatedPassword}`}
                        onChange={(e) => {
                            if (!defaultData) setIsTempPassword(false)
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {!defaultData && isTempPassword && (
                    <p className="text-[10px] text-emerald-600 font-medium mt-1">Temp password generated. They will be asked to reset it.</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Companies <span className="text-red-500">*</span></Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between font-normal border-zinc-200">
                                {selectedCompanies.length > 0 ? `${selectedCompanies.length} selected` : "Select Companies"}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[300px] max-h-[300px] overflow-y-auto">
                            {companies.map(c => (
                                <DropdownMenuCheckboxItem 
                                    key={c.id} 
                                    checked={selectedCompanies.includes(c.id)}
                                    onSelect={(e) => e.preventDefault()}
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedCompanies(prev => [...prev, c.id])
                                        else setSelectedCompanies(prev => prev.filter(id => id !== c.id))
                                    }}
                                >
                                    {c.name}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="space-y-2">
                    <Label>Role <span className="text-red-500">*</span></Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole} required>
                        <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                        <SelectContent>
                            {roles.filter(r => r.userType === selectedUserType).map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedUserType === "Entity" && (
                <>
                    {/* Managers */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Primary Manager</Label>
                            <Select value={selectedPrimaryManager} onValueChange={setSelectedPrimaryManager}>
                                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- None --</SelectItem>
                                    {data.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Manager</Label>
                            <Select value={selectedSecondaryManager} onValueChange={setSelectedSecondaryManager}>
                                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- None --</SelectItem>
                                    {data.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </>
            )}

            {/* Notification Email */}
            <div className="space-y-2">
                <Label>Notification Email(s) <span className="text-zinc-400 text-xs">(Max 2, comma separated)</span></Label>
                <Input name="notificationEmails" type="text" placeholder="hr@example.com, manager@example.com" defaultValue={defaultData?.notificationEmails} />
            </div>

            <div className="space-y-2 flex items-center gap-4 border p-4 rounded-xl bg-zinc-50/50">
                <Label className="mt-2 text-sm font-medium">Account Active?</Label>
                <Switch name="isActive" defaultChecked={defaultData ? !defaultData.isBlocked : true} />
            </div>
        </div>
    )

    const columns: ColumnDef<User>[] = [
        { id: "index", header: "Sl No.", cell: ({ row }) => row.index + 1 },
        {
            accessorKey: "firstName",
            header: ({ column }) => (
                <Button variant="ghost" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    User Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const isActive = !row.original.isBlocked
                const name = `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim() || row.original.email
                return (
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <span className="cursor-pointer font-medium hover:underline text-emerald-700">{name}</span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64" side="right">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">{name}</h4>
                                <div className="text-xs text-muted-foreground pb-2 border-b border-zinc-100">
                                    <p><span className="font-semibold text-zinc-700">Email:</span> {row.original.email}</p>
                                    <p><span className="font-semibold text-zinc-700">Phone:</span> {row.original.phoneNumber || "N/A"}</p>
                                    <p><span className="font-semibold text-zinc-700">Status:</span>
                                        <span className={isActive ? "text-emerald-500 ml-1 font-medium" : "text-red-500 ml-1 font-medium"}>
                                            {isActive ? "Active" : "Blocked"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                )
            }
        },
        {
            accessorKey: "userType",
            header: "User Type",
            cell: ({ row }) => (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${row.original.userType === 'Group' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-700'}`}>
                    {row.original.userType || "Entity"}
                </span>
            )
        },
        {
            id: "companyName",
            header: "Company",
            cell: ({ row }) => {
                const user = row.original as any;
                
                if (!user.companies || user.companies.length === 0) {
                    return <span className="font-medium text-slate-700">{user.hasGlobalAccess ? "Global" : "No Companies"}</span>;
                }

                if (user.companies.length === 1) {
                    return <span className="font-medium text-slate-700">{user.companies[0].name}</span>;
                }

                return (
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <span className="cursor-pointer font-medium text-indigo-600 hover:underline border-b border-indigo-600/50 border-dashed pb-0.5">
                                {user.companies.length} Companies Selected
                            </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto min-w-[200px] max-w-sm" side="top">
                            <div className="space-y-1">
                                <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold border-b border-zinc-100 pb-1 mb-2">Allocated Companies</h4>
                                {user.companies.map((c: any) => (
                                    <div key={c.id} className="text-sm font-bold text-zinc-800">
                                        • {c.name}
                                    </div>
                                ))}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                )
            }
        },
        { accessorKey: "email", header: "Email / Login ID" },
        { accessorKey: "phoneNumber", header: "Contact No" },
        {
            accessorKey: "isBlocked",
            header: "Status",
            cell: ({ row }) => {
                const isActive = !row.original.isBlocked
                return (
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={isActive ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>
                            {isActive ? "Active" : "Inactive"}
                        </span>
                    </div>
                )
            }
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
                            <DropdownMenuItem onClick={() => openEditDialog(user)} className="text-blue-700">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600">
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
            <div className="flex justify-end items-center">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openAddDialog}>
                            <Plus className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto hidden-scrollbar">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-6 pb-2">
                            {FormContent({ defaultData: undefined })}
                            <div className="flex justify-end border-t pt-4">
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto mt-2">
                                    Save User Entry
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto hidden-scrollbar">
                    <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                    </DialogHeader>
                    {editingUser && (
                        <form onSubmit={handleEdit} className="space-y-6 pb-2">
                            {FormContent({ defaultData: editingUser })}
                            <div className="flex justify-end border-t pt-4">
                                <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 mt-2">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <DataTable 
                columns={columns} 
                data={data} 
                searchKey="firstName" 
                reportName="Config - User Report" 
                fileName="insight-config" 
            />
        </div>
    )
}
