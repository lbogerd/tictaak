import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Edit3, Trash2, Loader2 } from "lucide-react";
import { DateTime } from "luxon";
import { Prisma } from "@prisma/client";

type Task = Prisma.TaskGetPayload<{
  include: { category: true };
}>;

interface TaskCardProps {
  task: Task;
  onPrint: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  isPrinting: boolean;
  variant?: "recent" | "recurring";
  additionalBadges?: React.ReactNode[];
  isSelected?: boolean;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

export default function TaskCard({
  task,
  onPrint,
  onEdit,
  onDelete,
  isPrinting,
  variant = "recent",
  additionalBadges = [],
  isSelected = false,
  onSelectionChange,
  selectionMode = false,
}: TaskCardProps) {
  const cardColors = {
    recent: {
      border: "border-rose-100",
      background: "bg-gradient-to-r from-white to-rose-50/50",
      title: "text-amber-800",
      hr: "border-rose-100",
    },
    recurring: {
      border: "border-purple-100",
      background: "bg-gradient-to-r from-white to-purple-50/50",
      title: "text-purple-800",
      hr: "border-purple-100",
    },
  };

  const colors = cardColors[variant];

  const handleSelectionChange = () => {
    if (onSelectionChange) {
      onSelectionChange(task.id, !isSelected);
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-all duration-300 transform hover:scale-[1.01] rounded-2xl ${colors.border} ${colors.background} ${
        isSelected ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''
      }`}
    >
      <CardHeader className="flex flex-col sm:flex-row">
        {selectionMode && (
          <div className="flex items-center mr-3 mb-2 sm:mb-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectionChange}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>
        )}
        <CardTitle className={`text-xl ${colors.title} ${selectionMode ? 'flex-1' : ''}`}>
          {task.title}
        </CardTitle>

        <div className="flex gap-1 sm:self-center sm:ml-auto flex-wrap">
          <Badge
            variant="outline"
            className="text-xs rounded-full border-rose-200 text-rose-700 bg-rose-50"
          >
            {task.category.name}
          </Badge>

          <Badge
            variant="outline"
            className="text-xs rounded-full border-amber-200 text-amber-700 bg-amber-50 capitalize"
            title={DateTime.fromJSDate(task.createdAt)
              .setLocale("nl-NL")
              .toLocaleString(DateTime.DATE_MED)}
          >
            {DateTime.fromJSDate(task.createdAt).toRelativeCalendar()}
          </Badge>

          {additionalBadges.map((badge, index) => (
            <React.Fragment key={index}>{badge}</React.Fragment>
          ))}
        </div>
      </CardHeader>

      <hr className={`${colors.hr} w-full h-px sm:hidden`} />

      <CardFooter className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPrint(task)}
          disabled={isPrinting}
          className={`w-full sm:w-auto rounded-xl ${
            variant === "recurring"
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
              : "text-blue-600 border-blue-200 hover:bg-blue-50"
          }`}
        >
          {isPrinting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Printer className="w-4 h-4 mr-1" />
          )}
          {isPrinting
            ? "Printing..."
            : variant === "recurring"
            ? "Print Now"
            : "Reprint"}
        </Button>

        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(task)}
            className="w-full sm:w-auto text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit & Print
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl ml-auto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
