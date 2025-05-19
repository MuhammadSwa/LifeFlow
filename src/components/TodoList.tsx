import { For, onMount, Show } from "solid-js";
import TodoItem from "./TodoItem";
import { loadTodos } from "../stores/todoStore";




const TodoList = () => {

  // const todos = () => []
  const todos = loadTodos()


  onMount(() => {
    console.log("filteredTodos", JSON.stringify(todos()[0]));
  })
  return (

    <ul class="space-y-2">
      {/* <Show when={todos().length === 0}> */}
      {/*   <p class="text-center text-gray-500 italic py-4">No todos yet. Add one above!</p> */}
      {/* </Show> */}
      <For each={todos()}>
        {(item) => (
          <TodoItem todo={item} />
        )}
      </For>
    </ul>
  )
}
export default TodoList

