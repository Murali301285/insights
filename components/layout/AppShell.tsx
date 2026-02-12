import { getSession } from "@/lib/auth"
import { ShellLayout } from "@/components/layout/ShellLayout"

export async function AppShell({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    const user = session?.user || null;

    return (
        <ShellLayout user={user}>
            {children}
        </ShellLayout>
    )
}
