import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateTime } from "luxon";
import { Calendar, CalendarDays } from "lucide-react";

interface ScheduleTaskOptionsProps {
  isScheduled: boolean;
  setIsScheduled: (value: boolean) => void;
  scheduledFor: Date | null;
  setScheduledFor: (value: Date | null) => void;
}

export default function ScheduleTaskOptions({
  isScheduled,
  setIsScheduled,
  scheduledFor,
  setScheduledFor,
}: ScheduleTaskOptionsProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return DateTime.fromJSDate(date).toLocaleString({
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setScheduledFor(null);
      return;
    }

    setScheduledFor(date);
  };

  return (
    <div className="border-t border-rose-100 pt-6">
      <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
        <Button
          type="button"
          variant={isScheduled ? "default" : "outline"}
          onClick={() => setIsScheduled(!isScheduled)}
          className={`rounded-xl transition-all duration-200 ${
            isScheduled
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "border-blue-200 text-blue-700 hover:bg-blue-50"
          }`}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          {isScheduled ? "Scheduled Task" : "Schedule Task"}
        </Button>

        {isScheduled && scheduledFor && (
          <div className="text-sm text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded-lg">
            {formatDate(scheduledFor)}
          </div>
        )}
      </div>

      {isScheduled && (
        <div className="space-y-3">
          <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            When should this task be due?
          </p>
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="date-picker"
                className="text-xs text-blue-600 font-medium"
              >
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-picker"
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal border-blue-200 hover:bg-blue-50",
                      !scheduledFor && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {scheduledFor
                      ? DateTime.fromJSDate(scheduledFor).toLocaleString(
                          DateTime.DATE_FULL
                        )
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={scheduledFor || undefined}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date <= DateTime.now().startOf("day").toJSDate()
                    }
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
