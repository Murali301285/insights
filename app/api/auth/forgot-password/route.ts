import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getResetPasswordTemplate } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            // Return success even if user doesn't exist for security reasons (prevent email enumeration)
            return NextResponse.json({ success: true });
        }

        // Generate a random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const html = getResetPasswordTemplate(user.profileName || user.username || 'User', resetLink);

        await sendEmail({
            to: email,
            subject: "InSight ERP - Password Reset Request",
            html
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
