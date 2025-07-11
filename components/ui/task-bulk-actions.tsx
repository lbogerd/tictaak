import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Trash2, X } from "lucide-react";

interface TaskBulkActionsProps {
  selectedCount: number;
  onBulkPrint?: () => void;
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
  isPrintingBulk?: boolean;
  colorScheme?: "rose" | "purple" | "green" | "amber";
}

export function TaskBulkActions({
  selectedCount,
  onBulkPrint,
  onBulkDelete,
  onClearSelection,
  isPrintingBulk = false,
  colorScheme = "rose",
}: TaskBulkActionsProps) {
  if (selectedCount === 0) return null;

  const colorSchemes = {
    rose: "border-rose-200 bg-rose-50",
    purple: "border-purple-200 bg-purple-50",
    green: "border-green-200 bg-green-50",
    amber: "border-amber-200 bg-amber-50",
  };

  const colors = colorSchemes[colorScheme];

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 ${colors} border rounded-2xl p-4 shadow-lg backdrop-blur-sm z-50`}>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} task{selectedCount !== 1 ? "s" : ""} selected
        </span>
        
        <div className="flex items-center gap-2">
          {onBulkPrint && (
            <Button
              size="sm"
              onClick={onBulkPrint}
              disabled={isPrintingBulk}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Printer className="w-4 h-4 mr-1" />
              {isPrintingBulk ? "Printing..." : "Print All"}
            </Button>
          )}
          
          {onBulkDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
          
          {onClearSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700 rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}