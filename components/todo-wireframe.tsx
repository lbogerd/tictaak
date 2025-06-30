"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  Ticket,
  Archive,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  createTask,
  getTasks,
  deleteTask,
  createCategory,
  deleteCategory,
} from "@/lib/actions";
import { printTask } from "@/lib/printer";
import { Prisma } from "@prisma/client";
import RecurringTaskOptions from "./recurring-task-options";
import TaskCard from "./task-card";
import TodaysRecurringTasks from "./todays-recurring-tasks";

type Category = Prisma.CategoryGetPayload<Record<string, never>>;
type Task = Prisma.TaskGetPayload<{
  include: { category: true };
}>;

type TodoWireframeProps = {
  initialTasksData: {
    tasks: Task[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  initialCategories: Category[];
};

export default function TodoWireframe({
  initialTasksData,
  initialCategories,
}: TodoWireframeProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [tasks, setTasks] = useState(initialTasksData.tasks);
  const [tasksMeta, setTasksMeta] = useState({
    totalCount: initialTasksData.totalCount,
    currentPage: initialTasksData.currentPage,
    totalPages: initialTasksData.totalPages,
    hasNextPage: initialTasksData.hasNextPage,
    hasPreviousPage: initialTasksData.hasPreviousPage,
  });
  const [categories, setCategories] = useState(initialCategories);
  const [newTitle, setNewTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoadingTasks, startTasksTransition] = useTransition();

  // Recurring task state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<string>("weekly");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

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
    if (
      isRecurring &&
      recurringType === "weekly" &&
      selectedDays.length === 0
    ) {
      alert("Please select at least one day for weekly recurring tasks");
      return;
    }

    try {
      const recurringData = isRecurring
        ? {
            isRecurring: true,
            recurringType,
            recurringInterval: 1,
            recurringDays:
              recurringType === "weekly" ? JSON.stringify(selectedDays) : null,
            nextPrintDate: calculateNextPrintDate(),
          }
        : undefined;

      const task = await createTask(
        newTitle,
        selectedCategoryId,
        recurringData
      );
      setTasks((prev) => [task, ...prev]);

      // Print the task
      if (print) await handlePrint(task);

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const calculateNextPrintDate = (): Date => {
    const now = new Date();

    if (recurringType === "weekly" && selectedDays.length > 0) {
      const today = now.getDay();
      const sortedDays = selectedDays.sort((a, b) => a - b);

      // Find next day in the current week
      const nextDay = sortedDays.find((day) => day > today);

      if (nextDay !== undefined) {
        // Next occurrence is this week
        const daysUntilNext = nextDay - today;
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysUntilNext);
        return nextDate;
      } else {
        // Next occurrence is next week (first day in the array)
        const daysUntilNext = 7 - today + sortedDays[0];
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysUntilNext);
        return nextDate;
      }
    } else if (recurringType === "daily") {
      // Next occurrence is tomorrow
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + 1);
      return nextDate;
    }

    // Default to tomorrow
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + 1);
    return nextDate;
  };

  const handlePrint = async (task: Task) => {
    if (isPrinting) return;

    try {
      setIsPrinting(true);
      const result = await printTask(task.title, task.category.name);

      if (result.success) {
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const category = await createCategory(newCategoryName);
      setCategories((prev) =>
        [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
      );
      setSelectedCategoryId(category.id);
      setNewCategoryName("");
      setIsCreatingCategory(false);
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category. It might already exist.");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Delete this category? All tasks in this category will also be deleted."
      )
    )
      return;

    try {
      await deleteCategory(categoryId);
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      setTasks((prev) => prev.filter((task) => task.categoryId !== categoryId));
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId("");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-amber-800 mb-3 flex items-center justify-center gap-3">
            <Ticket className="w-8 h-8 rotate-90 text-amber-400" />
            TicTaak
          </h1>
        </div>

        {/* Main Action - Create & Print */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-rose-100 p-8 mb-8">
          {!showNewForm ? (
            <div className="text-center flex flex-col items-center gap-4">
              <Button
                onClick={() => setShowNewForm(true)}
                className="relative inline-flex items-center justify-center w-full px-10 py-6 rounded-2xl text-white text-lg bg-gradient-to-r from-rose-500 to-pink-500 transition-[background-image] duration-300 ease-in-out hover:from-rose-600 hover:to-pink-600 shadow-lg hover:shadow-xl max-w-md"
                size="lg"
              >
                <Plus className="w-6 h-6 mr-3" />
                Create and print
              </Button>
              <div className="text-sm text-amber-600 bg-amber-100 rounded-full px-4 py-2 inline-block">
                Press{" "}
                <kbd className="px-3 py-1 bg-white rounded-lg text-xs shadow-sm border border-amber-200">
                  Ctrl+/
                </kbd>{" "}
                for super quick access!
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="What lovely thing needs to be done? 💫"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="flex-1 text-lg py-4 rounded-2xl border-rose-200 focus:border-rose-400 focus:ring-rose-200"
                  autoFocus
                />

                {/* Enhanced Category Select */}
                <div className="w-52">
                  {isCreatingCategory ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateCategory();
                          if (e.key === "Escape") setIsCreatingCategory(false);
                        }}
                        className="rounded-xl border-rose-200 focus:border-rose-400"
                        autoFocus
                      />
                      <Button
                        onClick={handleCreateCategory}
                        size="sm"
                        className="rounded-xl"
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                    >
                      <SelectTrigger className="rounded-2xl border-rose-200 focus:border-rose-400">
                        <SelectValue placeholder="Choose category 🏷️" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {categories.map((category) => (
                          <div
                            key={`category-${category.id}`}
                            className="flex items-center justify-between group"
                          >
                            <SelectItem
                              value={category.id}
                              className="rounded-lg flex-1"
                            >
                              {category.name}
                            </SelectItem>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(category.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-rose-400 hover:text-rose-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="border-t pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCreatingCategory(true)}
                            className="w-full text-left justify-start text-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add new category
                          </Button>
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Recurring Task Options */}
              <RecurringTaskOptions
                isRecurring={isRecurring}
                setIsRecurring={setIsRecurring}
                recurringType={recurringType}
                setRecurringType={setRecurringType}
                selectedDays={selectedDays}
                setSelectedDays={setSelectedDays}
              />

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  {isRecurring ? (
                    <Button
                      onClick={() => handleCreate(false)}
                      className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                      disabled={
                        !newTitle.trim() || !selectedCategoryId || isPrinting
                      }
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleCreate(true)}
                      className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                      disabled={
                        !newTitle.trim() || !selectedCategoryId || isPrinting
                      }
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      {isPrinting ? "Printing..." : "Create & Print"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={closeForm}
                    size="lg"
                    className="rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Today's Recurring Tasks */}
        <TodaysRecurringTasks
          onTaskPrinted={(task) => setTasks((prev) => [task, ...prev])}
        />

        {/* Recent Tasks - For Reprinting */}
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
                    onPrint={handlePrint}
                    onEdit={(task) => {
                      setNewTitle(task.title);
                      setSelectedCategoryId(task.categoryId);
                      setShowNewForm(true);
                      // scroll to the top of the page
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onDelete={handleDeleteFromHistory}
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
                        handlePageChange(tasksMeta.currentPage - 1)
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
                        handlePageChange(tasksMeta.currentPage + 1)
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

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-amber-600">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 inline-block border border-rose-100">
            <div className="flex items-center justify-center gap-2">
              ⌨️ Keyboard shortcuts:{" "}
              <span className="flex items-center gap-2">
                <span>
                  <kbd className="px-3 py-1 bg-white rounded-lg shadow-sm border border-amber-200">
                    Ctrl+/
                  </kbd>{" "}
                  New task
                </span>
                <div
                  className="h-5 w-px bg-amber-300 mx-2 rounded"
                  aria-hidden="true"
                ></div>
                <span>
                  <kbd className="px-3 py-1 bg-white rounded-lg shadow-sm border border-amber-200">
                    Enter
                  </kbd>{" "}
                  Create & print ✨
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
