const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const projects = await p.project.deleteMany();
  const company = await p.companyData.deleteMany();
  const studios = await p.studio.deleteMany();
  console.log(`Удалено: ${studios.count} студий, ${projects.count} проектов, ${company.count} companyData`);
  await p.$disconnect();
}

main().catch(console.error);
