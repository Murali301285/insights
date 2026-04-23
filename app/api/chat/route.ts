import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { prisma } from '@/lib/prisma';
import { getSession } from "@/lib/auth";
import pdfParse from 'pdf-parse';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "fake-key-for-build",
});

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const body = await req.json();
        const { messages, categoryContext, action, excelPayload, docId } = body;

        let pdfBase64 = null;
        if (docId) {
            const vaultDoc = await prisma.vaultDocument.findUnique({ select: { fileData: true }, where: { id: docId } });
            if (vaultDoc) pdfBase64 = vaultDoc.fileData;
        }

        // Action: Revoke System
        if (action === 'REVOKE') {
            const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const lowerBound = sixHoursAgo > startOfDay ? sixHoursAgo : startOfDay;

            const categorySearchStr = categoryContext ? categoryContext : 'Metrics';

            const lastLog = await prisma.auditLog.findFirst({
                where: {
                    userId: session.user.id,
                    action: 'CREATE',
                    entity: { contains: categorySearchStr, mode: 'insensitive' },
                    createdAt: { gte: lowerBound }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (!lastLog) {
                return NextResponse.json({ success: false, message: 'No revocable transactions found in the last 6 hours for today matching this category.' });
            }

            const entityArray = lastLog.entity.toLowerCase();
            let model: any = null;
            if (entityArray.includes('sales')) model = prisma.salesMetrics;
            else if (entityArray.includes('finance')) model = prisma.financeMetrics;
            else if (entityArray.includes('manufacturing')) model = prisma.manufacturingMetrics;
            else if (entityArray.includes('support')) model = prisma.supportMetrics;
            else if (entityArray.includes('hr')) model = prisma.hrMetrics;

            if (model && lastLog.entityId) {
                await model.delete({ where: { id: lastLog.entityId } });
                await prisma.auditLog.delete({ where: { id: lastLog.id } });
                return NextResponse.json({ success: true, message: 'Last transaction successfully revoked.' });
            }
            return NextResponse.json({ success: false, message: 'Could not resolve the entity for revocation internally.' });
        }

        // AI Chat Integration
        const lastUserMessage = messages[messages.length - 1]?.content || "";
        const blockedKeywords = ['delete from', 'drop table', 'truncate'];
        const isDeleteIntent = /delete.*record|delete.*entry|remove.*data/.test(lastUserMessage.toLowerCase());

        if (isDeleteIntent || blockedKeywords.some(kw => lastUserMessage.toLowerCase().includes(kw))) {
             return NextResponse.json({
                 content: "Destructive actions like deleting records are explicitly blocked in this chat interface. To adjust inputs, please use the dashboard UI or the 'Revoke Error' command if you recently uploaded data.",
                 role: "assistant"
             });
        }

        const SYSTEM_PROMPT = `You are the InSight Data Operations AI.
You help map Excel uploads and provide information.
If the user hands you Excel data (in JSON array format), evaluate it against expected dashboard fields.
  - Finance: inflow, outflow, balance, arCurrent, apCurrent, etc.
  - HR: orgStrength, openPosOnTrack, openPosLagging, recruitedHired.
  - Sales: targets per month.
If it is missing required fields, ask them to clarify.
If the data looks perfectly mappable to insert, you MUST output a JSON block at the very end of your response formatted EXACTLY like this:
\`\`\`json
{
  "validationStatus": "READY",
  "category": "finance",
  "mappedData": { "inflow": 1000, "outflow": 500 }
}
\`\`\`
In the standard response, do NOT execute deletions or modifications yourself.`;

        const priorUserLogs = messages.map((m: any) => ({ role: m.role, content: m.content }));
        
        // Grab the last message to append attachments into, to avoid consecutive user roles which LLaMA models reject.
        let dynamicUserContent = "";
        
        if (priorUserLogs.length > 0 && priorUserLogs[priorUserLogs.length - 1].role === 'user') {
            dynamicUserContent = priorUserLogs.pop().content;
        }

        if (excelPayload) {
             dynamicUserContent = `[SYSTEM ATTACHMENT]: Here is the parsed Excel data: ${JSON.stringify(excelPayload).substring(0, 15000)}. Validate against schema. Output JSON if fully ready.\n\nUser Request: ${dynamicUserContent}`;
        } else if (pdfBase64) {
             try {
                 const base64Data = pdfBase64.split(',')[1] || pdfBase64;
                 const pdfBuffer = Buffer.from(base64Data, 'base64');
                 const data = await pdfParse(pdfBuffer);
                 const truncatedText = data.text ? data.text.substring(0, 24000) : "";
                 dynamicUserContent = `[SYSTEM PDF ATTACHMENT EXTRACTED TEXT]:\n\n${truncatedText}\n\n---\nThe user's request is based on the above document text. Do not mention that you were given extracted text directly.\n\nUser Request: ${dynamicUserContent}`;
             } catch (e: any) {
                 console.error("PDF Parse error", e);
                 dynamicUserContent = `[SYSTEM WARNING]: Failed to extract text from the PDF file. Error: ${e.message}\n\nUser Request: ${dynamicUserContent}`;
             }
        }

        const groqMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...priorUserLogs,
        ];
        
        if (dynamicUserContent) {
            groqMessages.push({ role: 'user', content: dynamicUserContent });
        }

        // Only call Groq if we really want a chat response
        if (!process.env.GROQ_API_KEY) {
             return NextResponse.json({ content: "Please configure GROQ_API_KEY in the `.env` file first.", role: "assistant" });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: groqMessages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 1024,
        });

        const replyString = chatCompletion.choices[0]?.message?.content || "";
        
        let validationPayload = null;
        if (replyString.includes('```json') && replyString.includes('validationStatus')) {
            try {
                const match = replyString.match(/```json\n([\s\S]*?)\n```/);
                if (match) {
                    validationPayload = JSON.parse(match[1]);
                }
            } catch (e) {
                console.error("JSON parse failed", e);
            }
        }

        return NextResponse.json({ content: replyString, validationPayload, role: "assistant" });

    } catch (error: any) {
        console.error("Chat API Error:", error.stack);
        return NextResponse.json({ error: `Failed to process chat: ${error.message}` }, { status: 500 });
    }
}
