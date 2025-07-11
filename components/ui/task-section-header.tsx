import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TaskSectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
  countLabel?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    isToggled?: boolean;
  };
  colorScheme?: "rose" | "purple" | "green" | "amber";
  selectionMode?: boolean;
  selectedCount?: number;
  totalCount?: number;
  onToggleSelection?: () => void;
  onToggleSelectionMode?: () => void;
}

export function TaskSectionHeader({
  icon,
  title,
  count,
  countLabel = "items",
  actionButton,
  colorScheme = "rose",
  selectionMode = false,
  selectedCount = 0,
  totalCount = 0,
  onToggleSelection,
  onToggleSelectionMode,
}: TaskSectionHeaderProps) {
  const colorSchemes = {
    rose: {
      title: "text-amber-800",
      badge: "bg-rose-50 border-rose-200 text-rose-700",
      button: "text-rose-600 hover:text-rose-800 hover:bg-rose-50",
    },
    purple: {
      title: "text-purple-800", 
      badge: "bg-purple-50 border-purple-200 text-purple-700",
      button: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
    },
    green: {
      title: "text-green-800",
      badge: "bg-green-50 border-green-200 text-green-700", 
      button: "text-green-600 hover:text-green-800 hover:bg-green-50",
    },
    amber: {
      title: "text-amber-800",
      badge: "bg-amber-50 border-amber-200 text-amber-700",
      button: "text-amber-600 hover:text-amber-800 hover:bg-amber-50",
    },
  };

  const colors = colorSchemes[colorScheme];

  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isSomeSelected = selectedCount > 0;

  return (
    <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex flex-col space-y-2 sm:space-y-0">
        <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap ${colors.title}`}>
          {icon}
          <span className="min-w-0">{title}</span>
          {count !== undefined && count > 0 && (
            <Badge
              variant="outline"
              className={`text-xs sm:text-sm ${colors.badge}`}
            >
              {count} {countLabel}
            </Badge>
          )}
          {selectionMode && selectedCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs sm:text-sm bg-blue-50 border-blue-200 text-blue-700"
            >
              {selectedCount} selected
            </Badge>
          )}
        </h2>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {selectionMode && totalCount > 0 && onToggleSelection && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSelection}
            className={`rounded-xl text-sm ${colors.button} border-current`}
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </Button>
        )}
        
        {onToggleSelectionMode && totalCount > 0 && (
          <Button
            variant={selectionMode ? "default" : "ghost"}
            size="sm"
            onClick={onToggleSelectionMode}
            className={`rounded-xl text-sm ${selectionMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : colors.button}`}
          >
            {selectionMode ? "Done" : "Select"}
          </Button>
        )}

        {actionButton && !selectionMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={actionButton.onClick}
            className={`rounded-xl text-sm sm:text-base justify-center sm:justify-start ${colors.button}`}
          >
            {actionButton.icon && (
              <span className="w-4 h-4 mr-2 flex-shrink-0">
                {actionButton.icon}
              </span>
            )}
            <span className="truncate">{actionButton.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}