import React from "react";

interface TaskSectionContainerProps {
  children: React.ReactNode;
  className?: string;
  borderColor?: "rose" | "purple" | "green" | "amber";
}

export function TaskSectionContainer({
  children,
  className = "",
  borderColor = "rose",
}: TaskSectionContainerProps) {
  const borderColorClasses = {
    rose: "border-rose-100",
    purple: "border-purple-100", 
    green: "border-green-100",
    amber: "border-amber-100",
  };

  const combinedClassName = `bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border p-8 mb-8 ${borderColorClasses[borderColor]} ${className}`.trim();

  return (
    <div className={combinedClassName}>
      {children}
    </div>
  );
}