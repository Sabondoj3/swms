import { prisma } from "./prisma";

export async function generateReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SWMS-${year}-`;
  const last = await prisma.wasteReport.findFirst({ where: { reportNumber: { startsWith: prefix } }, orderBy: { reportNumber: "desc" } });
  let next = 1;
  if (last) {
    const n = parseInt(last.reportNumber.slice(prefix.length), 10);
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(6, "0")}`;
}
