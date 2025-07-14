"use client";

import {
  createTask,
  getTasks,
  printAndUpdateTask,
  archiveTask as deleteTask,
} from "@/lib/server-actions/task";
import { useCallback, useEffect, useState, useTransition } from "react";
import { DateTime } from "luxon";
import NewTaskForm from "@/components/new-task-form";
import RecentTasksSection from "@/components/recent-tasks-section";
import { printTask } from "@/lib/printer";
import { Category, Task, TasksMeta } from "@/types";

interface ClientPageProps {
  initialTasks: Task[];
  initialTasksMeta: TasksMeta;
  initialCategories: Category[];
}

export default function ClientPage({
  initialTasks,
  initialTasksMeta,
  initialCategories,
}: ClientPageProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tasksMeta, setTasksMeta] = useState(initialTasksMeta);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newTitle, setNewTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoadingTasks, startTasksTransition] = useTransition();

  // Recurring task state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<string>("weekly");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Scheduled task state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);

  // Load tasks with pagination
  const loadTasks = async (page: number = 1) => {
    startTasksTransition(async () => {
      try {
        const result = await getTasks({
          limit: 10,
          page,
        });
        setTasks(result.tasks);
        setTasksMeta({
          totalCount: result.totalCount,
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
        });
      } catch (error) {
        console.error("Failed to load tasks:", error);
      }
    });
  };

  const handlePageChange = async (newPage: number) => {
    await loadTasks(newPage);
  };

  const resetForm = useCallback(() => {
    setNewTitle("");
    setSelectedCategoryId("");
    setShowNewForm(false);
    setIsRecurring(false);
    setRecurringType("weekly");
    setSelectedDays([]);
    setIsScheduled(false);
    setScheduledFor(null);
  }, []);

  const closeForm = useCallback(() => {
    setShowNewForm(false);
    resetForm();
  }, [resetForm]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Check for Ctrl+/ using multiple key detection methods for better compatibility
      if (
        event.ctrlKey &&
        (event.key === "/" || event.code === "Slash" || event.keyCode === 191)
      ) {
        event.preventDefault();
        setShowNewForm(true);
      }

      // Check for ESC to close form
      if (event.key === "Escape" && showNewForm) {
        event.preventDefault();
        closeForm();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeForm, showNewForm]);

  const handleCreate = async (print: boolean = true) => {
    if (!newTitle.trim() || !selectedCategoryId) return;

    // Validation for recurring tasks
    if (
      isRecurring &&
      recurringType === "weekly" &&
      selectedDays.length === 0
    ) {
      alert("Please select at least one day for weekly recurring tasks");
      return;
    }

    // Validation for scheduled tasks
    if (isScheduled && !scheduledFor) {
      alert("Please select a date and time for scheduled tasks");
      return;
    }

    try {
      const task = await createTask({
        title: newTitle,
        categoryId: selectedCategoryId,
        recursOnDays: isRecurring && recurringType === "weekly" ? selectedDays : [],
        nextPrintDate: isRecurring || isScheduled ? (isScheduled ? scheduledFor : calculateNextPrintDate()) : null,
      });
      setTasks((prev) => [task, ...prev]);

      // Print the task (only for immediate and recurring tasks, not scheduled)
      if (print && !isScheduled) await handlePrint(task);

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const calculateNextPrintDate = (): Date => {
    const now = DateTime.now();

    if (recurringType === "weekly" && selectedDays.length > 0) {
      const today = now.weekday % 7; // Convert to 0-6 format (Sunday=0)
      const sortedDays = selectedDays.sort((a, b) => a - b);

      // Check if today is one of the selected days
      if (selectedDays.includes(today)) {
        // Available for printing today
        return now.toJSDate();
      }

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
      // Available for printing today
      return now.toJSDate();
    }

    // Default to today for immediate availability
    return now.toJSDate();
  };

  const handlePrint = async (task: Task) => {
    if (isPrinting) return;

    try {
      setIsPrinting(true);

      const result = await printTask(task.title, task.category.name);

      if (result.success) {
        // Update the task with the last printed date
        await printAndUpdateTask(task.id);
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
      setIsPrinting(false);
    }
  };

  const handleDeleteFromHistory = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };


  return (
    <>
      {/* Main Action - Create & Print */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-rose-100 p-8 mb-8">
        <NewTaskForm
          showForm={showNewForm}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          categories={categories}
          setCategories={setCategories}
          isRecurring={isRecurring}
          setIsRecurring={setIsRecurring}
          recurringType={recurringType}
          setRecurringType={setRecurringType}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          isScheduled={isScheduled}
          setIsScheduled={setIsScheduled}
          scheduledFor={scheduledFor}
          setScheduledFor={setScheduledFor}
          isPrinting={isPrinting}
          onCreateTask={handleCreate}
          onCloseForm={closeForm}
          onSetShowForm={setShowNewForm}
        />
      </div>

      {/* Recent Tasks - For Reprinting */}
      <RecentTasksSection
        tasks={tasks}
        tasksMeta={tasksMeta}
        onPrint={handlePrint}
        onEdit={(task) => {
          setNewTitle(task.title);
          setSelectedCategoryId(task.categoryId);
          setShowNewForm(true);
          // scroll to the top of the page
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={handleDeleteFromHistory}
        onPageChange={handlePageChange}
        isPrinting={isPrinting}
        isLoadingTasks={isLoadingTasks}
      />
    </>
  );
}