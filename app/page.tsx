import TodoPage from "../components/todo-page";
import { getTasks, getCategories } from "@/lib/actions";

export default async function Page() {
  // Fetch data
  const [tasksData, categories] = await Promise.all([
    getTasks({ limit: 10, page: 1 }),
    getCategories(),
  ]);

  return (
    <TodoPage initialTasksData={tasksData} initialCategories={categories} />
  );
}
