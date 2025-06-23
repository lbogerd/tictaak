"use server";

import { db } from "./prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Task actions
export async function createTask(
  title: string,
  categoryId: string,
  recurringData?: Pick<
    Prisma.TaskCreateInput,
    | "isRecurring"
    | "recurringType"
    | "recurringInterval"
    | "recurringDays"
    | "nextPrintDate"
  >
) {
  const task = await db.task.create({
    data: {
      title,
      categoryId,
      ...recurringData,
    },
    include: {
      category: true,
    },
  });

  revalidatePath("/");
  return task;
}

export async function getTasks(options?: {
  limit?: number;
  page?: number;
  search?: string;
  categoryId?: string;
}) {
  const { limit = 10, page = 1, search, categoryId } = options || {};
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = {};

  if (search) {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [tasks, totalCount] = await Promise.all([
    db.task.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    db.task.count({ where }),
  ]);

  return {
    tasks,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    hasNextPage: page < Math.ceil(totalCount / limit),
    hasPreviousPage: page > 1,
  };
}

export async function deleteTask(id: string) {
  await db.task.delete({
    where: { id },
  });

  revalidatePath("/");
}

// Category actions
export async function createCategory(name: string) {
  const category = await db.category.create({
    data: { name },
  });

  revalidatePath("/");
  return category;
}

export async function getCategories() {
  return await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function deleteCategory(id: string) {
  await db.category.delete({
    where: { id },
  });

  revalidatePath("/");
}

// Initialize default categories
export async function initializeDefaultCategories() {
  const existingCategories = await db.category.count();

  if (existingCategories === 0) {
    const defaultCategories = [
      "Personal",
      "Work",
      "Health",
      "Shopping",
      "Projects",
    ];

    await db.category.createMany({
      data: defaultCategories.map((name) => ({ name })),
    });
  }
}

// Recurring task utilities
export async function calculateNextPrintDate(
  recurringType: string,
  recurringDays?: string | null,
  recurringInterval: number = 1
): Promise<Date> {
  const now = new Date();

  if (recurringType === "weekly" && recurringDays) {
    const days = JSON.parse(recurringDays) as number[];
    const today = now.getDay();
    const sortedDays = days.sort((a, b) => a - b);

    // Find next day in the current week
    const nextDay = sortedDays.find((day) => day > today);

    if (nextDay !== undefined) {
      // Next occurrence is this week
      const daysUntilNext = nextDay - today;
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + daysUntilNext);
      return nextDate;
    } else {
      // Next occurrence is next week (first day in the array)
      const daysUntilNext = 7 - today + sortedDays[0];
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + daysUntilNext);
      return nextDate;
    }
  } else if (recurringType === "daily") {
    // Next occurrence is after the specified interval
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + recurringInterval);
    return nextDate;
  }

  // Default to tomorrow
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + 1);
  return nextDate;
}

// Get tasks that are due for printing today
export async function getTodaysDueTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await db.task.findMany({
    where: {
      isRecurring: true,
      isActive: true,
      nextPrintDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      nextPrintDate: "asc",
    },
  });
}

// Get all upcoming recurring tasks (next 30 days)
export async function getUpcomingRecurringTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  return await db.task.findMany({
    where: {
      isRecurring: true,
      isActive: true,
      nextPrintDate: {
        gte: today,
        lt: thirtyDaysFromNow,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      nextPrintDate: "asc",
    },
  });
}

// Update task after printing (for recurring tasks)
export async function updateTaskAfterPrint(taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task || !task.isRecurring) return;

  const nextPrintDate = await calculateNextPrintDate(
    task.recurringType!,
    task.recurringDays,
    task.recurringInterval || 1
  );

  await db.task.update({
    where: { id: taskId },
    data: {
      lastPrintedAt: new Date(),
      nextPrintDate,
    },
  });

  revalidatePath("/");
}
