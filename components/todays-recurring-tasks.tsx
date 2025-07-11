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
  deleteTask,
  getTodaysDueTasks,
  getUpcomingRecurringTasks,
  updateTaskAfterPrint,
} from "@/lib/actions";
import { printTask } from "@/lib/printer";
import { Prisma } from "@prisma/client";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Repeat,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import TaskCard from "./task-card";

type Task = Prisma.TaskGetPayload<{
  include: { category: true };
}>;

interface TodaysRecurringTasksProps {
  onTaskPrinted?: (task: Task) => void;
}

export default function TodaysRecurringTasks({
  onTaskPrinted,
}: TodaysRecurringTasksProps) {
  const [dueTasks, setDueTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [printingTaskId, setPrintingTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  
  // Selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isPrintingBulk, setIsPrintingBulk] = useState(false);

  useEffect(() => {
    loadDueTasks();
  }, []);

  const loadDueTasks = async () => {
    try {
      setIsLoading(true);
      const tasks = await getTodaysDueTasks();
      setDueTasks(tasks);
    } catch (error) {
      console.error("Failed to load due tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUpcomingTasks = async () => {
    if (upcomingTasks.length > 0) return; // Already loaded

    try {
      setIsLoadingUpcoming(true);
      const tasks = await getUpcomingRecurringTasks();
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
        // Update the task after printing
        await updateTaskAfterPrint(task.id);

        // Remove from due tasks list
        setDueTasks((prev) => prev.filter((t) => t.id !== task.id));

        // Notify parent component
        onTaskPrinted?.(task);

        console.log("Recurring task printed successfully");
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

  const getDayNames = (recurringDays: string | null): string => {
    if (!recurringDays) return "";

    try {
      const days = JSON.parse(recurringDays) as number[];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days.map((d) => dayNames[d]).join(", ");
    } catch {
      return "";
    }
  };

  const getRecurringBadges = (task: Task) => {
    const badges = [];

    // Recurring type badge
    badges.push(
      <Badge
        key="recurring-type"
        variant="outline"
        className="text-xs rounded-full border-purple-200 text-purple-700 bg-purple-50 capitalize"
      >
        {task.recurringType}
        {task.recurringType === "weekly" &&
          task.recurringDays &&
          ` • ${getDayNames(task.recurringDays)}`}
      </Badge>
    );

    return badges;
  };

  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {};

    tasks.forEach((task) => {
      if (task.nextPrintDate) {
        const dateKey = DateTime.fromJSDate(task.nextPrintDate).toFormat(
          "yyyy-MM-dd"
        );
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
    const allTaskIds = [...dueTasks, ...upcomingTasks].map(task => task.id);
    const allSelected = allTaskIds.every(id => selectedTaskIds.has(id));
    
    if (allSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(allTaskIds));
    }
  };

  const handleToggleGroupSelection = (tasks: Task[]) => {
    const groupTaskIds = tasks.map(task => task.id);
    const allGroupSelected = groupTaskIds.every(id => selectedTaskIds.has(id));
    
    setSelectedTaskIds((prev: Set<string>) => {
      const newSet = new Set(prev);
      
      if (allGroupSelected) {
        groupTaskIds.forEach(id => newSet.delete(id));
      } else {
        groupTaskIds.forEach(id => newSet.add(id));
      }
      
      return newSet;
    });
  };

  const handleBulkPrint = async () => {
    if (selectedTaskIds.size === 0) return;
    
    setIsPrintingBulk(true);
    const selectedTasks = [...dueTasks, ...upcomingTasks].filter(task => selectedTaskIds.has(task.id));
    
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
      setDueTasks((prev) => prev.filter(task => !selectedTaskIds.has(task.id)));
      setUpcomingTasks((prev) => prev.filter(task => !selectedTaskIds.has(task.id)));
      setSelectedTaskIds(new Set());
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const totalTaskCount = dueTasks.length + upcomingTasks.length;

  if (isLoading) {
    return (
      <TaskSectionContainer borderColor="purple">
        <TaskSectionLoadingState 
          message="Loading today's tasks..."
          colorScheme="purple"
        />
      </TaskSectionContainer>
    );
  }

  return (
    <TaskSectionContainer borderColor="purple">
      <TaskSectionHeader
        icon={<Repeat className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
        title="Today's Recurring Tasks"
        count={dueTasks.length}
        countLabel="due"
        actionButton={!selectionMode ? {
          label: "View All Upcoming",
          onClick: handleToggleUpcoming,
          icon: showUpcoming ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />,
        } : undefined}
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
          primaryMessage="No recurring tasks due today!"
          secondaryMessage="All caught up with your recurring schedule 🎉"
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
              additionalBadges={getRecurringBadges(task)}
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
              primaryMessage="No recurring tasks scheduled"
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

                const groupSelectedCount = dateTasks.filter(task => selectedTaskIds.has(task.id)).length;
                
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
                    onToggleGroupSelection={() => handleToggleGroupSelection(dateTasks)}
                  >
                    {dateTasks.map((task) => (
                      <TaskCard
                        key={`upcoming-${task.id}`}
                        task={task}
                        onPrint={handlePrint}
                        isPrinting={printingTaskId === task.id}
                        variant="recurring"
                        additionalBadges={getRecurringBadges(task)}
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
