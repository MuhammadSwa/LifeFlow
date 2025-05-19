import { Show } from "solid-js"
import { loadTodos } from "../stores/todoStore";

export const TodoStats = () => {

  const todos = loadTodos()

  const completedCount = () => todos().filter((todo) => todo.completed).length;
  const totalCount = () => todos().length;
  return (

    <Show when={totalCount() > 0}>
      <div class="flex justify-between text-sm text-gray-500 mb-4 w-full max-w-lg">
        <span>{totalCount()} total item{totalCount() !== 1 ? 's' : ''}</span>
        <span>{completedCount()} completed</span>
      </div>
    </Show>
  )
}
