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
}

export function TaskSectionHeader({
  icon,
  title,
  count,
  countLabel = "items",
  actionButton,
  colorScheme = "rose",
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
        </h2>
      </div>

      {actionButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={actionButton.onClick}
          className={`rounded-xl w-full sm:w-auto text-sm sm:text-base justify-center sm:justify-start ${colors.button}`}
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
  );
}