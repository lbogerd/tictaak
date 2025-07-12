import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

async function main() {
  // Ensure at least one category exists
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Test Category" },
    });
  }

  // Seed immediate task
  await prisma.task.create({
    data: {
      title: "Immediate Task Example",
      categoryId: category.id,
      taskType: "IMMEDIATE",
      isRecurring: false,
    },
  });

  // Seed recurring task
  await prisma.task.create({
    data: {
      title: "Recurring Task Example",
      categoryId: category.id,
      taskType: "RECURRING",
      isRecurring: true,
      recurringType: "weekly",
      recurringInterval: 1,
      recurringDays: JSON.stringify([1, 3, 5]), // Mon, Wed, Fri
      nextPrintDate: DateTime.now().plus({ days: 1 }).toJSDate(), // tomorrow
      isActive: true,
    },
  });

  // Seed scheduled (one-off) task
  await prisma.task.create({
    data: {
      title: "Scheduled Task Example",
      categoryId: category.id,
      taskType: "SCHEDULED",
      isScheduled: true,
      scheduledFor: DateTime.now().plus({ days: 3 }).toJSDate(), // 3 days from now
      isPrinted: false,
    },
  });

  console.log("Seeded test tasks!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
