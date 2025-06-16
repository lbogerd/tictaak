import TodoWireframe from "../components/todo-wireframe";
import { getTasks, getCategories, initializeDefaultCategories } from "@/lib/actions";

export default async function Page() {
  // Initialize default categories if needed
  await initializeDefaultCategories();
  
  // Fetch data
  const [tasks, categories] = await Promise.all([
    getTasks(),
    getCategories()
  ]);

  return <TodoWireframe initialTasks={tasks} initialCategories={categories} />;
}
