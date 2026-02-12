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
import { toast } from "sonner"

// Company Type
type Company = {
    id: string
    name: string
    code: string
    contactEmail: string
    isBlocked: boolean
    createdAt: string
}

export default function CompanyConfigPage() {
    const { setHeaderInfo } = useHeader()
    const [data, setData] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)

    useEffect(() => {
        setHeaderInfo("Company Management", "Configure and manage organization entities.")
        fetchCompanies()
    }, [setHeaderInfo])

    async function fetchCompanies() {
        setLoading(true)
        try {
            const res = await fetch("/api/companies")
            if (res.ok) {
                const companies = await res.json()
                setData(companies)
            }
        } catch (error) {
            toast.error("Failed to fetch companies")
        } finally {
            setLoading(false)
        }
    }

    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const payload = Object.fromEntries(formData)

        try {
            const res = await fetch("/api/companies", {
                method: "POST",
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                toast.success("Company created")
                setIsAddOpen(false)
                fetchCompanies()
            } else {
                toast.error("Failed to create company")
            }
        } catch (error) {
            toast.error("Error creating company")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            const res = await fetch(`/api/companies?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Company deleted")
                fetchCompanies()
            }
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    // Columns Definition
    const columns: ColumnDef<Company>[] = [
        {
            accessorKey: "name",
            header: "Company Name",
        },
        {
            accessorKey: "code",
            header: "Code",
        },
        {
            accessorKey: "contactEmail",
            header: "Email",
        },
        {
            accessorKey: "isBlocked",
            header: "Status",
            cell: ({ row }) => (
                <span className={row.original.isBlocked ? "text-red-500 font-medium" : "text-emerald-500 font-medium"}>
                    {row.original.isBlocked ? "Blocked" : "Active"}
                </span>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const company = row.original
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
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(company.id)}>
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-zinc-700">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-orange-600">
                                <Ban className="mr-2 h-4 w-4" /> Block
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(company.id)} className="text-red-600">
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
                <h2 className="text-lg font-medium">Organizations</h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Company
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Company</DialogTitle>
                            <DialogDescription>
                                Enter the details of the new organization.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Company Name</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input id="code" name="code" placeholder="EX: SILO" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input id="contactEmail" name="contactEmail" type="email" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" name="address" />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Company</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable columns={columns} data={data} searchKey="name" />
        </div>
    )
}
