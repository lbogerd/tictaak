import {
  TaskSectionContainer,
  TaskSectionHeader,
  TaskSectionEmptyState,
  TaskSectionLoadingState,
  TaskGroup,
  TaskBulkActions,
  Badge,
} from "@/components/ui";
import { getTasksPrintedToday } from "@/lib/actions";
import { Prisma } from "@prisma/client";
import { CheckCircle, Clock, PrinterCheck } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import TaskCard from "./task-card";

type Task = Prisma.TaskGetPayload<{
  include: { category: true };
}>;

interface TodaysPrintedTasksProps {
  refreshTrigger?: number; // Can be used to refresh when new tasks are printed
}

export default function TodaysPrintedTasks({
  refreshTrigger,
}: TodaysPrintedTasksProps) {
  const [printedTasks, setPrintedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    loadPrintedTasks();
  }, [refreshTrigger]);

  const loadPrintedTasks = async () => {
    try {
      setIsLoading(true);
      const tasks = await getTasksPrintedToday();
      setPrintedTasks(tasks);
    } catch (error) {
      console.error("Failed to load printed tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskTypeBadge = (task: Task) => {
    if (task.recurringType) {
      return (
        <Badge
          key="task-type"
          variant="outline"
          className="text-xs rounded-full border-green-200 text-green-700 bg-green-50 capitalize"
        >
          Recurring • {task.recurringType}
        </Badge>
      );
    } else {
      return (
        <Badge
          key="task-type"
          variant="outline"
          className="text-xs rounded-full border-green-200 text-green-700 bg-green-50"
        >
          One-time
        </Badge>
      );
    }
  };

  const getPrintedTimeBadge = (task: Task) => {
    if (!task.lastPrintedAt) return null;

    const printedTime = DateTime.fromJSDate(task.lastPrintedAt);
    const now = DateTime.now();
    const diffInMinutes = now.diff(printedTime, "minutes").minutes;

    let timeText;
    if (diffInMinutes < 1) {
      timeText = "Just now";
    } else if (diffInMinutes < 60) {
      timeText = `${Math.floor(diffInMinutes)}m ago`;
    } else {
      timeText = printedTime.toFormat("HH:mm");
    }

    return (
      <Badge
        key="printed-time"
        variant="outline"
        className="text-xs rounded-full border-emerald-200 text-emerald-700 bg-emerald-50"
      >
        <Clock className="w-3 h-3 mr-1" />
        Printed {timeText}
      </Badge>
    );
  };

  const groupTasksByHour = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {};

    tasks.forEach((task) => {
      if (task.lastPrintedAt) {
        const hourKey = DateTime.fromJSDate(task.lastPrintedAt)
          .startOf("hour")
          .toFormat("HH:mm");
        if (!groups[hourKey]) {
          groups[hourKey] = [];
        }
        groups[hourKey].push(task);
      }
    });

    // Sort by time (most recent first)
    return Object.entries(groups).sort(([a], [b]) => {
      const timeA = DateTime.fromFormat(a, "HH:mm");
      const timeB = DateTime.fromFormat(b, "HH:mm");
      return timeB.valueOf() - timeA.valueOf();
    });
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
    const allTaskIds = printedTasks.map((task) => task.id);
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

  if (isLoading) {
    return (
      <TaskSectionContainer borderColor="green">
        <TaskSectionLoadingState
          message="Loading today's printed tasks..."
          colorScheme="green"
        />
      </TaskSectionContainer>
    );
  }

  return (
    <TaskSectionContainer borderColor="green">
      <TaskSectionHeader
        icon={<PrinterCheck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
        title="Today's Printed Tasks"
        count={printedTasks.length}
        countLabel="completed"
        colorScheme="green"
        selectionMode={selectionMode}
        selectedCount={selectedTaskIds.size}
        totalCount={printedTasks.length}
        onToggleSelection={handleToggleAllSelection}
        onToggleSelectionMode={handleToggleSelectionMode}
      />

      {printedTasks.length === 0 ? (
        <TaskSectionEmptyState
          emoji="📝"
          primaryMessage="No tasks printed today yet!"
          secondaryMessage="Start printing some tasks to see them here 🖨️"
          colorScheme="green"
        />
      ) : (
        <div className="space-y-6">
          {groupTasksByHour(printedTasks).map(([hourKey, hourTasks]) => {
            const groupSelectedCount = hourTasks.filter((task) =>
              selectedTaskIds.has(task.id)
            ).length;

            return (
              <TaskGroup
                key={hourKey}
                title={`After ${hourKey}`}
                icon={<CheckCircle className="w-4 h-4" />}
                count={hourTasks.length}
                countLabel="task"
                colorScheme="green"
                selectionMode={selectionMode}
                selectedCount={groupSelectedCount}
                onToggleGroupSelection={() =>
                  handleToggleGroupSelection(hourTasks)
                }
              >
                {hourTasks.map((task) => (
                  <TaskCard
                    key={`printed-${task.id}`}
                    task={task}
                    onPrint={() => {}} // No-op for printed tasks
                    isPrinting={false}
                    variant="recent"
                    additionalBadges={[
                      getTaskTypeBadge(task),
                      getPrintedTimeBadge(task),
                    ].filter(Boolean)}
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

      <TaskBulkActions
        selectedCount={selectedTaskIds.size}
        onClearSelection={() => setSelectedTaskIds(new Set())}
        colorScheme="green"
      />
    </TaskSectionContainer>
  );
}
