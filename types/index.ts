import { Prisma } from "@prisma/client";

export type Category = Prisma.CategoryGetPayload<Record<string, never>>;
export type Task = Prisma.TaskGetPayload<{
  include: { category: true };
}>;

export type TasksMeta = {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};