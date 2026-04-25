import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, data, date, period, companyId, isTarget } = await request.json();

    try {
        if (isTarget) {
            if (!companyId) return NextResponse.json({ error: "Missing companyId for Target" }, { status: 400 });
            
            const existingTarget = await prisma.targetMaster.findUnique({
                where: {
                    companyId_category_financialYear: {
                        companyId,
                        category,
                        financialYear: date
                    }
                }
            });

            if (existingTarget) {
                const result = await prisma.targetMaster.update({
                    where: { id: existingTarget.id },
                    data: { ...data }
                });
                return NextResponse.json({ success: true, data: result });
            } else {
                const result = await prisma.targetMaster.create({
                    data: {
                        companyId,
                        category,
                        financialYear: date,
                        ...data
                    }
                });
                return NextResponse.json({ success: true, data: result });
            }
        }

        let model: any;
        let entityType = "";

        // Map category to Prisma Model
        switch (category) {
            case "finance":
                model = prisma.financeMetrics;
                entityType = "finance";
                break;
            case "sales":
                model = prisma.salesMetrics;
                entityType = "sales";
                break;
            case "manufacturing":
                model = prisma.manufacturingMetrics;
                entityType = "manufacturing";
                break;
            case "supplyChain":
                model = prisma.supplyChainMetrics;
                entityType = "supply-chain";
                break;
            case "support":
                model = prisma.supportMetrics;
                entityType = "support";
                break;
            case "hr":
                model = prisma.hrMetrics;
                entityType = "hr";
                break;
            default:
                return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        // 1. Fetch Previous Record for Audit Diff
        // We assume one record per period per date mostly, but unique constraints might vary.
        // For simplicity, we search by date/period or just create new if not found.
        // Ideally we should have a unique constraint on [period, date] but let's stick to simple ID or create logic.

        // Let's find if a record exists for this Period + Date close match or exact match
        // For now, we will just CREATE a new entry every time or UPDATE if an ID is provided?
        // The user asked for "Logs", so likely they want to edit EXISTING data or ADD new data.
        // Let's assume we are UPSERTING based on a unique key, or simpler: just create new for now if ID missing.
        // To make it robust: We will check if a record exists for this 'period' and 'date'

        const existingRecord = await model.findFirst({
            where: {
                period,
                date: new Date(date),
                ...(companyId ? { companyId } : {})
            }
        });

        let result;
        let action = "CREATE";
        let previousData = {};

        if (existingRecord) {
            action = "UPDATE";
            previousData = existingRecord;

            result = await model.update({
                where: { id: existingRecord.id },
                data: { ...data }
            });
        } else {
            result = await model.create({
                data: {
                    period,
                    date: new Date(date),
                    companyId: companyId || undefined,
                    ...data
                }
            });
        }

        // 2. Create Audit Log
        await prisma.auditLog.create({
            data: {
                entity: entityType, // entityType variable holds the string value, map it to 'entity' field
                entityId: result.id,
                action,
                userId: session.user.id || "unknown", // Fallback if ID generic
                userEmail: session.user.email,
                details: { ...data }
            }
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        console.error("Metrics Update Error:", error);
        return NextResponse.json({ error: "Failed to update metrics" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const period = searchParams.get("period"); // Optional filter
    const companyId = searchParams.get("companyId");
    const companiesStr = searchParams.get("companies");
    const isTarget = searchParams.get("isTarget") === 'true';
    console.log(`[API Metrics] GET Request - Category: ${category}, Period: ${period}, Company: ${companyId}, Companies: ${companiesStr}, Target mode: ${isTarget}`);

    try {
        if (isTarget) {
            if (!companyId && !companiesStr) return NextResponse.json({ error: "Missing company filters" }, { status: 400 });
            const targets = await prisma.targetMaster.findMany({
                where: { 
                    category: String(category), 
                    ...(companiesStr ? { companyId: { in: companiesStr.split(',') } } : { companyId: String(companyId) })
                },
                orderBy: { financialYear: 'desc' }
            });
            return NextResponse.json(targets);
        }

        if (category === "sales") {
            const oppWhere: any = { isDelete: false };
            if (companiesStr) {
                oppWhere.customer = { companyId: { in: companiesStr.split(',') } };
            } else if (companyId) {
                oppWhere.customer = { companyId: companyId };
            }

            const opps = await prisma.opportunity.findMany({
                where: oppWhere,
                include: { status: true }
            });

            const targets = await prisma.targetMaster.findMany({
                where: {
                    category: "sales",
                    ...(companiesStr ? { companyId: { in: companiesStr.split(',') } } : companyId ? { companyId } : {})
                }
            });
            
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const currentMonthName = monthNames[new Date().getMonth()];

            let monthlyTarget = 0;
            const annualTarget = targets.reduce((sum, t) => {
                monthlyTarget += (t as any)[currentMonthName] || 0;
                let yearSum = 0;
                for (const m of monthNames) {
                    yearSum += (t as any)[m] || 0;
                }
                return sum + yearSum + (t.totalTarget || 0);
            }, 0);

            let leadsCount = 0, rfqCount = 0, quotesCount = 0, negotiationCount = 0, orderCount = 0;
            let quotesValue = 0, negotiationValue = 0, winValue = 0, lossValue = 0;
            let monthlyAchieved = 0;

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            for (const opp of opps) {
                const sName = (opp.status?.statusName || '').toLowerCase();
                const v = opp.value || 0;
                const oppDate = new Date(opp.date || opp.createdAt);
                const isCurrentMonth = oppDate.getMonth() === currentMonth && oppDate.getFullYear() === currentYear;

                if (sName.includes('win') || sName.includes('order')) {
                    orderCount++;
                    winValue += v;
                    if (isCurrentMonth) monthlyAchieved += v;
                } else if (sName.includes('loss') || sName.includes('lost') || sName.includes('cancel')) {
                    lossValue += v;
                } else if (sName.includes('negotiation') || sName.includes('progress')) {
                    negotiationCount++;
                    negotiationValue += v;
                } else if (sName.includes('quot') || sName.includes('proposal')) {
                    quotesCount++;
                    quotesValue += v;
                } else if (sName.includes('rfq')) {
                    rfqCount++;
                } else {
                    // Everything else mapped to Lead
                    leadsCount++;
                }
            }

            const ordersYtdPct = annualTarget > 0 ? Math.round((winValue / annualTarget) * 100) : 0;
            const invoiceYtdPct = 0; // UNDEFINED LINKAGE: No standalone "Invoice" table in schema
            const monthlyAchievedPct = monthlyTarget > 0 ? Math.round((monthlyAchieved / monthlyTarget) * 100) : 0; 

            // Recent activities (Last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentHistories = await prisma.opportunityStatusHistory.findMany({
                where: { 
                    opportunity: oppWhere,
                    startDate: { gte: sevenDaysAgo }
                },
                orderBy: { startDate: 'desc' },
                take: 50,
                include: {
                    opportunity: { include: { customer: true } },
                    status: true
                }
            });

            const recentActivities = recentHistories.map(h => ({
                id: h.id,
                oppName: h.opportunity.opportunityName,
                customerName: h.opportunity.customer?.customerName || '-',
                value: h.opportunity.value,
                statusName: h.status?.statusName || 'Unknown',
                date: h.startDate,
            }));
            
            const liveSnapshot = {
                id: 'real-sales-data',
                date: new Date(),
                period: period || "Weekly",
                leadsCount,
                rfqCount,
                quotesCount,
                negotiationCount,
                orderCount,
                quotesValue,
                negotiationValue,
                winValue,
                lossValue,
                annualTarget,
                monthlyTarget,
                monthlyAchieved,
                monthlyAchievedPct,
                ordersYtdPct,
                invoiceYtdPct,
                recentActivities
            };

            return NextResponse.json([liveSnapshot]);
        }

        if (category === "supplyChain") {
            const companyWhere: any = {};
            if (companiesStr) {
                companyWhere.companyId = { in: companiesStr.split(',') };
            } else if (companyId) {
                companyWhere.companyId = companyId;
            }

            const suppliers = await prisma.supplierMaster.findMany({
                where: { ...companyWhere, isActive: true, isDelete: false },
                include: { paymentType: true }
            });

            const orders = await prisma.inventoryOrder.findMany({
                where: companyWhere,
                include: { supplier: true }
            });

            let totalSuppliers = suppliers.length;
            let totalShipments = orders.length;
            let inTransitShipments = 0;
            let outstandingPayments = 0;
            let inventoryValue = 0;

            const activeShipments: any[] = [];
            const supplierOrderAges: Record<number, Date> = {};
            const supplierValueMap: Record<number, number> = {};
            const supplierShipmentsMap: Record<number, number> = {};

            const termsMap: Record<string, number> = {
                "Advance": 0, "Net 15": 0, "Net 30": 0, "Net 60": 0, "Net 90+": 0
            };

            for (const sup of suppliers) {
                const pt = sup.paymentType?.paymentType?.toLowerCase() || '';
                if (pt.includes('advance')) termsMap["Advance"]++;
                else if (pt.includes('15')) termsMap["Net 15"]++;
                else if (pt.includes('30')) termsMap["Net 30"]++;
                else if (pt.includes('60')) termsMap["Net 60"]++;
                else if (pt.includes('90')) termsMap["Net 90+"]++;
                else termsMap["Net 30"]++;
            }

            for (const ord of orders) {
                const isReceived = ord.receiveStatus === 'Received' || ord.status === 'Received' || ord.status === 'Delivered';
                if (!isReceived) {
                    inTransitShipments++;
                    outstandingPayments += ord.total;
                    
                    activeShipments.push({
                        id: ord.orderNumber,
                        origin: ord.supplier?.supplierName || "Internal",
                        dest: "Hub",
                        status: ord.status || "In Transit",
                        eta: ord.expectedDelivery ? new Date(ord.expectedDelivery).toLocaleDateString() : "TBD",
                        rawDate: ord.date
                    });
                } else {
                    inventoryValue += ord.total;
                }

                if (isReceived) {
                    const rDate = ord.receivedOn ? new Date(ord.receivedOn) : new Date(ord.date);
                    if (!supplierOrderAges[ord.supplierSlno] || supplierOrderAges[ord.supplierSlno] < rDate) {
                        supplierOrderAges[ord.supplierSlno] = rDate;
                    }
                }

                supplierValueMap[ord.supplierSlno] = (supplierValueMap[ord.supplierSlno] || 0) + ord.total;
                supplierShipmentsMap[ord.supplierSlno] = (supplierShipmentsMap[ord.supplierSlno] || 0) + 1;
            }

            activeShipments.sort((a,b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

            const topSuppliersData = suppliers.map(s => ({
                name: s.supplierName,
                value: supplierValueMap[s.slno] || 0,
                shipments: supplierShipmentsMap[s.slno] || 0
            })).filter(s => s.value > 0 || s.shipments > 0).sort((a, b) => b.value - a.value).slice(0, 5);

            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            const inactiveSuppliers = [];
            for (const s of suppliers) {
                const lastDate = supplierOrderAges[s.slno];
                if (lastDate && lastDate < sixtyDaysAgo) {
                    const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    inactiveSuppliers.push({
                        name: s.supplierName,
                        days: diffDays,
                        lastDelivery: lastDate.toLocaleDateString()
                    });
                }
            }
            
            const neverDelivered = suppliers.filter(s => !supplierOrderAges[s.slno] && new Date(s.createdAt) < sixtyDaysAgo);
            for (const s of neverDelivered) {
                const diffTime = Math.abs(new Date().getTime() - new Date(s.createdAt).getTime());
                inactiveSuppliers.push({
                    name: s.supplierName,
                    days: Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
                    lastDelivery: "Never"
                });
            }

            inactiveSuppliers.sort((a, b) => b.days - a.days);

            const termsData = [
                { name: "Advance", value: termsMap["Advance"], color: "#f59e0b" },
                { name: "Net 15", value: termsMap["Net 15"], color: "#10b981" },
                { name: "Net 30", value: termsMap["Net 30"], color: "#3b82f6" },
                { name: "Net 60", value: termsMap["Net 60"], color: "#8b5cf6" },
                { name: "Net 90+", value: termsMap["Net 90+"], color: "#f43f5e" }
            ];

            const liveSnapshot = {
                id: 'real-sc-data',
                date: new Date(),
                period: period || "Weekly",
                totalSuppliers,
                totalShipments,
                inTransitShipments,
                outstandingPayments,
                inventoryValue,
                activeShipments: activeShipments.slice(0, 8),
                topSuppliersData,
                inactiveSuppliers: inactiveSuppliers.slice(0, 6),
                termsData,
                onTimeDelivery: 98
            };

            return NextResponse.json([liveSnapshot]);
        }
        
        if (category === "support") {
            const supportWhere: any = {};
            if (companiesStr) {
                supportWhere.companyId = { in: companiesStr.split(',') };
            } else if (companyId) {
                supportWhere.companyId = companyId;
            }

            const allTickets = await prisma.supportTicket.findMany({
                where: supportWhere,
                orderBy: { createdAt: 'desc' }
            });

            // Calculate metrics
            let totalTickets = allTickets.length;
            let openTickets = 0;
            let resolvedTickets = 0;
            
            let internalOpen = 0, externalOpen = 0;
            let internalTotal = 0, externalTotal = 0;

            let totalResolutionDays = 0;
            let resolvedCount = 0;
            let totalOpenDays = 0;

            const now = new Date();
            const activeTicketsList = [];

            for (const ticket of allTickets) {
                if (ticket.type === "INTERNAL") internalTotal++;
                else externalTotal++;

                if (ticket.status === "OPEN") {
                    openTickets++;
                    if (ticket.type === "INTERNAL") internalOpen++;
                    else externalOpen++;

                    // Calculate age of open tickets
                    const ageDays = Math.max(0, Math.ceil((now.getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
                    totalOpenDays += ageDays;

                    activeTicketsList.push({
                        id: ticket.ticketNo,
                        title: ticket.details || 'Untitled Ticket',
                        priority: "Pending", // Priority missing in schema
                        time: new Date(ticket.createdAt).toLocaleDateString(),
                        rawDate: ticket.createdAt,
                        age: ageDays
                    });
                } else {
                    resolvedTickets++;
                    if (ticket.actualDays) {
                        totalResolutionDays += ticket.actualDays;
                        resolvedCount++;
                    } else {
                         const age = Math.max(0, Math.ceil((new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
                         totalResolutionDays += age;
                         resolvedCount++;
                    }
                }
            }

            const resolutionTime = resolvedCount > 0 ? (totalResolutionDays / resolvedCount).toFixed(1) : "0";
            const avgTicketAge = openTickets > 0 ? (totalOpenDays / openTickets).toFixed(1) : "0";
            
            // Sort activeTickets by age descending (longest pending tickets)
            activeTicketsList.sort((a,b) => b.age - a.age);

            // Ticket Resolution Trend (Chart Data)
            const trendData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                
                const dayStart = new Date(d);
                dayStart.setHours(0,0,0,0);
                const dayEnd = new Date(d);
                dayEnd.setHours(23,59,59,999);

                const openedThatDay = allTickets.filter(t => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd).length;
                const resolvedThatDay = allTickets.filter(t => t.status !== "OPEN" && new Date(t.updatedAt) >= dayStart && new Date(t.updatedAt) <= dayEnd).length;

                trendData.push({
                    name: dateStr,
                    resolved: resolvedThatDay,
                    open: openedThatDay
                });
            }

            const liveSnapshot = {
                id: 'real-support-data',
                period: period || "Weekly",
                totalTickets,
                internalTotal,
                externalTotal,
                openTickets,
                internalOpen,
                externalOpen,
                resolvedTickets,
                resolutionTime,
                avgResponseTime: avgTicketAge,
                trendData,
                activeTickets: activeTicketsList.slice(0, 10)
            };

            return NextResponse.json([liveSnapshot]);
        }

        let model: any;
        switch (category) {
            case "finance": model = prisma.financeMetrics; break;
            case "sales": model = prisma.salesMetrics; break;
            case "manufacturing": model = prisma.manufacturingMetrics; break;
            case "supplyChain": model = prisma.supplyChainMetrics; break;
            case "support": model = prisma.supportMetrics; break;
            case "hr": model = prisma.hrMetrics; break;
            default: return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        console.log(`[API Metrics] Model resolved for ${category}`);

        const whereClause: any = {};
        if (period) whereClause.period = period;
        
        if (companiesStr) {
            whereClause.companyId = { in: companiesStr.split(',') };
        } else if (companyId) {
            whereClause.companyId = companyId;
        }
        
        let data = await model.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            take: 20
        });

        let totalFund = 0, totalUtilised = 0, totalAvailable = 0;
        if (category === "finance") {
            const fundWhere: any = {};
            if (companiesStr) {
                fundWhere.companyId = { in: companiesStr.split(',') };
            } else if (companyId) {
                fundWhere.companyId = companyId;
            }

            const funds = await prisma.financeFundValue.findMany({
                where: fundWhere,
            });

            for (const f of funds) {
                totalFund += (f.fundValue || 0);
                totalUtilised += (f.utilised || 0);
            }
            
            totalAvailable = totalFund - totalUtilised;

            if (data.length > 0) {
                data = data.map((item: any) => ({ ...item, totalFund, totalUtilised, totalAvailable }));
            }
        }

        if (category === "manufacturing") {
            const targets = await prisma.targetMaster.findMany({
                where: {
                    category: "manufacturing",
                    ...(companiesStr ? { companyId: { in: companiesStr.split(',') } } : companyId ? { companyId } : {})
                }
            });
            const annualTarget = targets.reduce((sum, t) => sum + t.totalTarget, 0);

            const activeStages = await prisma.stageMaster.findMany({
                where: {
                    isActive: true,
                    isDelete: false,
                    ...(companiesStr ? { companyId: { in: companiesStr.split(',') } } : companyId ? { companyId } : {})
                },
                orderBy: { order: 'asc' }
            });

            const activeOrders = await prisma.order.findMany({
                where: {
                    ...(companiesStr ? { opportunity: { customer: { companyId: { in: companiesStr.split(',') } } } } : companyId ? { opportunity: { customer: { companyId } } } : {})
                },
                include: { opportunity: true }
            });

            const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#06b6d4'];
            const stageData = activeStages.map((stage, idx) => {
                const count = activeOrders.filter(o => o.currentStageId === stage.slno).length;
                return {
                    name: stage.stageName,
                    value: count,
                    color: colors[idx % colors.length]
                };
            });

            let salesWinValue = 0;
            let salesOrderCount = activeOrders.length;
            for (const ord of activeOrders) {
                if (ord.orderValue !== null && ord.orderValue !== undefined) {
                    salesWinValue += ord.orderValue;
                } else {
                    salesWinValue += (ord.opportunity as any)?.value || 0;
                }
            }

            if (data.length > 0) {
                const groupedByDate: Record<string, any> = {};
                for (const row of data) {
                    const dKey = new Date(row.date).toISOString().split('T')[0];
                    if (!groupedByDate[dKey]) {
                         groupedByDate[dKey] = { ...row };
                    } else {
                         groupedByDate[dKey].orderValue = (groupedByDate[dKey].orderValue || 0) + (row.orderValue || 0);
                         groupedByDate[dKey].productionVolume = (groupedByDate[dKey].productionVolume || 0) + (row.productionVolume || 0);
                         groupedByDate[dKey].rfqNew = (groupedByDate[dKey].rfqNew || 0) + (row.rfqNew || 0);
                         groupedByDate[dKey].rfqStandard = (groupedByDate[dKey].rfqStandard || 0) + (row.rfqStandard || 0);
                         groupedByDate[dKey].rfqCustom = (groupedByDate[dKey].rfqCustom || 0) + (row.rfqCustom || 0);
                         groupedByDate[dKey].projectOnTrack = (groupedByDate[dKey].projectOnTrack || 0) + (row.projectOnTrack || 0);
                         groupedByDate[dKey].projectBehindSchedule = (groupedByDate[dKey].projectBehindSchedule || 0) + (row.projectBehindSchedule || 0);
                         groupedByDate[dKey].projectCritical = (groupedByDate[dKey].projectCritical || 0) + (row.projectCritical || 0);
                         groupedByDate[dKey].efficiency = ((groupedByDate[dKey].efficiency || 0) + (row.efficiency || 0)) / 2;
                    }
                }
                const aggregatedData = Object.values(groupedByDate).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                const latestDb = aggregatedData[0];
                const finalOrderValue = latestDb.orderValue && latestDb.orderValue > 0 ? latestDb.orderValue : salesWinValue;
                const finalOrderVolume = latestDb.productionVolume && latestDb.productionVolume > 0 ? latestDb.productionVolume : salesOrderCount;
                
                aggregatedData[0] = { ...aggregatedData[0], annualTarget, stageData, orderValue: finalOrderValue, productionVolume: finalOrderVolume };
                data = aggregatedData as any[];
            } else {
                model = null; // Forces mock data generation below
                data = [{ annualTarget, stageData, orderValue: salesWinValue, productionVolume: salesOrderCount } as any]; 
            }
        } else if (category === "hr") {
            if (data.length > 0) {
                const groupedByDate: Record<string, any> = {};
                for (const row of data) {
                    const dKey = new Date(row.date).toISOString().split('T')[0];
                    if (!groupedByDate[dKey]) {
                         groupedByDate[dKey] = { ...row };
                    } else {
                         groupedByDate[dKey].orgStrength = (groupedByDate[dKey].orgStrength || 0) + (row.orgStrength || 0);
                         groupedByDate[dKey].openPosOnTrack = (groupedByDate[dKey].openPosOnTrack || 0) + (row.openPosOnTrack || 0);
                         groupedByDate[dKey].openPosLagging = (groupedByDate[dKey].openPosLagging || 0) + (row.openPosLagging || 0);
                         groupedByDate[dKey].recruitedApplied = (groupedByDate[dKey].recruitedApplied || 0) + (row.recruitedApplied || 0);
                         groupedByDate[dKey].recruitedScreening = (groupedByDate[dKey].recruitedScreening || 0) + (row.recruitedScreening || 0);
                         groupedByDate[dKey].recruitedInterview = (groupedByDate[dKey].recruitedInterview || 0) + (row.recruitedInterview || 0);
                         groupedByDate[dKey].recruitedOffer = (groupedByDate[dKey].recruitedOffer || 0) + (row.recruitedOffer || 0);
                         groupedByDate[dKey].recruitedHired = (groupedByDate[dKey].recruitedHired || 0) + (row.recruitedHired || 0);
                    }
                }
                const aggregatedData = Object.values(groupedByDate).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                if (aggregatedData.length > 1) {
                    aggregatedData[0].prevOrgStrength = aggregatedData[1].orgStrength;
                }
                
                data = aggregatedData as any[];
            }
        }

        console.log(`[API Metrics] Fetched DB size: ${data?.length}`);

        // Fallback to Mock Data if DB is empty (For Demo)
        if (!data || data.length === 0) {
            if (category === "finance") {
                // No mock data. Return empty state zeroes with computed fund variables
                data = [{
                    id: 'live-fund',
                    period: period || "Weekly",
                    date: new Date(),
                    inflow: 0,
                    outflow: 0,
                    cashBalance: 0,
                    prevInflow: 0,
                    prevOutflow: 0,
                    prevCashBalance: 0,
                    arCurrent: 0,
                    ar0to30: 0,
                    ar30to60: 0,
                    ar60to90plus: 0,
                    apCurrent: 0,
                    ap0to30: 0,
                    ap30to60: 0,
                    ap60to90plus: 0,
                    totalFund, 
                    totalUtilised, 
                    totalAvailable
                } as any];
            } else if (category === "hr") {
                data = [{
                    id: 'live-hr',
                    period: period || "Weekly",
                    date: new Date(),
                    orgStrength: 0,
                    openPosOnTrack: 0,
                    openPosLagging: 0,
                    recruitedApplied: 0,
                    recruitedScreening: 0,
                    recruitedInterview: 0,
                    recruitedOffer: 0,
                    recruitedHired: 0
                } as any];
            } else {
                console.log(`[API Metrics] Falling back to mock data...`);
                data = getMockData(category, period || 'Weekly');
                console.log(`[API Metrics] Mock data generated size: ${data?.length}`);
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("GET Fetch failed from metrics:", error);
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const id = searchParams.get("id");

    if (!category || !id) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
        let model: any;
        switch (category) {
            case "finance": model = prisma.financeMetrics; break;
            case "sales": model = prisma.salesMetrics; break;
            case "manufacturing": model = prisma.manufacturingMetrics; break;
            case "supplyChain": model = prisma.supplyChainMetrics; break;
            case "support": model = prisma.supportMetrics; break;
            case "hr": model = prisma.hrMetrics; break;
            default: return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        await model.delete({ where: { id } });

        // Optional: Audit Log 
        await prisma.auditLog.create({
            data: {
                entity: category,
                entityId: id,
                action: "DELETE",
                userId: session.user.id || "unknown",
                userEmail: session.user.email,
                details: { deletedRecordId: id }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}

// Helper for Mock Data
function getMockData(category: string, period: string) {
    const today = new Date();
    const mockData = [];

    // Generate 7 periods of data natively scaling backward based on the view
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        if (period === "Annual") d.setFullYear(today.getFullYear() - i);
        else if (period === "Monthly") d.setMonth(today.getMonth() - i);
        else if (period === "Quarterly") d.setMonth(today.getMonth() - (i * 3));
        else d.setDate(today.getDate() - i);

        if (category === "finance") {
            mockData.push({
                id: `mock-fin-${i}`,
                date: d,
                period,
                profit: 150000 + Math.random() * 50000,
                revenue: 300000 + Math.random() * 100000,
                expenses: 120000 + Math.random() * 30000,
                inflow: 50000 + Math.random() * 20000,
                outflow: 30000 + Math.random() * 15000,
                // New Metrics
                ebitda: Math.floor(25000 + Math.random() * 8000),
                ebitdaMargin: Math.floor(15 + Math.random() * 10),
                cashBurn: Math.floor(5000 + Math.random() * 2000),
                cashRunway: Math.floor(12 + Math.random() * 6),
                arAging: {
                    days30: Math.floor(10000 + Math.random() * 5000),
                    days60: Math.floor(5000 + Math.random() * 2000),
                    days90: Math.floor(1000 + Math.random() * 500),
                },
                workingCapitalRatio: (1.2 + Math.random() * 0.8).toFixed(2),
                opex: Math.floor(40000 + Math.random() * 10000),
                capex: Math.floor(10000 + Math.random() * 5000),
            });
        }
        else if (category === "sales") {
            mockData.push({
                id: `mock-sales-${i}`,
                date: d,
                period,
                // Funnel (Count)
                leadsCount: Math.floor(200 + Math.random() * 50),
                rfqCount: Math.floor(120 + Math.random() * 30),
                quotesCount: Math.floor(80 + Math.random() * 20),
                negotiationCount: Math.floor(40 + Math.random() * 10),
                orderCount: Math.floor(25 + Math.random() * 5),
                // Funnel (Value)
                quotesValue: 8000000 + Math.random() * 500000,
                revenue: Math.floor(100000 + Math.random() * 50000),
                profit: Math.floor(20000 + Math.random() * 10000),
                expenses: Math.floor(50000 + Math.random() * 30000),
                // New Metrics
                cac: Math.floor(500 + Math.random() * 200),
                ltv: Math.floor(5000 + Math.random() * 2000),
                ltvCacRatio: (3 + Math.random() * 2).toFixed(1),
                leadConversionByChannel: {
                    linkedin: Math.floor(20 + Math.random() * 10),
                    email: Math.floor(15 + Math.random() * 5),
                    ads: Math.floor(10 + Math.random() * 5),
                },
                cycleTime: {
                    leadsToRfq: Math.floor(2 + Math.random() * 3),
                    rfqToQuote: Math.floor(1 + Math.random() * 2),
                    quoteToNegotiation: Math.floor(3 + Math.random() * 4),
                    negotiationToOrder: Math.floor(5 + Math.random() * 5)
                },
                annualTarget: 12000000,
                ordersYtdPct: Math.floor(50 + Math.random() * 40),
                invoiceYtdPct: Math.floor(40 + Math.random() * 50),
            });
        } else if (category === "manufacturing") {
            mockData.push({
                id: `mock-mfg-${i}`,
                date: d,
                period,
                productionVolume: Math.floor(500 + Math.random() * 200),
                efficiency: Math.floor(80 + Math.random() * 15),
                defects: Math.floor(0 + Math.random() * 5),
                // New Metrics
                oee: Math.floor(75 + Math.random() * 15),
                scrapRate: (1 + Math.random() * 4).toFixed(1),
                capacityUtilization: Math.floor(70 + Math.random() * 20),
                mtbf: Math.floor(200 + Math.random() * 100),
                rfqNew: Math.floor(5 + Math.random() * 5),
                rfqStandard: Math.floor(10 + Math.random() * 10),
                rfqCustom: Math.floor(2 + Math.random() * 3),
                projectOnTrack: Math.floor(10 + Math.random() * 5),
                projectDelayed: Math.floor(1 + Math.random() * 2),
                projectCritical: Math.floor(0 + Math.random() * 1),
                annualTarget: 8500000
            });
        } else if (category === "supplyChain") {
            mockData.push({
                id: `mock-sc-${i}`,
                date: d,
                period,
                inventoryValue: Math.floor(50000 + Math.random() * 20000),
                onTimeDelivery: Math.floor(85 + Math.random() * 10),
                activeSuppliers: Math.floor(10 + Math.random() * 5),
                // New Metrics
                inventoryTurnover: (4 + Math.random() * 4).toFixed(1),
                perfectOrderRate: Math.floor(85 + Math.random() * 10),
                dsi: Math.floor(30 + Math.random() * 20),
                supplierRiskScore: Math.floor(10 + Math.random() * 80),
                cashTerms: Math.floor(5 + Math.random() * 5),
                net15Terms: Math.floor(10 + Math.random() * 5),
                net30Terms: Math.floor(20 + Math.random() * 5),
                net60Terms: Math.floor(5 + Math.random() * 2),
                domesticSource: Math.floor(60 + Math.random() * 10),
                intlSource: Math.floor(30 + Math.random() * 10)
            });
        } else if (category === "hr") {
            mockData.push({
                id: `mock-hr-${i}`,
                date: d,
                period,
                recruitedApplied: Math.floor(50 + Math.random() * 20),
                recruitedScreening: Math.floor(30 + Math.random() * 10),
                recruitedInterview: Math.floor(15 + Math.random() * 5),
                recruitedOffer: Math.floor(5 + Math.random() * 3),
                recruitedHired: Math.floor(2 + Math.random() * 2),
                // New Metrics
                enps: Math.floor(10 + Math.random() * 60), // -100 to +100
                timeToFill: Math.floor(20 + Math.random() * 25), // Days
                trainingRoi: Math.floor(150 + Math.random() * 200), // %
                diversity: {
                    female: Math.floor(30 + Math.random() * 20), // %
                    male: Math.floor(30 + Math.random() * 20), // %
                    other: Math.floor(1 + Math.random() * 5), // %
                }
            });
        } else if (category === "support") {
            mockData.push({
                id: `mock-support-${i}`,
                date: d,
                period,
                openTickets: Math.floor(10 + Math.random() * 5),
                resolvedTickets: Math.floor(40 + Math.random() * 10),
                totalTickets: Math.floor(60 + Math.random() * 10),
                // New Metrics
                fcr: Math.floor(60 + Math.random() * 25),
                aht: Math.floor(10 + Math.random() * 15),
                slaBreachRate: (2 + Math.random() * 8).toFixed(1),
                nps: Math.floor(30 + Math.random() * 50),
            });
        }
    }
    return mockData;
}
