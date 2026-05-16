import { getSession } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardHome() {
  const session = await getSession();
  const user = session?.user || null;

  // 1. Finance Hub
  const targetAgg = await prisma.targetMaster.aggregate({
      _sum: { totalTarget: true }
  });
  const financeMetrics = await prisma.financeMetrics.findFirst({
      orderBy: { date: 'desc' }
  });
  
  // 2. Business Acquisition
  const opportunities = await prisma.opportunity.findMany({
      where: { isDelete: false },
      include: { status: true }
  });

  let quotation = 0;
  let negotiation = 0;
  let orderWin = 0;
  let orderLoss = 0;

  opportunities.forEach(opp => {
      const s = opp.status?.statusName?.toLowerCase() || '';
      if (s.includes('quotation')) quotation++;
      else if (s.includes('negotiation')) negotiation++;
      else if (s.includes('win')) orderWin++;
      else if (s.includes('loss')) orderLoss++;
      else if (s.includes('lead')) quotation++; // Defaulting unmapped Leads to quotation funnel for numbers if needed, or leave out. We will count Quotation specifically.
  });
  
  // 3. Order Fulfillment (Manufacturing)
  const orders = await prisma.order.findMany({
      where: { isClosed: false }
  });

  let mfgOnTrack = 0;
  let mfgCritical = 0;
  const now = new Date();

  orders.forEach(o => {
      if (o.targetDate && o.targetDate < now) mfgCritical++;
      else mfgOnTrack++;
  });

  // 4. Supply Chain
  const scInternalPending = await prisma.supplyRequest.count({ where: { type: { equals: "INTERNAL", mode: "insensitive" }, isClosed: false } });
  const scExternalPending = await prisma.supplyRequest.count({ where: { type: { equals: "EXTERNAL", mode: "insensitive" }, isClosed: false } });

  // 5. Support
  const internalSupportCount = await prisma.supportTicket.count({ where: { type: { equals: "INTERNAL", mode: "insensitive" }, isClosed: false } });
  const externalSupportCount = await prisma.supportTicket.count({ where: { type: { equals: "EXTERNAL", mode: "insensitive" }, isClosed: false } });

  // 6. HR Portal
  const hrMetrics = await prisma.hrMetrics.findFirst({
      orderBy: { date: 'desc' }
  });

  const dashboardData = {
      finance: {
          orders: "₹0.0Cr",
          target: `₹${((targetAgg._sum.totalTarget ?? 0) / 10000000).toFixed(1)}Cr`,
          revenue: `₹${((financeMetrics?.revenue ?? 0) / 10000000).toFixed(1)}Cr`,
          revenueTrend: "+0%"
      },
      salesFunnel: {
          quotation,
          negotiation,
          orderWin,
          orderLoss
      },
      manufacturing: {
          onTrack: mfgOnTrack,
          critical: mfgCritical
      },
      supplyChain: {
          internal: scInternalPending,
          external: scExternalPending
      },
      support: {
          internal: internalSupportCount ?? 0,
          external: externalSupportCount ?? 0
      },
      hr: {
          open: hrMetrics ? (hrMetrics.openPosLagging + hrMetrics.openPosOnTrack) : 0,
          hires: hrMetrics?.recruitedHired ?? 0
      },
      alerts: [] as { id: number, title: string, desc: string, type: string }[]
  };

  // Generate dynamic alerts based on database records
  if (!financeMetrics || financeMetrics.revenue === 0) {
      dashboardData.alerts.push({ id: 1, title: "Cash Flow Warning", desc: "Outflow exceeds inflow recently.", type: "critical" });
  }
  if (dashboardData.manufacturing.critical > 0) {
      dashboardData.alerts.push({ id: 2, title: "Orders Critical", desc: `${dashboardData.manufacturing.critical} projects are critically behind schedule.`, type: "critical" });
  }
  if (dashboardData.support.external > 20) {
      dashboardData.alerts.push({ id: 3, title: "High Support Load", desc: "External tickets are piling up.", type: "warning" });
  }
  if (dashboardData.alerts.length === 0) {
      dashboardData.alerts.push({ id: 4, title: "All Systems Normal", desc: "No critical alerts across modules.", type: "info" });
  }

  return <DashboardContent user={user} data={dashboardData} />;
}
