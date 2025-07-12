"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { DateTime } from "luxon";
import { db } from "./prisma";

// Task actions
export async function createTask(
  title: string,
  categoryId: string,
  taskData?: Pick<
    Prisma.TaskCreateInput,
    | "isRecurring"
    | "recurringType"
    | "recurringInterval"
    | "recurringDays"
    | "nextPrintDate"
    | "isScheduled"
    | "scheduledFor"
    | "isPrinted"
  >
) {
  const task = await db.task.create({
    data: {
      title,
      categoryId,
      // Only set lastPrintedAt for non-recurring and non-scheduled tasks (they get printed immediately)
      // Recurring and scheduled tasks should not have lastPrintedAt set until actually printed
      lastPrintedAt:
        taskData?.isRecurring || taskData?.isScheduled
          ? null
          : DateTime.now().toJSDate(),
      ...taskData,
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

// Recurring task utilities
export async function calculateNextPrintDate(
  recurringType: string,
  recurringDays?: string | null,
  recurringInterval: number = 1
): Promise<Date> {
  const now = DateTime.now();

  if (recurringType === "weekly" && recurringDays) {
    const days = JSON.parse(recurringDays) as number[];
    const today = now.weekday % 7; // Convert to 0-6 format (Sunday=0)
    const sortedDays = days.sort((a, b) => a - b);

    // Find next day in the current week
    const nextDay = sortedDays.find((day) => day > today);

    if (nextDay !== undefined) {
      // Next occurrence is this week
      const daysUntilNext = nextDay - today;
      const nextDate = now.plus({ days: daysUntilNext });
      return nextDate.toJSDate();
    } else {
      // Next occurrence is next week (first day in the array)
      const daysUntilNext = 7 - today + sortedDays[0];
      const nextDate = now.plus({ days: daysUntilNext });
      return nextDate.toJSDate();
    }
  } else if (recurringType === "daily") {
    // Next occurrence is after the specified interval
    const nextDate = now.plus({ days: recurringInterval });
    return nextDate.toJSDate();
  }

  // Default to tomorrow
  const nextDate = now.plus({ days: 1 });
  return nextDate.toJSDate();
}

// Get tasks that are due for printing today (both recurring and scheduled)
export async function getTodaysDueTasks() {
  const today = DateTime.now().startOf("day");
  const tomorrow = today.plus({ days: 1 });

  // Get recurring tasks that are due today
  const recurringTasks = await db.task.findMany({
    where: {
      isRecurring: true,
      isActive: true,
      nextPrintDate: {
        gte: today.toJSDate(),
        lt: tomorrow.toJSDate(),
      },
      OR: [
        {
          lastPrintedAt: {
            lt: today.toJSDate(),
          },
        },
        {
          lastPrintedAt: null,
        },
      ],
    },
    include: {
      category: true,
    },
    orderBy: {
      nextPrintDate: "asc",
    },
  });

  // Get scheduled tasks that are due today
  const scheduledTasks = await db.task.findMany({
    where: {
      isScheduled: true,
      isPrinted: false,
      scheduledFor: {
        gte: today.toJSDate(),
        lt: tomorrow.toJSDate(),
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      scheduledFor: "asc",
    },
  });

  // Combine and sort by due time
  const allTasks = [...recurringTasks, ...scheduledTasks];
  return allTasks.sort((a, b) => {
    const aTime = a.nextPrintDate || a.scheduledFor;
    const bTime = b.nextPrintDate || b.scheduledFor;
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return aTime.getTime() - bTime.getTime();
  });
}

// Get all upcoming recurring tasks (next 30 days)
export async function getUpcomingRecurringTasks() {
  const today = DateTime.now().startOf("day");
  const thirtyDaysFromNow = today.plus({ days: 30 });

  return await db.task.findMany({
    where: {
      isRecurring: true,
      isActive: true,
      nextPrintDate: {
        gte: today.toJSDate(),
        lt: thirtyDaysFromNow.toJSDate(),
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

// Get all upcoming scheduled tasks (next 30 days)
export async function getUpcomingScheduledTasks() {
  const today = DateTime.now().startOf("day");
  const thirtyDaysFromNow = today.plus({ days: 30 });

  return await db.task.findMany({
    where: {
      isScheduled: true,
      isPrinted: false,
      scheduledFor: {
        gte: today.toJSDate(),
        lt: thirtyDaysFromNow.toJSDate(),
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      scheduledFor: "asc",
    },
  });
}

// Get all upcoming tasks (both recurring and scheduled) for the next 30 days
export async function getUpcomingTasks() {
  const [recurringTasks, scheduledTasks] = await Promise.all([
    getUpcomingRecurringTasks(),
    getUpcomingScheduledTasks(),
  ]);

  // Combine and sort by due time
  const allTasks = [...recurringTasks, ...scheduledTasks];
  return allTasks.sort((a, b) => {
    const aTime = a.nextPrintDate || a.scheduledFor;
    const bTime = b.nextPrintDate || b.scheduledFor;
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return aTime.getTime() - bTime.getTime();
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
      lastPrintedAt: DateTime.now().toJSDate(),
      nextPrintDate,
    },
  });

  revalidatePath("/");
}

// Mark scheduled task as printed
export async function markScheduledTaskAsPrinted(taskId: string) {
  await db.task.update({
    where: { id: taskId },
    data: {
      isPrinted: true,
      lastPrintedAt: DateTime.now().toJSDate(),
    },
  });

  revalidatePath("/");
}

// Get tasks that were printed today
export async function getTasksPrintedToday() {
  const today = DateTime.now().startOf("day");

  return await db.task.findMany({
    where: {
      lastPrintedAt: {
        gte: today.toJSDate(),
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      lastPrintedAt: "desc",
    },
  });
}
