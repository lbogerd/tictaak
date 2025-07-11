import React from "react";
import { Loader2 } from "lucide-react";

interface TaskSectionLoadingStateProps {
  message: string;
  colorScheme?: "rose" | "purple" | "green" | "amber";
}

export function TaskSectionLoadingState({
  message,
  colorScheme = "rose",
}: TaskSectionLoadingStateProps) {
  const colorSchemes = {
    rose: {
      spinner: "text-rose-500",
      text: "text-rose-700",
    },
    purple: {
      spinner: "text-purple-500",
      text: "text-purple-700",
    },
    green: {
      spinner: "text-green-500",
      text: "text-green-700",
    },
    amber: {
      spinner: "text-amber-500",
      text: "text-amber-700",
    },
  };

  const colors = colorSchemes[colorScheme];

  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className={`w-6 h-6 animate-spin ${colors.spinner}`} />
      <span className={`ml-2 ${colors.text}`}>{message}</span>
    </div>
  );
}
