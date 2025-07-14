"use client";

import {
  TaskSectionContainer,
  TaskSectionHeader,
  TaskSectionEmptyState,
  TaskSectionLoadingState,
  TaskGroup,
  TaskBulkActions,
  Badge,
} from "@/components/ui";
import {
  archiveTask as deleteTask,
  getUpcomingTasks,
  printAndUpdateTask,
} from "@/lib/server-actions/task";
import { printTask } from "@/lib/printer";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  CalendarDays,
} from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Task } from "@/types";
import TaskCard from "./task-card";

interface TodaysDueTasksClientProps {
  initialDueTasks: Task[];
  initialUpcomingTasks: Task[];
  onTaskPrinted?: (task: Task) => void;
}

export default function TodaysDueTasksClient({
  initialDueTasks,
  initialUpcomingTasks,
  onTaskPrinted,
}: TodaysDueTasksClientProps) {
  const [dueTasks, setDueTasks] = useState<Task[]>(initialDueTasks);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>(initialUpcomingTasks);
  const [printingTaskId, setPrintingTaskId] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);

  // Selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [isPrintingBulk, setIsPrintingBulk] = useState(false);

  const loadUpcomingTasks = async () => {
    if (upcomingTasks.length > 0) return; // Already loaded

    try {
      setIsLoadingUpcoming(true);
      const tasks = await getUpcomingTasks();
      setUpcomingTasks(tasks);
    } catch (error) {
      console.error("Failed to load upcoming tasks:", error);
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  const handleToggleUpcoming = async () => {
    if (!showUpcoming) {
      await loadUpcomingTasks();
    }
    setShowUpcoming(!showUpcoming);
  };

  const handlePrint = async (task: Task) => {
    if (printingTaskId) return;

    try {
      setPrintingTaskId(task.id);

      // Print the task
      const result = await printTask(task.title, task.category.name);

      if (result.success) {
        // Update task after printing (handles both recurring and scheduled)
        await printAndUpdateTask(task.id);

        // Remove from due tasks list
        setDueTasks((prev) => prev.filter((t) => t.id !== task.id));

        // Notify parent component
        onTaskPrinted?.(task);

        console.log("Task printed successfully");
      } else {
        console.error("Printing failed:", result.error);
        alert("Printing failed: " + result.error);
      }
    } catch (error) {
      console.error("Printing error:", error);
      alert(
        "Printing error: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setPrintingTaskId(null);
    }
  };

  const getDayNames = (recursOnDays: number[]): string => {
    if (!recursOnDays || recursOnDays.length === 0) return "";

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return recursOnDays.map((d) => dayNames[d]).join(", ");
  };

  const getTaskBadges = (task: Task) => {
    const badges = [];

    // Check if it's a recurring task (has recursOnDays)
    if (task.recursOnDays && task.recursOnDays.length > 0) {
      // Recurring task badges
      badges.push(
        <Badge
          key="recurring-type"
          variant="outline"
          className="text-xs rounded-full border-purple-200 text-purple-700 bg-purple-50 capitalize"
        >
          Weekly • {getDayNames(task.recursOnDays)}
        </Badge>
      );
    } else if (task.nextPrintDate) {
      // Scheduled task badge (has nextPrintDate but no recursOnDays)
      badges.push(
        <Badge
          key="scheduled"
          variant="outline"
          className="text-xs rounded-full border-blue-200 text-blue-700 bg-blue-50"
        >
          Scheduled
        </Badge>
      );
    }

    return badges;
  };

  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {};

    tasks.forEach((task) => {
      const dueDate = task.nextPrintDate;
      if (dueDate) {
        const dateKey = DateTime.fromJSDate(dueDate).toFormat("yyyy-MM-dd");
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(task);
      }
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    setDueTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Selection handlers
  const handleTaskSelection = (taskId: string, selected: boolean) => {
    setSelectedTaskIds((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedTaskIds(new Set());
    }
  };

  const handleToggleAllSelection = () => {
    const allTaskIds = [...dueTasks, ...upcomingTasks].map((task) => task.id);
    const allSelected = allTaskIds.every((id) => selectedTaskIds.has(id));

    if (allSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(allTaskIds));
    }
  };

  const handleToggleGroupSelection = (tasks: Task[]) => {
    const groupTaskIds = tasks.map((task) => task.id);
    const allGroupSelected = groupTaskIds.every((id) =>
      selectedTaskIds.has(id)
    );

    setSelectedTaskIds((prev: Set<string>) => {
      const newSet = new Set(prev);

      if (allGroupSelected) {
        groupTaskIds.forEach((id) => newSet.delete(id));
      } else {
        groupTaskIds.forEach((id) => newSet.add(id));
      }

      return newSet;
    });
  };

  const handleBulkPrint = async () => {
    if (selectedTaskIds.size === 0) return;

    setIsPrintingBulk(true);
    const selectedTasks = [...dueTasks, ...upcomingTasks].filter((task) =>
      selectedTaskIds.has(task.id)
    );

    try {
      for (const task of selectedTasks) {
        await handlePrint(task);
      }
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error("Bulk print failed:", error);
    } finally {
      setIsPrintingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return;

    if (!confirm(`Delete ${selectedTaskIds.size} selected tasks?`)) return;

    try {
      for (const taskId of selectedTaskIds) {
        await deleteTask(taskId);
      }
      setDueTasks((prev) =>
        prev.filter((task) => !selectedTaskIds.has(task.id))
      );
      setUpcomingTasks((prev) =>
        prev.filter((task) => !selectedTaskIds.has(task.id))
      );
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const totalTaskCount = dueTasks.length + upcomingTasks.length;

  return (
    <TaskSectionContainer borderColor="purple">
      <TaskSectionHeader
        icon={<CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
        title="Today's Due Tasks"
        count={dueTasks.length}
        countLabel="due"
        actionButton={
          !selectionMode
            ? {
                label: "View All Upcoming",
                onClick: handleToggleUpcoming,
                icon: showUpcoming ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                ),
              }
            : undefined
        }
        colorScheme="purple"
        selectionMode={selectionMode}
        selectedCount={selectedTaskIds.size}
        totalCount={totalTaskCount}
        onToggleSelection={handleToggleAllSelection}
        onToggleSelectionMode={handleToggleSelectionMode}
      />

      {dueTasks.length === 0 ? (
        <TaskSectionEmptyState
          emoji="✨"
          primaryMessage="No tasks due today!"
          secondaryMessage="All caught up with your schedule 🎉"
          colorScheme="purple"
        />
      ) : (
        <div className="space-y-4">
          {dueTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPrint={handlePrint}
              isPrinting={printingTaskId === task.id}
              variant="recurring"
              additionalBadges={getTaskBadges(task)}
              onDelete={handleDelete}
              selectionMode={selectionMode}
              isSelected={selectedTaskIds.has(task.id)}
              onSelectionChange={handleTaskSelection}
            />
          ))}
        </div>
      )}

      {/* Upcoming Tasks Collapsible Section */}
      {showUpcoming && (
        <div className="mt-8 pt-6 border-t border-purple-100">
          <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Next 30 Days
          </h3>

          {isLoadingUpcoming ? (
            <TaskSectionLoadingState
              message="Loading upcoming tasks..."
              colorScheme="purple"
            />
          ) : upcomingTasks.length === 0 ? (
            <TaskSectionEmptyState
              emoji="📅"
              primaryMessage="No upcoming tasks scheduled"
              secondaryMessage="for the next 30 days"
              colorScheme="purple"
            />
          ) : (
            <div className="space-y-6">
              {groupTasksByDate(upcomingTasks).map(([dateKey, dateTasks]) => {
                const date = DateTime.fromFormat(dateKey, "yyyy-MM-dd");
                const isToday = date.hasSame(DateTime.now(), "day");
                const isTomorrow = date.hasSame(
                  DateTime.now().plus({ days: 1 }),
                  "day"
                );

                let dateLabel = date.toFormat("EEEE, MMMM d");
                if (isToday) dateLabel = "Today";
                else if (isTomorrow) dateLabel = "Tomorrow";

                const groupSelectedCount = dateTasks.filter((task) =>
                  selectedTaskIds.has(task.id)
                ).length;

                return (
                  <TaskGroup
                    key={dateKey}
                    title={dateLabel}
                    icon={<Clock className="w-4 h-4" />}
                    count={dateTasks.length}
                    countLabel="task"
                    colorScheme="purple"
                    selectionMode={selectionMode}
                    selectedCount={groupSelectedCount}
                    onToggleGroupSelection={() =>
                      handleToggleGroupSelection(dateTasks)
                    }
                  >
                    {dateTasks.map((task) => (
                      <TaskCard
                        key={`upcoming-${task.id}`}
                        task={task}
                        onPrint={handlePrint}
                        isPrinting={printingTaskId === task.id}
                        variant="recurring"
                        additionalBadges={getTaskBadges(task)}
                        onDelete={handleDelete}
                        selectionMode={selectionMode}
                        isSelected={selectedTaskIds.has(task.id)}
                        onSelectionChange={handleTaskSelection}
                      />
                    ))}
                  </TaskGroup>
                );
              })}
            </div>
          )}
        </div>
      )}

      <TaskBulkActions
        selectedCount={selectedTaskIds.size}
        onBulkPrint={handleBulkPrint}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedTaskIds(new Set())}
        isPrintingBulk={isPrintingBulk}
        colorScheme="purple"
      />
    </TaskSectionContainer>
  );
}