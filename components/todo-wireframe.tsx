"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Printer,
  Edit3,
  X,
  Trash2,
  Ticket,
  Archive,
  Rocket,
} from "lucide-react";
import { DateTime } from "luxon";
import { createTask, deleteTask, createCategory, deleteCategory } from "@/lib/actions";
import { printTask } from "@/lib/printer";

type Category = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type Task = {
  id: string;
  title: string;
  categoryId: string;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
};

type TodoWireframeProps = {
  initialTasks: Task[];
  initialCategories: Category[];
};

export default function TodoWireframe({ initialTasks, initialCategories }: TodoWireframeProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [categories, setCategories] = useState(initialCategories);
  const [newTitle, setNewTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        setShowNewForm(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateAndPrint = async () => {
    if (!newTitle.trim() || !selectedCategoryId) return;

    try {
      const task = await createTask(newTitle, selectedCategoryId);
      setTasks(prev => [task, ...prev]);

      // Print the task
      await handlePrint(task);

      // Reset form
      setNewTitle("");
      setSelectedCategoryId("");
      setShowNewForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handlePrint = async (task: Task) => {
    if (isPrinting) return;
    
    try {
      setIsPrinting(true);
      const result = await printTask(task.title, task.category.name, task.createdAt);
      
      if (result.success) {
        console.log('Task printed successfully');
      } else {
        console.error('Printing failed:', result.error);
        alert('Printing failed: ' + result.error);
      }
    } catch (error) {
      console.error('Printing error:', error);
      alert('Printing error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDeleteFromHistory = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const category = await createCategory(newCategoryName);
      setCategories(prev => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCategoryId(category.id);
      setNewCategoryName("");
      setIsCreatingCategory(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. It might already exist.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category? All tasks in this category will also be deleted.')) return;

    try {
      await deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setTasks(prev => prev.filter(task => task.categoryId !== categoryId));
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId("");
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category.');
    }
  };

  // Quick task templates based on existing tasks
  const quickTasks = tasks.slice(0, 4).map(task => task.title);

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
                  Ctrl+N
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
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAndPrint()}
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
                          <div key={category.id} className="flex items-center justify-between group">
                            <SelectItem value={category.id} className="rounded-lg flex-1">
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

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Button
                    onClick={handleCreateAndPrint}
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                    disabled={!newTitle.trim() || !selectedCategoryId || isPrinting}
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    {isPrinting ? 'Printing...' : 'Create & Print'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                    size="lg"
                    className="rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Maybe later
                  </Button>
                </div>
              </div>

              {/* Quick Reuse Section */}
              {quickTasks.length > 0 && (
                <div className="pt-6 border-t border-rose-100">
                  <p className="text-sm text-amber-700 mb-4 font-medium flex items-center gap-1">
                    <Rocket className="w-4 h-4 mr-2" />
                    Quick reuse (click to use):
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {quickTasks.map((title) => (
                      <Button
                        key={title}
                        variant="outline"
                        size="sm"
                        onClick={() => setNewTitle(title)}
                        className="text-sm hover:bg-rose-50 hover:border-rose-300 rounded-xl border-rose-200 text-rose-700 transition-all duration-200"
                      >
                        {title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Tasks - For Reprinting */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-rose-100 p-8">
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
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] rounded-2xl border-rose-100 bg-gradient-to-r from-white to-rose-50/50"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-4">
                          <span className="text-lg text-amber-800 font-medium">
                            {task.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs rounded-full border-rose-200 text-rose-700 bg-rose-50"
                          >
                            {task.category.name}
                          </Badge>
                          <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                            {DateTime.fromJSDate(task.createdAt).toRelative()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(task)}
                          disabled={isPrinting}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 rounded-xl"
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          {isPrinting ? 'Printing...' : 'Reprint'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewTitle(task.title);
                            setSelectedCategoryId(task.categoryId);
                            setShowNewForm(true);
                          }}
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit & Print
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFromHistory(task.id)}
                          className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    Ctrl+N
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