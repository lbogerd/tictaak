"use client";

import React from "react";
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
  Heart,
  Ticket,
  Archive,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { DateTime } from "luxon";

// Mock data - just recent tasks for reprinting
const now = new Date();
const mockRecentTasks = [
  {
    id: 1,
    title: "🛒 Buy groceries",
    category: "Personal",
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 2,
    title: "🦷 Call dentist",
    category: "Health",
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 3,
    title: "📝 Submit report",
    category: "Work",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 4,
    title: "🐕 Walk the dog",
    category: "Personal",
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    id: 5,
    title: "📊 Review presentation",
    category: "Work",
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
  },
];

const mockCategories = ["Personal", "Work", "Health", "Shopping", "Projects"];
const mockQuickTasks = [
  "Buy groceries 🛒",
  "Call dentist 🦷",
  "Walk the dog 🐕",
  "Submit report 📝",
];

export default function TodoWireframe() {
  const [showNewForm, setShowNewForm] = useState(false);
  const [recentTasks, setRecentTasks] = useState(mockRecentTasks);
  const [newTitle, setNewTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCreateAndPrint = () => {
    if (newTitle.trim()) {
      const newTask = {
        id: Date.now(),
        title: newTitle,
        category: selectedCategory || "Personal",
        createdAt: new Date(),
      };

      // Add to recent tasks, filter to unique by title (keep most recent)
      setRecentTasks((prevTasks) => {
        // Place newTask at the front, then filter out any tasks with the same title (case-insensitive) after the first occurrence
        const tasks = [newTask, ...prevTasks];
        const seenTitles = new Set<string>();
        const uniqueTasks = [];
        for (const task of tasks) {
          const normalizedTitle = task.title.trim().toLowerCase();
          if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            uniqueTasks.push(task);
          }
        }
        return uniqueTasks.slice(0, 10); // Keep only 10 most recent unique tasks
      });

      // Print the task
      handlePrint(newTask);

      // Reset form
      setNewTitle("");
      setSelectedCategory("");
      setShowNewForm(false);
    }
  };

  const handlePrint = (task: any) => {
    console.log(`Printing: ${task.title} [${task.category}]`);
    // Print logic would go here
    // Show brief success feedback
  };

  const handleDeleteFromHistory = (id: number) => {
    setRecentTasks(recentTasks.filter((task) => task.id !== id));
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
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-52 rounded-2xl border-rose-200 focus:border-rose-400">
                    <SelectValue placeholder="Choose a category 🏷️" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Button
                    onClick={handleCreateAndPrint}
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                    disabled={!newTitle.trim()}
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    Create & Print
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
              <div className="pt-6 border-t border-rose-100">
                <p className="text-sm text-amber-700 mb-4 font-medium flex items-center gap-1">
                  <Rocket className="w-4 h-4 mr-2" />
                  Quick favorites (click to use):
                </p>
                <div className="flex gap-3 flex-wrap">
                  {mockQuickTasks.map((title) => (
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
            </div>
          )}
        </div>

        {/* Recent Tasks - For Reprinting */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-rose-100 p-8">
          <h2 className="text-2xl font-bold text-amber-800 mb-3 flex items-center gap-2">
            <Archive className="w-6 h-6" />
            Your Recent Tasks
          </h2>

          {recentTasks.length === 0 ? (
            <div className="text-center py-12 text-amber-600">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-lg mb-2">No recent tasks yet!</p>
              <p className="text-sm bg-amber-50 rounded-2xl px-6 py-3 inline-block">
                Tasks you create will appear here for easy reprinting 💫
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTasks.map((task) => (
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
                            {task.category}
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
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 rounded-xl"
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Reprint
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewTitle(task.title);
                            setSelectedCategory(task.category);
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
