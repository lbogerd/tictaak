import React from "react";
import { Badge } from "@/components/ui/badge";

interface TaskGroupProps {
  title: string;
  icon?: React.ReactNode;
  count: number;
  countLabel?: string;
  children: React.ReactNode;
  colorScheme?: "rose" | "purple" | "green" | "amber";
  selectionMode?: boolean;
  selectedCount?: number;
  onToggleGroupSelection?: () => void;
}

export function TaskGroup({
  title,
  icon,
  count,
  countLabel = "task",
  children,
  colorScheme = "rose",
  selectionMode = false,
  selectedCount = 0,
  onToggleGroupSelection,
}: TaskGroupProps) {
  const colorSchemes = {
    rose: {
      title: "text-rose-600",
      badge: "bg-rose-50 border-rose-200 text-rose-700",
    },
    purple: {
      title: "text-purple-600",
      badge: "bg-purple-50 border-purple-200 text-purple-700",
    },
    green: {
      title: "text-green-600",
      badge: "bg-green-50 border-green-200 text-green-700",
    },
    amber: {
      title: "text-amber-600",
      badge: "bg-amber-50 border-amber-200 text-amber-700",
    },
  };

  const colors = colorSchemes[colorScheme];
  const isAllSelected = selectedCount === count;

  return (
    <div>
      <div
        className={`text-sm font-medium mb-3 flex items-center gap-2 ${colors.title}`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="w-4 h-4">{icon}</span>}
          {title}
          <Badge variant="outline" className={`text-xs ${colors.badge}`}>
            {count} {countLabel}
            {count !== 1 ? "s" : ""}
          </Badge>
          {selectionMode && selectedCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 border-blue-200 text-blue-700"
            >
              {selectedCount} selected
            </Badge>
          )}
        </div>

        {selectionMode && onToggleGroupSelection && count > 0 && (
          <button
            onClick={onToggleGroupSelection}
            className={`text-xs px-2 py-1 rounded-md hover:bg-gray-100 ${colors.title} underline`}
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}
