import { getSession } from "@/lib/auth"
import HierarchyPageContent from "@/components/hierarchy/HierarchyPageContent"

export default async function HierarchyPage() {
    const session = await getSession();
    const userRole = session?.user?.role || "user";

    return (
        <HierarchyPageContent role={userRole} />
    )
}
