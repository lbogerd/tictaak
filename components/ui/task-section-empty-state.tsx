import React from "react";

interface TaskSectionEmptyStateProps {
  emoji: string;
  primaryMessage: string;
  secondaryMessage: string;
  colorScheme?: "rose" | "purple" | "green" | "amber";
}

export function TaskSectionEmptyState({
  emoji,
  primaryMessage,
  secondaryMessage,
  colorScheme = "rose",
}: TaskSectionEmptyStateProps) {
  const colorSchemes = {
    rose: {
      text: "text-amber-600",
      background: "bg-amber-50",
    },
    purple: {
      text: "text-purple-600",
      background: "bg-purple-50",
    },
    green: {
      text: "text-green-600",
      background: "bg-green-50",
    },
    amber: {
      text: "text-amber-600",
      background: "bg-amber-50",
    },
  };

  const colors = colorSchemes[colorScheme];

  return (
    <div className={`text-center py-4 md:py-8 ${colors.text}`}>
      <div className="text-4xl mb-4">{emoji}</div>
      <p className="text-lg mb-2">{primaryMessage}</p>
      <p
        className={`text-sm ${colors.background} rounded-2xl px-6 py-3 inline-block mt-2`}
      >
        {secondaryMessage}
      </p>
    </div>
  );
}
