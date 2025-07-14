"use client";

import { Button } from "@/components/ui/button";
import { Prisma } from "@prisma/client";
import { Archive, ChevronLeft, ChevronRight } from "lucide-react";
import TaskCard from "./task-card";

type Task = Prisma.TaskGetPayload<{
  include: { category: true };
}>;

type TasksMeta = {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type RecentTasksSectionProps = {
  tasks: Task[];
  tasksMeta: TasksMeta;
  onPrint?: (task: Task) => Promise<void>;	
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onPageChange: (page: number) => Promise<void>;
  isPrinting: boolean;
  isLoadingTasks: boolean;
};

export default function RecentTasksSection({
  tasks,
  tasksMeta,
  onPrint,
  onEdit,
  onDelete,
  onPageChange,
  isPrinting,
  isLoadingTasks,
}: RecentTasksSectionProps) {
  return (
    <div
      id="recent-tasks"
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-rose-100 p-8"
    >
      <h2 className="text-2xl font-bold text-amber-800 mb-3 flex items-center gap-2">
        <Archive className="w-6 h-6" />
        Your Recent Tasks
      </h2>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-amber-600">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-lg mb-2">No recent tasks yet!</p>
          <p className="text-sm bg-amber-50 rounded-2xl px-6 py-3 inline-block">
            Tasks you create will appear here for easy reprinting 💫
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={`recent-task-${task.id}`}
                task={task}
                onPrint={onPrint ? (task) => onPrint(task) : undefined}
                onEdit={onEdit}
                onDelete={onDelete}
                isPrinting={isPrinting}
                variant="recent"
              />
            ))}
          </div>
          {tasksMeta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-amber-600">
                Showing {tasks.length * tasksMeta.currentPage} of{" "}
                {tasksMeta.totalCount} tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPageChange(tasksMeta.currentPage - 1)
                  }
                  disabled={!tasksMeta.hasPreviousPage || isLoadingTasks}
                  className="rounded-xl border-rose-200 text-amber-700 hover:bg-amber-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-amber-600 px-4">
                  Page {tasksMeta.currentPage} of {tasksMeta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onPageChange(tasksMeta.currentPage + 1)
                  }
                  disabled={!tasksMeta.hasNextPage || isLoadingTasks}
                  className="rounded-xl border-rose-200 text-amber-700 hover:bg-amber-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}