"use client";

import {
  Badge,
  TaskBulkActions,
  TaskGroup,
  TaskSectionContainer,
  TaskSectionEmptyState,
  TaskSectionHeader,
} from "@/components/ui";
import { CheckCircle, Clock, PrinterCheck } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Task } from "@/types";
import TaskCard from "./task-card";

interface TodaysPrintedTasksClientProps {
  initialTasks: Task[];
}

export default function TodaysPrintedTasksClient({
  initialTasks,
}: TodaysPrintedTasksClientProps) {
  const [tasks] = useState<Task[]>(initialTasks);

  // Selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );
  const [selectionMode, setSelectionMode] = useState(false);

  const getTaskTypeBadge = (task: Task) => {
    if (task.recursOnDays && task.recursOnDays.length > 0) {
      return (
        <Badge
          key="task-type"
          variant="outline"
          className="text-xs rounded-full border-green-200 text-green-700 bg-green-50 capitalize"
        >
          Recurring • Weekly
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
    const allTaskIds = tasks.map((task) => task.id);
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

  return (
    <TaskSectionContainer borderColor="green">
      <TaskSectionHeader
        icon={<PrinterCheck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
        title="Today's Printed Tasks"
        count={tasks.length}
        countLabel="completed"
        colorScheme="green"
        selectionMode={selectionMode}
        selectedCount={selectedTaskIds.size}
        totalCount={tasks.length}
        onToggleSelection={handleToggleAllSelection}
        onToggleSelectionMode={handleToggleSelectionMode}
      />

      {tasks.length === 0 ? (
        <TaskSectionEmptyState
          emoji="📝"
          primaryMessage="No tasks printed today yet!"
          secondaryMessage="Start printing some tasks to see them here 🖨️"
          colorScheme="green"
        />
      ) : (
        <div className="space-y-6">
          {groupTasksByHour(tasks).map(([hourKey, hourTasks]) => {
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
                    onPrint={() => { }} // No-op for printed tasks
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