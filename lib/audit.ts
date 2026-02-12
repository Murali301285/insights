import { prisma } from "@/lib/prisma"

interface AuditLogEntry {
    action: string
    entity: string
    entityId?: string
    details?: any
    userId?: string
    userEmail?: string
    ipAddress?: string
}

export async function logAction(entry: AuditLogEntry) {
    try {
        await prisma.auditLog.create({
            data: {
                action: entry.action,
                entity: entry.entity,
                entityId: entry.entityId,
                details: entry.details,
                userId: entry.userId,
                userEmail: entry.userEmail,
                ipAddress: entry.ipAddress
            }
        })
    } catch (error) {
        console.error("Failed to write audit log:", error)
        // Fail silently to avoid blocking main flow, or handle as needed
    }
}
