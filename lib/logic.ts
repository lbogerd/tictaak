import { Task } from "@prisma/client";
import { DateTime } from "luxon";

/**
 * Given the list of weekdays a task repeats on (1 = Mon … 7 = Sun),
 * return the next print date (today counts if it’s in the list).
 */
export function calculateNextPrintDate(recursOnDays: Task["recursOnDays"]) {
  if (!recursOnDays?.length) throw new Error("Recurrence pattern invalid");

  const today = DateTime.now().startOf("day");
  const todayIdx = today.weekday; // 1-7 ⟹ Luxon style

  // How many days ahead is each allowed weekday? (0-6)
  const daysAhead = recursOnDays.map(
    (d) => (d - todayIdx + 7) % 7 // wrap around the week
  );

  // Pick the smallest offset (0 = today, 1 = tomorrow, …)
  const soonest = Math.min(...daysAhead);

  return today.plus({ days: soonest }).toJSDate();
}
