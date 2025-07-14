"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategory, deleteCategory } from "@/lib/server-actions/category";
import { Category } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { useState } from "react";


type CategorySelectProps = {
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  categories: Category[];
  setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void;
};

export default function CategorySelect({
  selectedCategoryId,
  setSelectedCategoryId,
  categories,
  setCategories,
}: CategorySelectProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId("");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category.");
    }
  };

  return (
    <div className="w-full md:w-52">
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
          <SelectTrigger className="rounded-2xl py-1 md:py-2 w-full md:w-auto border-rose-200 focus:border-rose-400">
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
  );
}