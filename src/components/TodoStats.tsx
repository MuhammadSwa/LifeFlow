// src/components/TodoStats.tsx
import { Component, Show } from "solid-js";
import { loadTodos, useFilteredTodos } from "../stores/todoStore";
import { store } from "../stores/todoStore";

export const TodoStats: Component = () => {
  const allTodos = loadTodos();
  const filteredTodos = useFilteredTodos();

  // Calculate counts
  const completedCount = () => filteredTodos().filter(todo => todo.completed).length;
  const activeCount = () => filteredTodos().filter(todo => !todo.completed).length;
  const totalFilteredCount = () => filteredTodos().length;
  const allTodosCount = () => allTodos().length;

  // Check if we're currently filtering
  const isFiltered = () => {
    return store.selectedProject !== undefined ||
      store.selectedArea !== undefined ||
      store.activeFilter.type !== 'ALL';
  };

  return (
    <Show when={allTodosCount() > 0}>
      <div class="flex justify-between text-sm text-gray-500 mb-4 w-full max-w-lg">
        <div>
          <span>{totalFilteredCount()} {isFiltered() ? 'filtered' : 'total'} item{totalFilteredCount() !== 1 ? 's' : ''}</span>

          <Show when={isFiltered() && totalFilteredCount() !== allTodosCount()}>
            <span class="text-gray-400 ml-1">
              (out of {allTodosCount()})
            </span>
          </Show>
        </div>

        <div class="flex gap-3">
          <span>{activeCount()} active</span>
          <span>{completedCount()} completed</span>
        </div>
      </div>
    </Show>
  );
};

export default TodoStats;
