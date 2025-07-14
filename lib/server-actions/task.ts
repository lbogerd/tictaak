"use server";

import { Prisma, Task } from "@prisma/client";
import { DateTime } from "luxon";
import { revalidatePath } from "next/cache";
import { calculateNextPrintDate } from "../logic";
import { printTask } from "../printer";
import { db } from "../prisma";

type TaskData = Pick<
  Task,
  "title" | "categoryId" | "recursOnDays" | "nextPrintDate"
>;

// Task actions
export async function createTask(taskData: TaskData) {
  const { title, categoryId, recursOnDays, nextPrintDate } = taskData;

  const task = await db.task.create({
    data: {
      title,
      categoryId,
      recursOnDays,
      nextPrintDate,
    },
    include: {
      category: true,
    },
  });

  revalidatePath("/");
  return task;
}

export async function printAndUpdateTask(taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      category: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const printResult = await printTask(task.title, task.category.name);

  if (!printResult.success) {
    throw new Error("Failed to print task");
  }

  const updateData: Prisma.TaskUpdateInput = {
    lastPrintedAt: DateTime.now().toJSDate(),
  };

  if (task.recursOnDays) {
    const nextPrintDate = calculateNextPrintDate(task.recursOnDays);
    updateData.nextPrintDate = nextPrintDate;
  }

  await db.task.update({
    where: { id: taskId },
    data: updateData,
  });

  revalidatePath("/");
}

export async function getTasks(options?: {
  limit?: number;
  page?: number;
  search?: string;
  categoryId?: string;
  includeArchived?: boolean;
}) {
  const {
    limit = 10,
    page = 1,
    search,
    categoryId,
    includeArchived,
  } = options || {};
  const skip = (page - 1) * limit;

  const where: Prisma.TaskWhereInput = includeArchived
    ? {}
    : { archivedAt: null };

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

export async function archiveTask(id: string) {
  await db.task.update({
    where: { id },
    data: { archivedAt: DateTime.now().toJSDate() },
  });

  revalidatePath("/");
}

export async function unarchiveTask(id: string) {
  await db.task.update({
    where: { id },
    data: { archivedAt: null },
  });

  revalidatePath("/");
}

export async function getDueTasks(forDateIso?: string) {
  const forDate = forDateIso
    ? DateTime.fromISO(forDateIso).endOf("day")
    : DateTime.now().endOf("day");

  const dueTasks = await db.task.findMany({
    where: {
      nextPrintDate: {
        lte: forDate.plus({ days: 1 }).toJSDate(),
      },
      archivedAt: null,
    },
    include: {
      category: true,
    },
    orderBy: {
      nextPrintDate: "asc",
    },
  });

  return dueTasks;
}

export async function getUpcomingTasks(
  maxDays: number = 30,
  afterDateIso?: string
) {
  const afterDate = afterDateIso
    ? DateTime.fromISO(afterDateIso).endOf("day")
    : DateTime.now().plus({ days: 1 }).endOf("day");

  const upcomingTasks = await db.task.findMany({
    where: {
      nextPrintDate: {
        gte: afterDate.toJSDate(),
        lte: afterDate.plus({ days: maxDays }).toJSDate(),
      },
      archivedAt: null,
    },
    include: {
      category: true,
    },
    orderBy: {
      nextPrintDate: "asc",
    },
  });

  return upcomingTasks;
}

export async function getTasksPrintedToday() {
  const today = DateTime.now().startOf("day");

  const tasksPrintedToday = await db.task.findMany({
    where: {
      lastPrintedAt: {
        gte: today.toJSDate(),
      },
    },
    include: {
      category: true,
    },
  });

  return tasksPrintedToday;
}
