import { getSession } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { prisma } from "@/lib/prisma";

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
  const salesMetrics = await prisma.salesMetrics.findFirst({
      orderBy: { date: 'desc' }
  });
  
  // 3. Order Fulfillment (Manufacturing)
  const mfgMetrics = await prisma.manufacturingMetrics.findFirst({
      orderBy: { date: 'desc' }
  });

  // 4. Supply Chain
  const suppliersCount = await prisma.supplierMaster.count({ where: { isActive: true } });
  const scMetrics = await prisma.supplyChainMetrics.findFirst({
      orderBy: { date: 'desc' }
  });

  // 5. Support
  const internalSupportCount = await prisma.supportTicket.count({ where: { type: "INTERNAL", isClosed: false } });
  const externalSupportCount = await prisma.supportTicket.count({ where: { type: "EXTERNAL", isClosed: false } });

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
          quotation: salesMetrics?.quotesCount ?? 0,
          negotiation: salesMetrics?.negotiationCount ?? 0,
          orderWin: salesMetrics?.orderCount ?? 0,
          orderLoss: 0 // Waiting for Opportunity mapping
      },
      manufacturing: {
          onTrack: mfgMetrics?.projectOnTrack ?? 0,
          critical: mfgMetrics?.projectCritical ?? 0
      },
      supplyChain: {
          suppliers: suppliersCount ?? 0,
          credit: scMetrics ? (scMetrics.net15Terms + scMetrics.net30Terms + scMetrics.net60Terms + scMetrics.net90Terms) : 0
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
