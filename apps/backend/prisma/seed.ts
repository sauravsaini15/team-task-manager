import bcrypt from "bcryptjs";
import { PrismaClient, ProjectRole, TaskPriority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "sauravsaini678@gmail.com" },
    update: { name: "Saurav Kumar Saini", passwordHash },
    create: { name: "Saurav Kumar Saini", email: "sauravsaini678@gmail.com", passwordHash }
  });

  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: { name: "Morgan Member", email: "member@example.com", passwordHash }
  });

  const project = await prisma.project.create({
    data: {
      name: "Product Launch",
      description: "Interview demo workspace with realistic task states.",
      members: {
        create: [
          { userId: admin.id, role: ProjectRole.ADMIN },
          { userId: member.id, role: ProjectRole.MEMBER }
        ]
      }
    }
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Finalize onboarding flow",
        description: "Polish signup, login, and protected route states.",
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assigneeId: member.id
      },
      {
        title: "Prepare stakeholder demo",
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        projectId: project.id,
        assigneeId: admin.id
      }
    ]
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
