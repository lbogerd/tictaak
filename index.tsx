"use client";

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
import { Plus, Printer, Edit3, X, Trash2 } from "lucide-react";
import { useState } from "react";

// Mock data - just recent tasks for reprinting
const mockRecentTasks = [
  {
    id: 1,
    title: "Buy groceries",
    category: "Personal",
    createdAt: "2 hours ago",
  },
  { id: 2, title: "Call dentist", category: "Health", createdAt: "1 day ago" },
  { id: 3, title: "Submit report", category: "Work", createdAt: "2 days ago" },
  {
    id: 4,
    title: "Walk the dog",
    category: "Personal",
    createdAt: "3 days ago",
  },
  {
    id: 5,
    title: "Review presentation",
    category: "Work",
    createdAt: "1 week ago",
  },
];

const mockCategories = ["Personal", "Work", "Health", "Shopping", "Projects"];
const mockQuickTasks = [
  "Buy groceries",
  "Call dentist",
  "Walk the dog",
  "Submit report",
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
        createdAt: "Just now",
      };

      // Add to recent tasks
      setRecentTasks([newTask, ...recentTasks.slice(0, 9)]); // Keep only 10 most recent

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Task Printer
          </h1>
          <p className="text-gray-600">
            Create tasks, print tickets, get things done
          </p>
        </div>

        {/* Main Action - Create & Print */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {!showNewForm ? (
            <div className="text-center">
              <Button
                onClick={() => setShowNewForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 h-auto"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-3" />
                Create & Print Task
              </Button>
              <div className="mt-4 text-sm text-gray-500">
                Press{" "}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                  Ctrl+N
                </kbd>{" "}
                for quick access
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAndPrint()}
                  className="flex-1 text-lg py-3"
                  autoFocus
                />
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateAndPrint}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                    disabled={!newTitle.trim()}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Create & Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                    size="lg"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Quick Reuse Section */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  Quick add (click to use):
                </p>
                <div className="flex gap-2 flex-wrap">
                  {mockQuickTasks.map((title) => (
                    <Button
                      key={title}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewTitle(title)}
                      className="text-sm hover:bg-blue-50 hover:border-blue-300"
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
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Tasks
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Reprint or reference previously created tasks
          </p>

          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent tasks</p>
              <p className="text-sm">
                Tasks you create will appear here for easy reprinting
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg text-gray-900">
                            {task.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {task.createdAt}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(task)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
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
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit & Print
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFromHistory(task.id)}
                          className="text-gray-400 hover:text-red-600"
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
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Keyboard shortcuts:{" "}
            <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+N</kbd> New task
            • <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> Create
            & print
          </p>
        </div>
      </div>
    </div>
  );
}
