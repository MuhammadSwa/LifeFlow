import { Show } from "solid-js"
import { store } from "../stores/todoStore";

export const TodoStats = () => {

  const completedCount = () => store.todos.filter((todo) => todo.completed).length;
  const totalCount = () => store.todos.length;
  return (

    <Show when={totalCount() > 0}>
      <div class="flex justify-between text-sm text-gray-500 mb-4 w-full max-w-lg">
        <span>{totalCount()} total item{totalCount() !== 1 ? 's' : ''}</span>
        <span>{completedCount()} completed</span>
      </div>
    </Show>
  )
}
