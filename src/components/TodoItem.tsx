
// const handleClickOutside = (event: MouseEvent) => {
//   if (!editInputRef?.contains(event.target as Node)) {
//     setEditingTodoId(null);
//   }
// };
//
// createEffect(() => {
//   document.addEventListener('click', handleClickOutside);
//   onCleanup(() => document.removeEventListener('click', handleClickOutside));
//   // Instead of global click, rely on blur or Escape, or selection.
// });
// a single todo item

import { createEffect, createSignal, Show } from "solid-js";
import { Todo } from "../../shared/schema";
import { deleteTodo, saveEditedTodo, setEditingTodoId, store, toggleTodo } from "../stores/todoStore";
import { useZero } from "../ZeroContext";
import { formatUnixTime } from "../utils/date";

interface TodoItemProps {
  todo: Todo;
}

const TodoItem = (props: TodoItemProps) => {
  const z = useZero()

  const [editText, setEditText] = createSignal('');

  let editInputRef: HTMLInputElement | undefined;
  let todoItemRef: HTMLLIElement | undefined;

  // Check if the todo is currently being edited
  const isEditing = () => store.editingTodoId === props.todo.id;
  // const isEditing = () => false;

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
  // make it friendlier: show day name if the same week? use a library
  const displayCreationDate = () => props.todo.createdAt ? formatUnixTime(props.todo.createdAt) : '';
  const displayCompletionDate = () => props.todo.completionDate ? formatUnixTime(props.todo.completionDate) : '';

  return (
    <li
      ref={todoItemRef}
      class={`p-3 rounded-md shadow-sm flex items-start gap-3 transition-colors border
              ${props.todo.completed ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-gray-300'}
              ${isEditing() ? '!border-blue-500 ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
    // ondblclick={!isEditing() ? handleEdit : undefined} // Optional: double click to edit
    >
      <Show
        when={!isEditing()}
        fallback={
          // --- Edit Mode ---
          <div class="flex-grow flex flex-col gap-2">
            {/* TODO: refactor TodoInput.tsx to be easily reused here */}
            <input
              ref={editInputRef}
              type="text"
              value={props.todo.rawText}
              onInput={(e) => setEditText(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              class="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="Enter todo.txt format"
            />
            <div class="flex gap-2 justify-end">
              <button
                onClick={handleSave}
                class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                class="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        }
      >
        {/* --- Display Mode --- */}
        <input
          type="checkbox"
          class="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0"
          checked={props.todo.completed}
          onChange={() => toggleTodo(z, props.todo.id)}
          aria-label={`Mark todo as ${props.todo.completed ? 'incomplete' : 'complete'}`}
        />
        <div class="flex-grow min-w-0" onClick={handleEdit} role="button" title="Click to edit"> {/* Make text area clickable to edit */}
          <div class="text-xs text-gray-500 break-all"> {/* `break-all` for long metadata strings */}
            {props.todo.completed && displayCompletionDate() + ' | '}
            {!props.todo.completed && displayPriority()}
            {displayCreationDate()}
          </div>
          <p class={`text-gray-800 break-words ${props.todo.completed ? 'line-through' : ''}`}>
            {props.todo.description}
          </p>
          {/* TODO: Solve this */}

          <Show when={props.todo.areaName}>
            <span class="mr-1.5 text-green-600 inline-block whitespace-nowrap">@{props.todo.areaName}</span>
          </Show>

          <Show when={props.todo.projectName}>
            <span class="mr-1.5 text-purple-600 inline-block whitespace-nowrap">+{props.todo.projectName}</span>
          </Show>

          <Show when={Object.keys(props.todo.metadata ? props.todo.metadata : {}).length > 0}>
            {Object.entries(props.todo.metadata!).map(([key, value]) => (
              <span class="mr-1.5 text-gray-500 inline-block whitespace-nowrap" title={`${key}: ${value}`}>
                {key}:{value!.toString().length > 10 ? value!.toString().substring(0, 10) + '...' : value}
              </span>
            ))}
          </Show>

        </div>
        <div class="flex flex-col items-center gap-1 ml-2 flex-shrink-0">
          {/* <button
            onClick={handleEdit}
            class="text-blue-500 hover:text-blue-700 text-xs p-1"
            aria-label="Edit todo"
          >
            Edit
          </button> */}
          <button
            onClick={() => deleteTodo(z, props.todo.id)}
            class="text-red-500 hover:text-red-700 font-semibold py-1 px-1 rounded text-xs"
            aria-label={`Delete todo: ${props.todo.description}`}
          >
            Del
          </button>
        </div>
      </Show>
    </li>
  );
}

export default TodoItem
