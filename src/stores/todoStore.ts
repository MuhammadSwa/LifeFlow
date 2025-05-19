import { createStore, produce } from "solid-js/store";
import { FilterOption, FilterType } from "../types";
import { createMemo } from "solid-js";
import { parseTodoTxtLine } from "../parsers/todoTxtParser";
import { Zero } from "@rocicorp/zero";
import { createQuery } from "@rocicorp/zero/solid";

import { type Schema } from '../../shared/schema';
import { type Mutators } from '../../shared/mutators';
import { useZero } from "../ZeroContext";



export function loadTodos() {
  const z = useZero()

  const [todosQuery] = createQuery(() =>
    z.query.todo // Use singular 'todo' if that's your Zero schema table name
    // .related('project') // Assumes 'project' is the relationship name in schema.ts
    // .related('area') // Assumes 'context' is the relationship name
    // .orderBy('createdAt', 'desc')
  );

  return todosQuery
}

// Load filtered todos based on current filters
export function useFilteredTodos() {
  const allTodos = loadTodos();

  // Memoize the filtered todos based on current filters
  const filteredTodos = createMemo(() => {
    let todos = [...allTodos()]; // Create a mutable copy for filtering/sorting
    const filters = getActiveFilters();

    // 1. Base filter (ALL, ACTIVE, COMPLETED)
    if (filters.baseFilter === FilterType.ACTIVE) {
      todos = todos.filter(todo => !todo.completed);
    } else if (filters.baseFilter === FilterType.COMPLETED) {
      todos = todos.filter(todo => todo.completed);
    }

    // 2. Project filter (if selected)
    if (filters.project) {
      todos = todos.filter(todo => todo.projectName === filters.project);
    }

    // 3. Area filter (if selected)
    if (filters.area) {
      todos = todos.filter(todo => todo.areaName === filters.area);
    }

    // Apply sorting
    todos.sort((a, b) => {
      // 1. Completed tasks to the bottom (unless filtering for completed)
      if (filters.baseFilter !== FilterType.COMPLETED) {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
      }

      // If both are completed, sort by completionDate descending (newest first)
      if (a.completed && b.completed) {
        const dateA = a.completionDate ?? 0;
        const dateB = b.completionDate ?? 0;
        return dateB - dateA; // Descending
      }

      // 2. Priority (A is highest) - only for active tasks
      if (!a.completed && !b.completed) {
        // Ensure priority is handled correctly if null/undefined
        const prioA = a.priority || 'Z~'; // Treat no priority as lowest
        const prioB = b.priority || 'Z~';
        if (prioA < prioB) return -1;
        if (prioA > prioB) return 1;
      }

      // 3. Creation Date (newest first)
      const createdAtA = a.createdAt ?? 0;
      const createdAtB = b.createdAt ?? 0;
      if (createdAtA !== createdAtB) {
        return createdAtB - createdAtA; // Descending for newest first
      }

      // 4. Fallback to raw text
      return a.rawText.localeCompare(b.rawText);
    });

    return todos;
  });

  return filteredTodos;
}

interface TodoStoreState {
  // todos: Todo[];
  activeFilter: FilterOption;
  // For specific project/context filtering
  selectedProject?: string;
  selectedArea?: string;
  editingTodoId?: string | null; // ID of the todo being edited, or null/undefined
}
//

// Create a single global instance of the store
export const [store, setStore] = createStore<TodoStoreState>({
  editingTodoId: null,
  activeFilter: { type: FilterType.ALL, label: 'All' },
  selectedProject: undefined,
  selectedArea: undefined,
});

// Modified to keep both project and area filters active simultaneously
export const setActiveFilter = (filter: FilterOption) => {
  setStore(
    produce(s => {
      s.activeFilter = filter;
      // No longer clear project/area when switching types
    })
  );
};

// Helper function for query construction based on active filters
export const getActiveFilters = () => {
  return {
    baseFilter: store.activeFilter.type,
    project: store.selectedProject,
    area: store.selectedArea
  };
};



export const addTodo = async (z: Zero<Schema, Mutators>, text: string) => {
  if (!text) return;

  const { description, projectName, areaName: contextName, priority, dueDate } = parseTodoTxtLine(text);

  if (!description) {
    alert("Todo description cannot be empty after parsing metadata.");
    return;
  }

  try {
    await z.mutate.todo.add({
      rawText: text,
      description: description,
      projectName: projectName,
      areaName: contextName,
      priority: priority,
      dueDate: dueDate,
    }).client; // Use .client to await optimistic update

  } catch (e: any) {
    console.error("Failed to add todo:", e);
    alert(`Error adding todo: ${e.message}`);
  }
};

export const saveEditedTodo = async (z: Zero<Schema, Mutators>, id: string, text: string) => {
  console.log('here')
  if (!text) return;
  const { description, projectName, areaName: contextName, priority, dueDate } = parseTodoTxtLine(text);

  if (!description) {
    alert("Todo description cannot be empty after parsing metadata.");
    return;
  }

  try {
    await z.mutate.todo.update({ id, rawText: text, description, projectName, areaName: contextName, priority, dueDate }).client; // Use .client to await optimistic update
  } catch (e: any) {
    console.error("Failed to update todo:", e);
    alert(`Error updating todo: ${e.message}`);
  }
};

// TODO: move deleted todo to archive and don't alert
export const deleteTodo = async (z: Zero<Schema, Mutators>, id: string) => {
  // if (confirm("Are you sure you want to delete this todo?")) {
  try {
    return await z.mutate.todo.delete({ id }).client;
  } catch (e: any) {
    console.error("Failed to delete todo:", e);
    alert(`Error deleting todo: ${e.message}`);
  }
  // }
};


export const toggleTodo = async (z: Zero<Schema, Mutators>, id: string) => {
  try {
    await z.mutate.todo.toggleCompleted({ id }).client;
  } catch (e: any) {
    console.error("Failed to toggle todo:", e);
    alert(`Error toggling todo: ${e.message}`);
  }
};



export const setEditingTodoId = (id: string | null) => {
  setStore('editingTodoId', id);
};


export function useAvailableAreas() {
  const z = useZero(); // Call useZero hook here

  // createQuery returns an object with .data, .loading, .error etc.
  const [projectsQueryResult] = createQuery(() =>
    z.query.area.orderBy('name', 'asc')
  );

  // Create a memo that returns the actual array of projects,
  // defaulting to an empty array if data is not yet available.
  const areas = createMemo(() => {
    return projectsQueryResult ?? [];
  });

  // The custom hook can return the memoized projects array,
  // and optionally the loading/error states if needed by consumers.
  return areas
}

export function useAvailableProjects() {
  const z = useZero(); // Call useZero hook here

  // createQuery returns an object with .data, .loading, .error etc.
  const [projectsQueryResult] = createQuery(() =>
    z.query.project.orderBy('name', 'asc')
  );

  // Create a memo that returns the actual array of projects,
  // defaulting to an empty array if data is not yet available.
  const projects = createMemo(() => {
    return projectsQueryResult ?? [];
  });
  return projects

}

