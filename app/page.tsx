import { getSession } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardHome() {
  const session = await getSession();
  const user = session?.user || null;

  return <DashboardContent user={user} />;
}
