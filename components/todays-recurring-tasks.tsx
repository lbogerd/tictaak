import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Loader2,
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

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-purple-100 p-8 mb-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-purple-700">
            Loading today&apos;s tasks...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-purple-100 p-8 mb-8">
      <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-800 flex items-center gap-2 flex-wrap">
            <Repeat className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="min-w-0">Today&apos;s Recurring Tasks</span>
            {dueTasks.length > 0 && (
              <Badge
                variant="outline"
                className="bg-purple-50 border-purple-200 text-purple-700 text-xs sm:text-sm"
              >
                {dueTasks.length} due
              </Badge>
            )}
          </h2>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleUpcoming}
          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl w-full sm:w-auto text-sm sm:text-base justify-center sm:justify-start"
          id="view-all-upcoming"
        >
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">View All Upcoming</span>
          {showUpcoming ? (
            <ChevronUp className="w-4 h-4 ml-1 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1 flex-shrink-0" />
          )}
        </Button>
      </div>

      {dueTasks.length === 0 ? (
        <div className="text-center py-4 md:py-8 text-purple-600">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-lg">No recurring tasks due today!</p>
          <p className="text-sm bg-purple-50 rounded-2xl px-6 py-3 inline-block mt-2">
            All caught up with your recurring schedule 🎉
          </p>
        </div>
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
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              <span className="ml-2 text-purple-600">
                Loading upcoming tasks...
              </span>
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="text-center py-6 text-purple-600">
              <p>No recurring tasks scheduled for the next 30 days.</p>
            </div>
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

                return (
                  <div key={dateKey}>
                    <h4 className="text-sm font-medium text-purple-600 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {dateLabel}
                      <Badge
                        variant="outline"
                        className="text-xs bg-purple-50 border-purple-200 text-purple-700"
                      >
                        {dateTasks.length} task
                        {dateTasks.length !== 1 ? "s" : ""}
                      </Badge>
                    </h4>

                    <div className="space-y-3 ml-6">
                      {dateTasks.map((task) => (
                        <TaskCard
                          key={`upcoming-${task.id}`}
                          task={task}
                          onPrint={handlePrint}
                          isPrinting={printingTaskId === task.id}
                          variant="recurring"
                          additionalBadges={getRecurringBadges(task)}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
