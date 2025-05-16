// a single todo item

import { Component, createEffect, createSignal, JSXElement, Show } from "solid-js";
import { Todo } from "../types";
import { deleteTodo, saveEditedTodo, setEditingTodoId, store, toggleTodo } from "../stores/todoStore";

interface TodoItemProps {
  todo: Todo;
}

const TodoItem = (props: TodoItemProps) => {
  const { todo } = props;
  // const { onToggle, onDelete } = props;

  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    deleteTodo(todo.id);
  };

  const [editText, setEditText] = createSignal(props.todo.rawText);
  let editInputRef: HTMLInputElement | undefined;

  const isEditing = () => store.editingTodoId === props.todo.id;

  const handleEdit = () => {
    setEditText(props.todo.rawText); // Reset editText to current rawText when starting edit
    setEditingTodoId(props.todo.id);
  };

  createEffect(() => {
    // Autofocus the input when editing starts
    if (isEditing() && editInputRef) {
      editInputRef.focus();
      editInputRef.select(); // Optionally select all text
    }
  });

  const handleSave = () => {
    const trimmedText = editText().trim();
    if (trimmedText) {
      if (trimmedText !== props.todo.rawText) { // Only save if text actually changed
        saveEditedTodo(props.todo.id, trimmedText);
      } else {
        setEditingTodoId(null); // Exit editing mode if no change
      }
    } else {
      // Optionally delete if text becomes empty, or revert, or show error
      // For now, let's just cancel if it's empty
      handleCancel();
    }
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
  const displayCreationDate = () => props.todo.creationDate ? `${props.todo.creationDate} ` : '';
  const displayCompletionDate = () => props.todo.completionDate ? `${props.todo.completionDate} ` : '';

  return (
    <li
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
          onChange={() => toggleTodo(props.todo.id)}
          aria-label={`Mark todo as ${props.todo.completed ? 'incomplete' : 'complete'}`}
        />
        <div class="flex-grow min-w-0" onClick={handleEdit} role="button" title="Click to edit"> {/* Make text area clickable to edit */}
          <div class="text-xs text-gray-500 break-all"> {/* `break-all` for long metadata strings */}
            {props.todo.completed && displayCompletionDate()}
            {!props.todo.completed && displayPriority()}
            {displayCreationDate()}
          </div>
          <p class={`text-gray-800 break-words ${props.todo.completed ? 'line-through' : ''}`}>
            {props.todo.description}
          </p>
          {(props.todo.projects.length > 0 || props.todo.contexts.length > 0 || Object.keys(props.todo.metadata).length > 0) && (
            <div class="text-xs mt-1 text-gray-600 break-all">
              {props.todo.projects.map(p => <span class="mr-1.5 text-purple-600 inline-block whitespace-nowrap">+{p}</span>)}
              {props.todo.contexts.map(c => <span class="mr-1.5 text-teal-600 inline-block whitespace-nowrap">@{c}</span>)}
              {Object.entries(props.todo.metadata).map(([key, value]) => (
                <span class="mr-1.5 text-gray-500 inline-block whitespace-nowrap" title={`${key}: ${value}`}>
                  {key}:{value.length > 10 ? value.substring(0, 10) + '...' : value}
                </span>
              ))}
            </div>
          )}
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
            onClick={() => deleteTodo(props.todo.id)}
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
