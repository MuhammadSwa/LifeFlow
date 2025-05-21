import { createEffect, createSignal, Show } from "solid-js";
import { Todo } from "../../shared/schema";
import { deleteTodo, saveEditedTodo, setEditingTodoId, store, toggleTodo } from "../stores/todoStore";
import { useZero } from "../ZeroContext";
import { formatUnixTime } from "../utils/date";
import { Checkbox } from "./CheckBoxComponent";

interface TodoItemProps {
  todo: Todo;
}

const TodoItem = (props: TodoItemProps) => {
  const z = useZero()

  const [editText, setEditText] = createSignal(props.todo.rawText);

  let editInputRef: HTMLInputElement | undefined;
  let todoItemRef: HTMLDivElement | undefined;

  // Check if the todo is currently being edited
  const isEditing = () => store.editingTodoId === props.todo.id;

  const handleEdit = () => {
    setEditText(props.todo.rawText); // Reset editText to current rawText when starting edit
    setEditingTodoId(props.todo.id);
  };

  createEffect(() => {
    // Autofocus the input when editing starts
    if (isEditing() && editInputRef) {
      editInputRef.focus();
      // editInputRef.select(); // Optionally select all text
    }
  });

  const handleSave = () => {
    const trimmedText = editText().trim();
    if (trimmedText) {
      if (trimmedText !== props.todo.rawText) { // Only save if text actually changed
        saveEditedTodo(z, props.todo.id, trimmedText);
      }
    }
    // cancel after saving and when it's empty
    setEditingTodoId(null);
  };

  const handleCancel = () => {
    setEditingTodoId(null);
    // editText will be reset by setEditText(props.todo.rawText) if edit is clicked again
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Helper to display parts of the todo
  const displayPriority = () => props.todo.priority ? `(${props.todo.priority}) ` : '';
  const displayCreationDate = () => props.todo.createdAt ? formatUnixTime(props.todo.createdAt) : '';
  const displayCompletionDate = () => props.todo.completionDate ? formatUnixTime(props.todo.completionDate) : '';

  return (
    <div
      ref={todoItemRef}
      class={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-fade-in ${props.todo.completed ? 'opacity-90' : ''
        } ${isEditing() ? 'ring-2 ring-blue-500' : ''}`}
      tabindex="0"
    >
      <Show
        when={!isEditing()}
        fallback={
          // --- Edit Mode ---
          <div class="p-4 flex-grow flex flex-col gap-2">
            <input
              ref={editInputRef}
              type="text"
              value={editText()}
              onInput={(e) => setEditText(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              class="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="Enter todo.txt format"
            />
            <div class="flex gap-2 justify-end">
              <button
                onClick={handleSave}
                class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                class="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        }
      >
        <div class="flex items-start p-4">
          <div class="mr-3 pt-1">
            <Checkbox checked={props.todo.completed} onChange={() => toggleTodo(z, props.todo.id)} />
          </div>

          <div class="flex-grow">
            <div class="flex flex-wrap gap-2 items-center mb-1">
              {!props.todo.completed && displayPriority() &&
                <span class="font-medium text-sm text-blue-600">{displayPriority()}</span>
              }

              <span class={`font-medium ${props.todo.completed ? 'line-through text-gray-500' : ''}`}>
                {props.todo.description}
              </span>

              <Show when={props.todo.projectName}>
                <span class="tag project-tag bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                  +{props.todo.projectName}
                </span>
              </Show>

              <Show when={props.todo.areaName}>
                <span class="tag area-tag bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
                  @{props.todo.areaName}
                </span>
              </Show>
            </div>

            <div class="flex justify-between items-center mt-2">
              <div class="flex items-center gap-2 text-xs">
                <div class="text-gray-500 dark:text-gray-400">
                  <span class="inline-flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {displayCreationDate()}
                  </span>
                </div>

                <Show when={props.todo.completed}>
                  <div class="items-center text-xs text-green-500 dark:text-green-400 ">
                    <span class="inline-flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M5 13l4 4L19 7"></path>
                      </svg>
                      {displayCompletionDate()}
                    </span>
                  </div>
                </Show>
              </div>


              <Show when={Object.keys(props.todo.metadata || {}).length > 0}>
                <div class="flex flex-wrap gap-1">
                  {Object.entries(props.todo.metadata || {}).map(([key, value]) => (
                    <span class="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded" title={`${key}: ${value}`}>
                      {key}:{value!.toString().length > 10 ? value!.toString().substring(0, 10) + '...' : value}
                    </span>
                  ))}
                </div>
              </Show>

              <div class="flex gap-2">
                <button
                  onClick={handleEdit}
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 transition-colors"
                  aria-label={`Edit todo: ${props.todo.description}`}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z">
                    </path>
                  </svg>
                </button>
                <button
                  class="text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full p-1 transition-colors"
                  onClick={() => deleteTodo(z, props.todo.id)}
                  aria-label={`Delete todo: ${props.todo.description}`}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                    </path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default TodoItem
