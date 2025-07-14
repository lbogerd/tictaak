"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Prisma } from "@prisma/client";
import { Plus, Printer, X } from "lucide-react";
import { useCallback } from "react";
import RecurringTaskOptions from "@/components/recurring-task-options";
import ScheduleTaskOptions from "@/components/schedule-task-options";
import CategorySelect from "@/components/category-select";

type Category = Prisma.CategoryGetPayload<Record<string, never>>;

type NewTaskFormProps = {
  showForm: boolean;
  newTitle: string;
  setNewTitle: (title: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  categories: Category[];
  setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void;
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  recurringType: string;
  setRecurringType: (type: string) => void;
  selectedDays: number[];
  setSelectedDays: (days: number[]) => void;
  isScheduled: boolean;
  setIsScheduled: (value: boolean) => void;
  scheduledFor: Date | null;
  setScheduledFor: (date: Date | null) => void;
  isPrinting: boolean;
  onCreateTask: (print: boolean) => void;
  onCloseForm: () => void;
  onSetShowForm: (show: boolean) => void;
};

export default function NewTaskForm({
  showForm,
  newTitle,
  setNewTitle,
  selectedCategoryId,
  setSelectedCategoryId,
  categories,
  setCategories,
  isRecurring,
  setIsRecurring,
  recurringType,
  setRecurringType,
  selectedDays,
  setSelectedDays,
  isScheduled,
  setIsScheduled,
  scheduledFor,
  setScheduledFor,
  isPrinting,
  onCreateTask,
  onCloseForm,
  onSetShowForm,
}: NewTaskFormProps) {
  const handleRecurringChange = useCallback((value: boolean) => {
    setIsRecurring(value);
    if (value) {
      setIsScheduled(false);
      setScheduledFor(null);
    }
  }, [setIsRecurring, setIsScheduled, setScheduledFor]);

  const handleScheduledChange = useCallback((value: boolean) => {
    setIsScheduled(value);
    if (value) {
      setIsRecurring(false);
      setRecurringType("weekly");
      setSelectedDays([]);
    }
  }, [setIsScheduled, setIsRecurring, setRecurringType, setSelectedDays]);

  if (!showForm) {
    return (
      <div className="text-center flex flex-col items-center gap-4">
        <Button
          onClick={() => onSetShowForm(true)}
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <Input
          placeholder="What needs to be done?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCreateTask(true)}
          className="flex-1 md:text-lg py-2 md:py-4 rounded-2xl border-rose-200 focus:border-rose-400 focus:ring-rose-200"
          autoFocus
        />

        <CategorySelect
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          categories={categories}
          setCategories={setCategories}
        />
      </div>

      {/* Task Type Options - Mutually Exclusive */}
      {!isScheduled && (
        <RecurringTaskOptions
          isRecurring={isRecurring}
          setIsRecurring={handleRecurringChange}
          recurringType={recurringType}
          setRecurringType={setRecurringType}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
        />
      )}

      {!isRecurring && (
        <ScheduleTaskOptions
          isScheduled={isScheduled}
          setIsScheduled={handleScheduledChange}
          scheduledFor={scheduledFor}
          setScheduledFor={setScheduledFor}
        />
      )}

      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex gap-4 w-full md:w-auto flex-col md:flex-row">
          {isRecurring ? (
            <Button
              onClick={() => onCreateTask(false)}
              className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
              disabled={
                !newTitle.trim() || !selectedCategoryId || isPrinting
              }
            >
              <Plus className="w-5 h-5 mr-2" />
              Create
            </Button>
          ) : isScheduled ? (
            <Button
              onClick={() => onCreateTask(false)}
              className="bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
              disabled={
                !newTitle.trim() || !selectedCategoryId || !scheduledFor
              }
            >
              <Plus className="w-5 h-5 mr-2" />
              Schedule
            </Button>
          ) : (
            <Button
              onClick={() => onCreateTask(true)}
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
            onClick={onCloseForm}
            size="lg"
            className="rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <X className="w-4 h-4 mr-2" />
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}