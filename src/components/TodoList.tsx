// src/components/TodoList.tsx
import { Component, For, Show } from 'solid-js';
import { store, useFilteredTodos } from '../stores/todoStore';
import TodoItem from './TodoItem';

const TodoList: Component = () => {
  // Use the centralized filtered todos function
  const filteredTodos = useFilteredTodos();

  return (
    <div>

      <div class="text-xs text-gray-500 mb-2">
        <Show when={store.selectedProject || store.selectedArea}>
          <div class="flex flex-wrap gap-1 mb-1">
            <Show when={store.selectedProject}>
              <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                Project: {store.selectedProject}
              </span>
            </Show>
            <Show when={store.selectedArea}>
              <span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                Area: {store.selectedArea}
              </span>
            </Show>
          </div>
        </Show>
      </div>


      {/* TODO: check if todos are loading and show loading state instead of showing this when todos=0 */}
      <Show
        when={filteredTodos().length > 0}
        fallback={<p class="text-center text-gray-500 italic py-4">No todos found with the current filters.</p>}
      >

        <div class="space-y-2 mb-6">
          <For each={filteredTodos()}>
            {(item) => <TodoItem todo={item} />}
          </For>
        </div>
      </Show>



    </div>

  );
};

export default TodoList;
