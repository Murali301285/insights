"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, Search, RefreshCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useHeader } from "@/components/providers/HeaderProvider"

interface AuditLog {
    id: string
    action: string
    entity: string
    entityId: string | null
    details: any
    userEmail: string | null
    createdAt: string
}

export default function SystemLogsPage() {
    const { setHeaderInfo } = useHeader()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        setHeaderInfo("System Audit Logs", "Track user actions and security events.")
        fetchLogs()
    }, [setHeaderInfo])

    async function fetchLogs() {
        setLoading(true)
        try {
            const res = await fetch("/api/audit")
            if (res.ok) {
                const data = await res.json()
                setLogs(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-4">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search logs..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" onClick={fetchLogs}>
                    <RefreshCcw className="h-4 w-4" />
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Recent system events and user activities.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap font-mono text-xs text-zinc-500">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                log.action.includes("LOGIN") ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                    log.action.includes("CREATE") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                        log.action.includes("DELETE") ? "bg-red-50 text-red-700 border-red-200" :
                                                            "bg-zinc-50 text-zinc-700 border-zinc-200"
                                            }>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {log.userEmail || "System"}
                                        </TableCell>
                                        <TableCell className="text-sm text-zinc-600">
                                            {log.entity} <span className="text-xs text-zinc-400">#{log.entityId?.slice(-4)}</span>
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-500 max-w-[200px] truncate">
                                            {JSON.stringify(log.details)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
