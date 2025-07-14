import {
  getTasks,
} from "@/lib/server-actions/task";
import { getCategories } from "@/lib/server-actions/category";
import TodaysPrintedTasks from "@/components/todays-printed-tasks";
import TodaysDueTasks from "@/components/todays-due-tasks";
import AppHeader from "@/components/app-header";
import AppFooter from "@/components/app-footer";
import ClientPage from "@/components/client-page";

export default async function Page() {
  // Server-side data fetching
  const [initialTasksData, initialCategories] = await Promise.all([
    getTasks({ limit: 10, page: 1 }),
    getCategories(),
  ]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <AppHeader />

        {/* Client-side interactivity */}
        <ClientPage 
          initialTasks={initialTasksData.tasks}
          initialTasksMeta={initialTasksData}
          initialCategories={initialCategories}
        />

        {/* Today's Due Tasks */}
        <TodaysDueTasks />

        {/* Today's Printed Tasks */}
        <TodaysPrintedTasks />

        {/* Footer Info */}
        <AppFooter />
      </div>
    </div>
  );
}
