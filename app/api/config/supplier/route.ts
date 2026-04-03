import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const companyId = url.searchParams.get("companyId");

        const data = await prisma.supplierMaster.findMany({
            where: {
                isDelete: false,
                ...(companyId ? { companyId } : {})
            },
            include: { company: true, 
                paymentType: true,
                categories: true,
                contacts: true,
                addresses: true
            },
            orderBy: { slno: 'desc' }
        });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();

        // Extract related lists
        const { categories = [], contacts = [], addresses = [], ...mainData } = body;

        const data = {
            supplierName: mainData.supplierName,
            remarks: mainData.remarks || null,
            usb: mainData.usb || null,
            isActive: mainData.isActive ?? true,
            paymentTypeId: mainData.paymentTypeId || null,
            companyId: mainData.companyId || null,
        };

        const categoriesConnect = categories.map((c: number) => ({ slno: c }));

        if (body.slno) {
            const updated = await prisma.supplierMaster.update({
                where: { slno: body.slno },
                data: {
                    ...data,
                    updatedBy: session.user.username || session.user.email,
                    categories: { set: categoriesConnect },
                    contacts: {
                        deleteMany: {},
                        create: contacts.map((c: any) => ({
                            contactPerson: c.contactPerson,
                            contactEmail: c.contactEmail,
                            contactNumber: c.contactNumber
                        }))
                    },
                    addresses: {
                        deleteMany: {},
                        create: addresses.map((a: any) => ({
                            addressName: a.addressName,
                            address: a.address
                        }))
                    }
                },
                include: { paymentType: true, categories: true, contacts: true, addresses: true }
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.supplierMaster.create({
                data: {
                    ...data,
                    createdBy: session.user.username || session.user.email,
                    updatedBy: session.user.username || session.user.email,
                    categories: { connect: categoriesConnect },
                    contacts: {
                        create: contacts.map((c: any) => ({
                            contactPerson: c.contactPerson,
                            contactEmail: c.contactEmail,
                            contactNumber: c.contactNumber
                        }))
                    },
                    addresses: {
                        create: addresses.map((a: any) => ({
                            addressName: a.addressName,
                            address: a.address
                        }))
                    }
                },
                include: { paymentType: true, categories: true, contacts: true, addresses: true }
            });
            return NextResponse.json(created);
        }
    } catch (error: any) {
        console.error(error)
        if (error.code === 'P2002') return NextResponse.json({ error: "Supplier Name must be unique" }, { status: 400 });
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const url = new URL(request.url);
        const slno = url.searchParams.get("slno");
        if (!slno) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const deleted = await prisma.supplierMaster.update({
            where: { slno: parseInt(slno) },
            data: {
                isDelete: true,
                updatedBy: session.user.username || session.user.email,
            }
        });
        return NextResponse.json(deleted);
    } catch (error) {
        return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
    }
}
