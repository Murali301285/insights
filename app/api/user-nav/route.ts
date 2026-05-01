import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const roleId = session.user.roleId;

        // Base fetch: Get user's role accesses where canView = true
        let roleAccesses: any[] = [];

        if (session.user.userType === 'Group') {
            // Group users see ALL active pages, but in read-only mode (frontend checks `canAdd`)
            const allPages = await prisma.appPage.findMany({
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' }
            });
            roleAccesses = allPages.map(p => ({
                page: p,
                canView: true,
                canAdd: false,
                canEdit: false,
                canDelete: false
            }));
        } else if (session.user.role === 'admin') {
            // Super admins see ALL active pages
            const allPages = await prisma.appPage.findMany({
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' }
            });
            // Construct dummy accesses
            roleAccesses = allPages.map(p => ({
                page: p,
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true
            }));
        } else if (roleId) {
            roleAccesses = await prisma.roleAccess.findMany({
                where: { roleId, canView: true, page: { isActive: true } },
                include: { page: true }
            });
            // Sort them by page.orderIndex manually
            roleAccesses.sort((a, b) => a.page.orderIndex - b.page.orderIndex);
        }

        // Reconstruct hierarchical Nav Menu array
        const navMap = new Map();

        // Pass 1: Initialize all possible parents
        roleAccesses.forEach(access => {
            const page = access.page;
            if (!page.parentId) {
                // It's a root item
                if (!navMap.has(page.id)) {
                    navMap.set(page.id, {
                        id: page.id,
                        title: page.pageName,
                        href: page.path || undefined,
                        iconStr: page.icon, // Lucide icon wrapper handled in frontend
                        orderIndex: page.orderIndex,
                        children: undefined
                    });
                }
            }
        });

        // Pass 2: Attach children
        roleAccesses.forEach(access => {
            const page = access.page;
            if (page.parentId) {
                const parent = navMap.get(page.parentId);
                if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.push({
                        id: page.id,
                        title: page.pageName,
                        href: page.path,
                        orderIndex: page.orderIndex,
                        permissions: {
                            canView: access.canView,
                            canAdd: access.canAdd,
                            canEdit: access.canEdit,
                            canDelete: access.canDelete
                        }
                    });
                } else {
                    // Orphaned active child (parent might not have View checked natively).
                    // As per UI design, we just push it as a root element or reconstruct parent.
                    // Assuming good data integrity where parent must be View if child is View.
                    navMap.set(page.parentId, {
                        id: page.parentId + "_orphan",
                        title: "Orphaned Parent", // Should ideally fetch parent name
                        children: [{
                            id: page.id,
                            title: page.pageName,
                            href: page.path
                        }]
                    })
                }
            }
        });

        // Sort children
        navMap.forEach(parent => {
            if (parent.children) {
                parent.children.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
            }
        });

        const sortedNav = Array.from(navMap.values())
            .filter((a: any) => a.title !== 'Inventory' && a.title !== 'Utilities' && !(session.user.userType === 'Group' && a.title === 'Config'))
            .sort((a: any, b: any) => a.orderIndex - b.orderIndex);

        const utilitiesParent = Array.from(navMap.values()).find((a: any) => a.title === 'Utilities');
        const allowedUtilities = utilitiesParent?.children?.map((c: any) => c.title) || [];

        return NextResponse.json({
            nav: sortedNav,
            utilities: allowedUtilities
        });
    } catch (error: any) {
        console.error("GET User Nav Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
