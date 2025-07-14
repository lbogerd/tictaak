"use server";

import { DateTime } from "luxon";
import { revalidatePath } from "next/cache";
import { db } from "../prisma";

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

export async function archiveCategory(
  id: string,
  archiveTasks: boolean = false
) {
  await db.category.update({
    where: { id },
    data: {
      archivedAt: DateTime.now().toJSDate(),
      tasks: archiveTasks
        ? {
            updateMany: {
              where: { categoryId: id },
              data: { archivedAt: DateTime.now().toJSDate() },
            },
          }
        : undefined,
    },
  });

  revalidatePath("/");
}

export async function unarchiveCategory(id: string) {
  await db.category.update({
    where: { id },
    data: { archivedAt: null },
  });

  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  // First delete all tasks in this category
  await db.task.deleteMany({
    where: { categoryId: id },
  });

  // Then delete the category
  await db.category.delete({
    where: { id },
  });

  revalidatePath("/");
}
