import { PrismaClient, Role, AssignmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { name: "Acme Construction" },
    update: {},
    create: { name: "Acme Construction" },
  });

  // Project + team
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: { name: "Lisbon Bridge Refit", companyId: company.id },
    create: { name: "Lisbon Bridge Refit", companyId: company.id },
  });

  const team = await prisma.team.upsert({
    where: { id: 1 },
    update: { name: "Night Shift / Tower A", projectId: project.id },
    create: { name: "Night Shift / Tower A", projectId: project.id },
  });

  // Company admin (already from main seed)
  const companyAdmin = await prisma.user.findUnique({
    where: { email: "company.admin@demo.local" },
  });

  // Worker users
  const workers = [
    { fullName: "Carla Mendes", email: "carla@demo.local", position: "Site Engineer" },
    { fullName: "Miguel Costa", email: "miguel@demo.local", position: "Rigger" },
    { fullName: "Sofia Almeida", email: "sofia@demo.local", position: "Safety Officer" },
  ];

  const hashed = await bcrypt.hash("worker123", 10);
  const createdWorkers = [];
  for (const w of workers) {
    const u = await prisma.user.upsert({
      where: { email: w.email },
      update: {},
      create: {
        fullName: w.fullName,
        email: w.email,
        password: hashed,
        role: Role.ROLE_USER,
        position: w.position,
        companyId: company.id,
        teamId: team.id,
      },
    });
    createdWorkers.push(u);
  }

  // Videos — use public-domain test videos so the player can actually play them
  const videosData = [
    {
      title: "Working at heights — fall arrest essentials",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: 30,
      riskCategory: "1.1", // Falls from height
    },
    {
      title: "Safe lifting & material handling",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      duration: 45,
      riskCategory: "6.1", // Overloads & overexertion
    },
    {
      title: "PPE inspection routine",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      duration: 15,
      riskCategory: "1.5", // Falling objects
    },
  ];

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@safety.local" } });
  if (!adminUser) throw new Error("Missing global admin from base seed");

  const createdVideos = [];
  for (const v of videosData) {
    const existing = await prisma.video.findFirst({ where: { title: v.title } });
    const video = existing
      ? await prisma.video.update({
          where: { id: existing.id },
          data: { url: v.url, duration: v.duration, riskCategory: v.riskCategory, companyId: company.id },
        })
      : await prisma.video.create({
          data: { ...v, createdById: adminUser.id, companyId: company.id },
        });
    createdVideos.push(video);
  }

  // Briefings
  const induction = await prisma.briefing.findFirst({
    where: { title: "Site induction — North entry gate" },
  });
  const briefing1 = induction
    ? await prisma.briefing.update({
        where: { id: induction.id },
        data: {
          description: "Mandatory induction for new arrivals to the North entry gate. Covers PPE, height work and lifting safety basics.",
          videos: { set: createdVideos.map((v) => ({ id: v.id })) },
          companyId: company.id,
        },
      })
    : await prisma.briefing.create({
        data: {
          title: "Site induction — North entry gate",
          description:
            "Mandatory induction for new arrivals to the North entry gate. Covers PPE, height work and lifting safety basics.",
          createdById: adminUser.id,
          companyId: company.id,
          videos: { connect: createdVideos.map((v) => ({ id: v.id })) },
        },
      });

  const refresher = await prisma.briefing.findFirst({
    where: { title: "Q1 safety refresher — Tower works" },
  });
  const briefing2 = refresher
    ? await prisma.briefing.update({
        where: { id: refresher.id },
        data: {
          description: "Quarterly refresher focused on harness inspection and rigging procedures for high-altitude tower work.",
          videos: { set: [createdVideos[0], createdVideos[1]].map((v) => ({ id: v.id })) },
        },
      })
    : await prisma.briefing.create({
        data: {
          title: "Q1 safety refresher — Tower works",
          description:
            "Quarterly refresher focused on harness inspection and rigging procedures for high-altitude tower work.",
          createdById: adminUser.id,
          companyId: company.id,
          videos: { connect: [createdVideos[0], createdVideos[1]].map((v) => ({ id: v.id })) },
        },
      });

  // Team assignment for briefing1
  const now = new Date();
  await prisma.teamAssignment.upsert({
    where: { teamId_briefingId: { teamId: team.id, briefingId: briefing1.id } },
    update: { assignedAt: now, assignedById: companyAdmin?.id ?? adminUser.id },
    create: {
      teamId: team.id,
      briefingId: briefing1.id,
      assignedById: companyAdmin?.id ?? adminUser.id,
      assignedAt: now,
    },
  });
  for (const w of createdWorkers) {
    const existing = await prisma.assignment.findFirst({
      where: { userId: w.id, briefingId: briefing1.id },
    });
    if (!existing) {
      await prisma.assignment.create({
        data: {
          userId: w.id,
          briefingId: briefing1.id,
          assignedAt: now,
          status: AssignmentStatus.PENDING,
        },
      });
    }
  }

  // Individual assignment for briefing2 to Carla only
  const carla = createdWorkers[0];
  const existing2 = await prisma.assignment.findFirst({
    where: { userId: carla.id, briefingId: briefing2.id },
  });
  if (!existing2) {
    await prisma.assignment.create({
      data: {
        userId: carla.id,
        briefingId: briefing2.id,
        assignedAt: now,
        status: AssignmentStatus.PENDING,
      },
    });
  }

  console.log("Demo seed complete:");
  console.log("  Company:", company.name);
  console.log("  Project / Team:", project.name, "/", team.name);
  console.log("  Workers (password: worker123):");
  for (const w of createdWorkers) console.log("   -", w.email);
  console.log("  Videos:", createdVideos.length, "  Briefings: 2");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
