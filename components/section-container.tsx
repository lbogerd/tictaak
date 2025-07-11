import React, { ReactNode, HTMLAttributes } from "react";
import clsx from "clsx";

// Available colour variants for the border.
type Variant = "default" | "rose" | "amber" | "green" | "purple";

interface SectionContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Colour variant that controls the border colour */
  variant?: Variant;
  /** Section content */
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default: "border-gray-100",
  rose: "border-rose-100",
  amber: "border-amber-100",
  green: "border-green-100",
  purple: "border-purple-100",
};

export default function SectionContainer({
  variant = "default",
  className = "",
  children,
  ...props
}: SectionContainerProps) {
  const borderClass = variantClasses[variant];

  return (
    <div
      {...props}
      className={clsx(
        "bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border p-8 mb-8",
        borderClass,
        className
      )}
    >
      {children}
    </div>
  );
}