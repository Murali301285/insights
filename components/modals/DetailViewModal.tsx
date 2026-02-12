"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface DetailViewModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    category?: string
}

export function DetailViewModal({ isOpen, onClose, title, category }: DetailViewModalProps) {
    // Mock Data - In a real app, this would be fetched based on category/title
    const mockData = [
        { id: "TRX-9821", date: "2024-02-06", description: "Consulting Fees", status: "Completed", amount: "$1,250.00" },
        { id: "TRX-9822", date: "2024-02-05", description: "Software License", status: "Pending", amount: "$450.00" },
        { id: "TRX-9823", date: "2024-02-05", description: "Office Supplies", status: "Processing", amount: "$125.50" },
        { id: "TRX-9824", date: "2024-02-04", description: "Server Maintenance", status: "Completed", amount: "$850.00" },
        { id: "TRX-9825", date: "2024-02-03", description: "Travel Expenses", status: "Rejected", amount: "$320.00" },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Detailed breakdown of {category || "recent activity"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.id}</TableCell>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                item.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    item.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                        item.status === "Processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                            "bg-red-50 text-red-700 border-red-200"
                                            }
                                        >
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{item.amount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}
