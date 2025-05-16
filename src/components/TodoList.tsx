import { Accessor, For, Show } from "solid-js";
import { Todo } from "../types";
import TodoItem from "./TodoItem";
import { filteredTodos, store } from "../stores/todoStore";



const TodoList = () => {
  return (

    <ul class="space-y-2">
      <Show when={filteredTodos().length === 0}>
        <p class="text-center text-gray-500 italic py-4">No todos yet. Add one above!</p>
      </Show>

      <For each={filteredTodos()}>
        {(item) => (
          <TodoItem todo={item} />
        )}
      </For>
    </ul>
  )
}
export default TodoList

