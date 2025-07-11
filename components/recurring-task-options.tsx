import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Repeat } from "lucide-react";

interface RecurringTaskOptionsProps {
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  recurringType: string;
  setRecurringType: (value: string) => void;
  selectedDays: number[];
  setSelectedDays: (value: number[]) => void;
}

export default function RecurringTaskOptions({
  isRecurring,
  setIsRecurring,
  recurringType,
  setRecurringType,
  selectedDays,
  setSelectedDays,
}: RecurringTaskOptionsProps) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(
      selectedDays.includes(dayIndex)
        ? selectedDays.filter((d) => d !== dayIndex)
        : [...selectedDays, dayIndex].sort(),
    );
  };

  return (
    <div className="border-t border-rose-100 pt-6">
      <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
        <Button
          type="button"
          variant={isRecurring ? "default" : "outline"}
          onClick={() => setIsRecurring(!isRecurring)}
          className={`rounded-xl transition-all duration-200 ${
            isRecurring
              ? "bg-purple-500 hover:bg-purple-600 text-white"
              : "border-purple-200 text-purple-700 hover:bg-purple-50"
          }`}
        >
          <Repeat className="w-4 h-4 mr-2" />
          {isRecurring ? "Recurring Task" : "Make Recurring"}
        </Button>

        {isRecurring && (
          <Select value={recurringType} onValueChange={setRecurringType}>
            <SelectTrigger className="w-full md:w-32 rounded-xl border-purple-200 focus:border-purple-400 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl text-gray-900">
              <SelectItem value="daily">Every day</SelectItem>
              <SelectItem value="weekly">Some days</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isRecurring && recurringType === "weekly" && (
        <div className="space-y-3">
          <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select days to repeat:
          </p>
          <div className="flex gap-2 flex-wrap">
            {dayNames.map((day, index) => (
              <Button
                key={day}
                type="button"
                variant={selectedDays.includes(index) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDay(index)}
                className={`w-12 h-8 rounded-lg text-xs transition-all duration-200 ${
                  selectedDays.includes(index)
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "border-purple-200 text-purple-700 hover:bg-purple-50"
                }`}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
