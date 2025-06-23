import TodoWireframe from "../components/todo-wireframe";
import { getTasks, getCategories, initializeDefaultCategories } from "@/lib/actions";

export default async function Page() {
  // Initialize default categories if needed
  await initializeDefaultCategories();
  
  // Fetch data
  const [tasksData, categories] = await Promise.all([
    getTasks({ limit: 10, page: 1 }),
    getCategories()
  ]);

  return <TodoWireframe initialTasksData={tasksData} initialCategories={categories} />;
}
