import { createMemo, For, Show } from "solid-js";
import TodoItem from "./TodoItem";
import { loadTodos, store } from "../stores/todoStore";
import { FilterType } from "../types";




const TodoList = () => {
  // The core filtered and sorted list
  const filteredTodos = createMemo(() => {
    let items = loadTodos();
    let todos = [...items()]; // Create a mutable copy for filtering/sorting

    // Apply filter
    switch (store.activeFilter.type) {
      case FilterType.ACTIVE:
        todos = todos.filter(todo => !todo.completed);
        break;
      case FilterType.COMPLETED:
        todos = todos.filter(todo => todo.completed);
        break;
      case FilterType.PROJECT:
        if (store.selectedProject) {
          todos = todos.filter(todo => todo.projectName === store.selectedProject);
        }
        break;
      case FilterType.AREA:
        if (store.selectedArea) {
          todos = todos.filter(todo => todo.areaName === store.selectedArea);
        }
        break;
      // FilterType.ALL and FilterType.PRIORITY don't filter out items here,
      // PRIORITY is mainly for sorting.
    }

    // Apply sorting
    todos.sort((a, b) => {
      // 1. Completed tasks to the bottom (unless filtering for completed)
      if (store.activeFilter.type !== FilterType.COMPLETED) {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
      }
      // If both are completed, sort by completionDate descending (newest first)
      if (a.completed && b.completed) {
        // Ensure completionDate is treated as a number for comparison
        const dateA = a.completionDate ?? 0;
        const dateB = b.completionDate ?? 0;
        return dateB - dateA; // Descending
      }

      // 2. Priority (A is highest) - only for active tasks
      if (!a.completed && !b.completed) {
        // Ensure priority is handled correctly if null/undefined
        const prioA = a.priority || 'Z~'; // Treat no priority as lowest (after Z, use a char higher than D)
        const prioB = b.priority || 'Z~';
        if (prioA < prioB) return -1;
        if (prioA > prioB) return 1;
      }

      // 3. Creation Date (newest first as per your original query order, if available)
      // createdAt is a number (timestamp)
      const createdAtA = a.createdAt ?? 0;
      const createdAtB = b.createdAt ?? 0;
      if (createdAtA !== createdAtB) {
        return createdAtB - createdAtA; // Descending for newest first
      }
      // (Your original code had localeCompare for creationDate, which implies it was a string.
      // If createdAt is a number (timestamp from Date.now()), direct subtraction is better.)

      // 4. Fallback to raw text
      return a.rawText.localeCompare(b.rawText);
    });

    return todos;
  });

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

