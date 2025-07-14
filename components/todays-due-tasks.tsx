import {
  getDueTasks as getTodaysDueTasks,
  getUpcomingTasks,
} from "@/lib/server-actions/task";
import { Task } from "@/types";
import TodaysDueTasksClient from "@/components/todays-due-tasks-client";

interface TodaysDueTasksProps {
  onTaskPrinted?: (task: Task) => void;
}

export default async function TodaysDueTasks({
  onTaskPrinted,
}: TodaysDueTasksProps) {
  // Server-side data fetching
  const [dueTasks, upcomingTasks] = await Promise.all([
    getTodaysDueTasks(),
    getUpcomingTasks(),
  ]);

  return (
    <TodaysDueTasksClient
      initialDueTasks={dueTasks}
      initialUpcomingTasks={upcomingTasks}
      onTaskPrinted={onTaskPrinted}
    />
  );
}
