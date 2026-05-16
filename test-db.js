const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Support Types:', await prisma.supportTicket.findMany({ select: { type: true }, distinct: ['type'] }));
  console.log('Support tickets INTERNAL open:', await prisma.supportTicket.count({ where: { type: 'INTERNAL', isClosed: false } }));
  console.log('Support tickets EXTERNAL open:', await prisma.supportTicket.count({ where: { type: 'EXTERNAL', isClosed: false } }));
  console.log('Statuses:', await prisma.statusMaster.findMany());
}
main().catch(console.error).finally(() => prisma.$disconnect());
