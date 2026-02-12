"use client"

import { useState, useEffect } from "react"
import { useHeader } from "@/components/providers/HeaderProvider"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Pencil, Trash, Ban, ShieldCheck, Mail } from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface User {
    id: string
    email: string
    username: string
    profileName: string
    role: string
    isBlocked: boolean
    companyId?: string
    company?: {
        name: string
    }
}

interface Company {
    id: string
    name: string
}

export default function UserConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [users, setUsers] = useState<User[]>([])
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)

    useEffect(() => {
        setHeaderInfo("User Configuration", "Manage users, roles, and access permissions.")
        fetchData()
    }, [setHeaderInfo])

    async function fetchData() {
        setLoading(true)
        try {
            const [usersRes, companiesRes] = await Promise.all([
                fetch("/api/users"),
                fetch("/api/companies")
            ])

            if (usersRes.ok) {
                const data = await usersRes.json()
                setUsers(data)
            }
            if (companiesRes.ok) {
                const data = await companiesRes.json()
                setCompanies(data)
            }
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
            password: formData.get("password"),
            role: formData.get("role"),
            companyId: formData.get("companyId") === "none" ? null : formData.get("companyId"),
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

    // Columns Definition
    const columns: ColumnDef<User>[] = [
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
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <Badge variant="outline" className={row.original.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-zinc-50 text-zinc-700 border-zinc-200"}>
                    {row.original.role}
                </Badge>
            )
        },
        {
            accessorKey: "company.name",
            header: "Company",
            cell: ({ row }) => (
                <span className="text-sm text-zinc-600">
                    {row.original.company?.name || "-"}
                </span>
            )
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
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-zinc-700">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-orange-600">
                                <Ban className="mr-2 h-4 w-4" /> {user.isBlocked ? "Unblock" : "Block"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
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
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-zinc-900 hover:bg-zinc-800">
                            <Plus className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" name="username" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profileName">Display Name</Label>
                                    <Input id="profileName" name="profileName" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select name="role" defaultValue="user">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyId">Assign Company</Label>
                                <Select name="companyId">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select company (Optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id="isBlocked" name="isBlocked" />
                                <Label htmlFor="isBlocked" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Block access immediately
                                </Label>
                            </div>

                            <DialogFooter>
                                <Button type="submit">Create User</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable columns={columns} data={users} searchKey="profileName" />
        </div>
    )
}
