import { getTasksPrintedToday } from "@/lib/server-actions/task";
import TodaysPrintedTasksClient from "@/components/todays-printed-tasks-client";

export default async function TodaysPrintedTasks() {
  // Server-side data fetching
  const tasks = await getTasksPrintedToday();

  return (
    <TodaysPrintedTasksClient initialTasks={tasks} />
  );
}
