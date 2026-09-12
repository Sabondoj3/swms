import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding SWMS...");

  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Greenfield University Campus",
      type: "UNIVERSITY",
      address: "1 University Avenue, Greenfield",
      latitude: -17.824858,
      longitude: 31.053028,
    },
  });

  const categories = [
    { slug: "plastic", name: "Plastic", description: "PET bottles, packaging" },
    { slug: "paper", name: "Paper", description: "Paper, cardboard" },
    { slug: "organic", name: "Food / Organic", description: "Food scraps, garden waste" },
    { slug: "metal", name: "Metal", description: "Cans, scrap metal" },
    { slug: "glass", name: "Glass", description: "Bottles, jars" },
    { slug: "e-waste", name: "Electronic waste", description: "Batteries, devices" },
    { slug: "mixed", name: "Mixed waste", description: "Unsorted waste" },
    { slug: "hazardous", name: "Hazardous waste", description: "Chemicals, medical" },
    { slug: "other", name: "Other", description: "Other waste" },
  ];
  for (const c of categories) {
    await prisma.wasteCategory.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const badges = [
    { code: "ECO_REPORTER", name: "Eco Reporter", description: "First verified report", pointsRequired: 10 },
    { code: "GREEN_CHAMPION", name: "Green Champion", description: "5 resolved reports", pointsRequired: 50 },
    { code: "COMMUNITY_PROTECTOR", name: "Community Protector", description: "15 resolved reports", pointsRequired: 150 },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { code: b.code }, update: {}, create: b });
  }

  async function ensureUser(email: string, fullName: string, role: "PUBLIC" | "COLLECTOR" | "ADMIN" | "SUPER_ADMIN", password: string, extra: Record<string, unknown> = {}) {
    const passwordHash = await hash(password);
    return prisma.user.upsert({
      where: { email },
      update: { fullName, role, passwordHash, isActive: true, ...extra },
      create: { email, fullName, role, passwordHash, phone: "+263700000000", institution: "Greenfield University", ...extra } as never,
    });
  }

  const superAdmin = await ensureUser("admin@swms.local", "Super Admin", "SUPER_ADMIN", "Admin123!");
  const admin2 = await ensureUser("ops@swms.local", "Ops Manager", "ADMIN", "Admin123!");
  const collector1 = await ensureUser("collector@swms.local", "Tendai Moyo", "COLLECTOR", "Collector123!", { phone: "+263711111111" });
  const collector2 = await ensureUser("collector2@swms.local", "Rudo Chikafu", "COLLECTOR", "Collector123!");
  const collector3 = await ensureUser("collector3@swms.local", "Farai Dube", "COLLECTOR", "Collector123!");
  const student = await ensureUser("student@swms.local", "Tatenda Student", "PUBLIC", "Student123!", { studentId: "RGU-2024-001" });

  const extraNames = ["Anesu Banda", "Chipo Ncube", "Kudakwashe Sithole", "Nyasha Zhou", "Tawanda Gumbo", "Rutendo Marufu"];
  const extraUsers = [];
  for (let i = 0; i < extraNames.length; i++) {
    extraUsers.push(await ensureUser(`user${i + 1}@swms.local`, extraNames[i], "PUBLIC", "Student123!", { studentId: `RGU-2024-00${i + 2}` }));
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pointsData = [
    { code: "RGU-CAMPUS-BIN-001", name: "Library Main Entrance", address: "Library, Greenfield University", latitude: -17.824, longitude: 31.053, binType: "General", capacity: 240 },
    { code: "RGU-CAMPUS-BIN-002", name: "Student Union Hall", address: "Student Union, Greenfield University", latitude: -17.8255, longitude: 31.0545, binType: "Recyclable", capacity: 360 },
    { code: "RGU-CAMPUS-BIN-003", name: "Science Block Courtyard", address: "Science Block", latitude: -17.823, longitude: 31.052, binType: "General", capacity: 240 },
    { code: "RGU-CAMPUS-BIN-004", name: "Hostel A Gate", address: "Hostel A", latitude: -17.826, longitude: 31.055, binType: "Organic", capacity: 120 },
    { code: "RGU-CAMPUS-BIN-005", name: "Hostel B Gate", address: "Hostel B", latitude: -17.827, longitude: 31.056, binType: "General", capacity: 240 },
    { code: "RGU-CAMPUS-BIN-006", name: "Cafeteria Rear", address: "Cafeteria", latitude: -17.8225, longitude: 31.051, binType: "Organic", capacity: 360 },
    { code: "RGU-CAMPUS-BIN-007", name: "Sports Field Entrance", address: "Sports Complex", latitude: -17.828, longitude: 31.05, binType: "General", capacity: 240 },
    { code: "RGU-CAMPUS-BIN-008", name: "Admin Block Parking", address: "Admin Block", latitude: -17.821, longitude: 31.054, binType: "Recyclable", capacity: 240 },
    { code: "RGU-CAMPUS-BIN-009", name: "Engineering Workshop", address: "Engineering Block", latitude: -17.829, longitude: 31.057, binType: "E-Waste", capacity: 120 },
    { code: "RGU-CAMPUS-BIN-010", name: "Main Gate Bus Stop", address: "Main Gate", latitude: -17.83, longitude: 31.058, binType: "General", capacity: 360 },
  ];
  const points = [];
  for (const p of pointsData) {
    points.push(
      await prisma.collectionPoint.upsert({
        where: { code: p.code },
        update: { ...p, organizationId: org.id, qrPayload: `${baseUrl}/report?collectionPoint=${p.code}`, status: "ACTIVE" as never },
        create: { ...p, organizationId: org.id, qrPayload: `${baseUrl}/report?collectionPoint=${p.code}` } as never,
      })
    );
  }

  const wasteCats = ["PLASTIC", "PAPER", "FOOD_ORGANIC", "MIXED", "METAL", "GLASS"] as const;
  const problems = ["BIN_OVERFLOWING", "SCATTERED", "ILLEGAL_DUMPING", "BIN_DAMAGED", "MISSED_COLLECTION"] as const;
  const statuses = ["SUBMITTED", "VERIFIED", "ASSIGNED", "COLLECTED", "COMPLETED"] as const;
  const reporters = [student, ...extraUsers];

  // Clear old demo reports to keep seed idempotent-ish (keep if exists)
  const existingCount = await prisma.wasteReport.count();
  if (existingCount < 20) {
    for (let i = 0; i < 22; i++) {
      const reporter = reporters[i % reporters.length];
      const pt = points[i % points.length];
      const num = `SWMS-2026-${String(i + 1).padStart(6, "0")}`;
      const exists = await prisma.wasteReport.findUnique({ where: { reportNumber: num } });
      if (exists) continue;
      const status = statuses[i % statuses.length] as never;
      const report = await prisma.wasteReport.create({
        data: {
          reportNumber: num,
          reporterId: reporter.id,
          collectionPointId: pt.id,
          latitude: pt.latitude + (Math.random() - 0.5) * 0.002,
          longitude: pt.longitude + (Math.random() - 0.5) * 0.002,
          address: pt.address,
          wasteCategory: wasteCats[i % wasteCats.length] as never,
          problemType: problems[i % problems.length] as never,
          description: `Demo report ${i + 1}: bin needs attention near ${pt.name}.`,
          priority: (i % 7 === 0 ? "CRITICAL" : i % 3 === 0 ? "HIGH" : i % 2 === 0 ? "MEDIUM" : "LOW") as never,
          status,
          images: { create: [{ imageUrl: "/placeholder-waste.jpg", type: "BEFORE" as never }] },
          history: { create: [{ newStatus: "SUBMITTED" as never, comment: "Report submitted" }] },
        },
      });
      if (["ASSIGNED", "COLLECTED", "COMPLETED", "VERIFIED"].includes(status as string)) {
        const collector = [collector1, collector2, collector3][i % 3];
        await prisma.collectorAssignment.create({
          data: { reportId: report.id, collectorId: collector.id, assignedBy: superAdmin.id, status: "ASSIGNED" as never, notes: "Demo assignment" },
        });
        await prisma.notification.create({
          data: { userId: collector.id, title: "New assignment", message: `You were assigned ${num}`, type: "NEW_ASSIGNMENT" as never, reportId: report.id, link: `/collector` },
        });
      }
      await prisma.notification.create({
        data: { userId: reporter.id, title: "Report submitted", message: `${num} received`, type: "REPORT_SUBMITTED" as never, reportId: report.id, link: `/reports/${report.id}` },
      });
    }
  }

  const posts = [
    { title: "How to Sort Plastic for Recycling", slug: "sort-plastic-recycling", category: "Recycling", excerpt: "Rinse, sort by type, and drop at recyclable bins.", content: "Plastic recycling starts with rinsing containers...\n\n1. Rinse bottles\n2. Remove caps\n3. Sort by resin code\n4. Drop at green recyclable bins on campus." },
    { title: "The Danger of Plastic Pollution", slug: "plastic-pollution", category: "Plastic pollution", excerpt: "Why single-use plastics harm waterways.", content: "Single-use plastics break into microplastics...\n\nCarry a reusable bottle, say no to plastic bags, and report litter with SWMS." },
    { title: "Composting Organic Waste", slug: "composting-organic", category: "Organic waste", excerpt: "Turn food scraps into compost.", content: "Organic waste in landfills produces methane...\n\nSeparate food waste, use brown bins, and compost where available." },
    { title: "Safely Disposing E-Waste", slug: "e-waste-disposal", category: "Electronic waste", excerpt: "Batteries and devices need special handling.", content: "E-waste contains lead and lithium...\n\nNever burn electronics. Use the E-Waste bin at Engineering Workshop (RGU-CAMPUS-BIN-009)." },
    { title: "Proper Waste Disposal on Campus", slug: "proper-disposal", category: "Proper waste disposal", excerpt: "Which bin for which waste.", content: "Green bins: recyclables. Brown: organics. Grey: general.\n\nIf a bin is full, report it in SWMS instead of dumping beside it." },
  ];
  for (const p of posts) {
    await prisma.educationalPost.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, authorId: superAdmin.id } });
  }

  console.log("Seed done.");
  console.log("Logins: admin@swms.local / Admin123! | collector@swms.local / Collector123! | student@swms.local / Student123!");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
