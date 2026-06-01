import { PrismaClient, Role, AssignmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const demoCompany = await prisma.company.upsert({
    where: { name: "Demo Company" },
    update: {},
    create: { name: "Demo Company" },
  });

  const adminEmail = "admin@safety.local";
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: "Global Admin",
      email: adminEmail,
      password: adminPassword,
      role: Role.ROLE_ADMIN,
      position: "System Administrator",
    },
  });

  const companyAdminEmail = "company.admin@demo.local";
  const companyAdminPassword = await bcrypt.hash("demo123", 10);

  await prisma.user.upsert({
    where: { email: companyAdminEmail },
    update: {},
    create: {
      fullName: "Demo Company Admin",
      email: companyAdminEmail,
      password: companyAdminPassword,
      role: Role.ROLE_COMPANY_ADMIN,
      position: "Company Administrator",
      companyId: demoCompany.id,
    },
  });

  // --- Ready-to-test worker flow ----------------------------------------
  // A project + team are required so the worker can belong to a team.
  let project = await prisma.project.findFirst({
    where: { name: "Demo Project", companyId: demoCompany.id },
  });
  if (!project) {
    project = await prisma.project.create({
      data: { name: "Demo Project", companyId: demoCompany.id },
    });
  }

  let team = await prisma.team.findFirst({
    where: { name: "Demo Team", projectId: project.id },
  });
  if (!team) {
    team = await prisma.team.create({
      data: { name: "Demo Team", projectId: project.id },
    });
  }

  const workerEmail = "worker@demo.local";
  const workerPassword = await bcrypt.hash("worker123", 10);
  const worker = await prisma.user.upsert({
    where: { email: workerEmail },
    update: { teamId: team.id, companyId: demoCompany.id },
    create: {
      fullName: "Demo Worker",
      email: workerEmail,
      password: workerPassword,
      role: Role.ROLE_USER,
      position: "Field Operative",
      companyId: demoCompany.id,
      teamId: team.id,
    },
  });

  // A guaranteed-playable, locally-bundled sample video (~10s).
  const sampleUrl = "/sample/safety-demo.mp4";
  let video = await prisma.video.findFirst({ where: { url: sampleUrl } });
  if (!video) {
    video = await prisma.video.create({
      data: {
        title: "Working at heights — fall protection",
        url: sampleUrl,
        duration: 10,
        createdById: admin.id,
        companyId: demoCompany.id,
      },
    });
  }

  let briefing = await prisma.briefing.findFirst({
    where: { title: "Site induction — heights" },
  });
  if (!briefing) {
    briefing = await prisma.briefing.create({
      data: {
        title: "Site induction — heights",
        description:
          "Mandatory induction covering fall-protection basics before working at heights on site.",
        createdById: admin.id,
        companyId: demoCompany.id,
        videos: { connect: { id: video.id } },
      },
    });
  } else {
    await prisma.briefing.update({
      where: { id: briefing.id },
      data: { videos: { connect: { id: video.id } } },
    });
  }

  const existingAssignment = await prisma.assignment.findFirst({
    where: { userId: worker.id, briefingId: briefing.id },
  });
  if (!existingAssignment) {
    await prisma.assignment.create({
      data: {
        userId: worker.id,
        briefingId: briefing.id,
        assignedAt: new Date(),
        status: AssignmentStatus.PENDING,
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  Demo company: ${demoCompany.name} (id=${demoCompany.id})`);
  console.log(`  Global admin: ${adminEmail} / admin123`);
  console.log(`  Company admin: ${companyAdminEmail} / demo123`);
  console.log(`  Worker:        ${workerEmail} / worker123`);
  console.log(`  Briefing "${briefing.title}" assigned to worker (PENDING)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
