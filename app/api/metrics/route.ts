import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, data, date, period } = await request.json();

    try {
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
                date: new Date(date)
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

        const whereClause = period ? { period } : {};
        let data = await model.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            take: 20
        });

        // Fallback to Mock Data if DB is empty (For Demo)
        if (!data || data.length === 0) {
            data = getMockData(category, period || 'Monthly');
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

// Helper for Mock Data
function getMockData(category: string, period: string) {
    const today = new Date();
    const mockData = [];

    // Generate 7 days/periods of data
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

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
                ordersYtd: Math.floor(5000000 + Math.random() * 1000000),
                invoiceYtd: Math.floor(4000000 + Math.random() * 500000),
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
                projectCritical: Math.floor(0 + Math.random() * 1)
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
