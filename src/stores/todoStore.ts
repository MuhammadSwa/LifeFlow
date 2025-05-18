import { createStore, produce } from "solid-js/store";
import { FilterOption, FilterType } from "../types";
import { Accessor, createEffect, createMemo } from "solid-js";
import { formatTodoTxtItem, parseTodoTxtLine } from "../parsers/todoTxtParser";
import { Zero } from "@rocicorp/zero";
import { createMutators, Mutators } from "../../shared/mutators";
import { Schema } from "../../shared/schema";
import { createQuery, createZero } from "@rocicorp/zero/solid";
import { Todo } from "../../shared/schema";
import { schema } from "../../shared/schema";

const serverURL = import.meta.env.VITE_PUBLIC_ZERO_SERVER || 'http://localhost:4848';
const userID = import.meta.env.VITE_PUBLIC_USER_ID || 'anonymous_client_user'; // Or from actual auth

export const z = createZero<Schema, Mutators>({
  server: serverURL,
  schema,
  userID: userID, // Later, this should come from auth
  kvStore: 'idb',
  // Auth token if you implement JWT authentication
  // auth: async () => { /* fetch JWT token */ return 'your_jwt_token'; },
  mutators: createMutators(userID), // Pass userID if mutators need it for permissions
  push: {
    queryParams: { // Example if your push server needs extra static info per client
      // clientID: 'some-client-identifier',
    }
  }
});

const LOCAL_STORAGE_KEY = 'todos';


const [loadTodos] = createQuery(() =>
  z.query.todo // Use singular 'todo' if that's your Zero schema table name
    .related('project') // Assumes 'project' is the relationship name in schema.ts
    .related('area') // Assumes 'context' is the relationship name
    .orderBy('createdAt', 'desc')
);


// const loadTodos = (): Todo[] => {
//   const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
//   if (storedTodos) {
//     try {
//       const parsedTodos = JSON.parse(storedTodos);
//       // Basic validation: check if it's an array
//       if (Array.isArray(parsedTodos)) {
//         // return parsedTodos;
//         return parsedTodos.map(item => ({ // Ensure all fields are present, good for migrations
//           ...item,
//           projects: item.projects || [],
//           contexts: item.contexts || [],
//           metadata: item.metadata || {},
//         }));
//       }
//     } catch (e) {
//       console.error("Failed to parse todos from localStorage", e);
//       // If parsing fails, return empty array or handle error
//     }
//   }
//   return []; // Return empty array if nothing stored or parsing failed
// };

interface TodoStoreState {
  todos: Todo[];
  activeFilter: FilterOption;
  // For specific project/context filtering
  selectedProject?: string;
  selectedContext?: string;
  editingTodoId?: number | null; // ID of the todo being edited, or null/undefined
}

// We'll export the store and its actions directly
// This creates a single global instance of the store.
const [store, setStore] = createStore<TodoStoreState>({
  todos: loadTodos(),
  activeFilter: { type: FilterType.PRIORITY, label: 'By Priority' },
  selectedProject: undefined,
  selectedContext: undefined,
  editingTodoId: null,
});

// Actions to modify the store
// const addTodo = (text: string) => {
//   const newTodo = parseTodoTxtLine(text);
//   console.log(newTodo)
//   // const newTodo: Todo = { id: Date.now(), text, completed: false };
//   setStore('todos', (prevTodos) => [...prevTodos, newTodo]);
// };

const addTodo = async (z: Zero<Schema, Mutators>, text: string) => {
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



const deleteTodo = async (id: string) => {
  if (confirm("Are you sure you want to delete this todo?")) {
    try {
      await z.mutate.todo.delete({ id }).client;
    } catch (e: any) {
      console.error("Failed to delete todo:", e);
      alert(`Error deleting todo: ${e.message}`);
    }
  }
};


// const toggleTodo = (idToToggle: string) => {
//   // setStore('todos',
//   //   (todo) => todo.id === idToToggle, // Condition to find the todo
//   //   'completed',                    // Key to update
//   //   (c) => !c,                      // Updater function for 'completed'
//   // );
//   // Alternatively, more verbose but perhaps clearer for some:
//   setStore('todos', (prevTodos) =>
//     prevTodos.map(todo =>
//       todo.id === idToToggle ? {
//         ...todo,
//         completed: !todo.completed,
//         completionDate: todo.completed ? Date.now() : null,
//       } : todo
//     )
//   );
// };

const toggleTodo = async (id: string) => {
  try {
    await z.mutate.todo.toggleCompleted({ id }).client;
  } catch (e: any) {
    console.error("Failed to toggle todo:", e);
    alert(`Error toggling todo: ${e.message}`);
  }
};


const setEditingTodoId = (id: number | null) => {
  setStore('editingTodoId', id);
};

// This action will take the raw text from the edit input
const saveEditedTodo = (id: string, rawUpdatedText: string) => {
  const updatedParsedTodo = parseTodoTxtLine(rawUpdatedText); // Re-parse the edited text

  setStore(
    'todos',
    (todo) => todo.id === id,
    produce((todo) => {
      // Overwrite most fields from the newly parsed data
      // but be careful with things like original creationDate if it's not in rawUpdatedText
      // or if your parser doesn't preserve it when re-parsing.
      // For todo.txt, re-parsing is generally fine.
      Object.assign(todo, updatedParsedTodo);
      // TODO: updateTodo
      todo.rawText = formatTodoTxtItem(updatedParsedTodo); // Ensure rawText is the canonical format
    })
  );
  setStore('editingTodoId', null); // Exit editing mode
};


// updateTodo (can be used by saveEditedTodo or kept separate)
// If you use this, ensure parseTodoTxtLine is called before calling updateTodo
const updateTodo = (updatedTodo: Todo) => {
  setStore(
    'todos',
    (todo) => todo.id === updatedTodo.id,
    produce((todo) => {
      Object.assign(todo, updatedTodo);
      todo.rawText = formatTodoTxtItem(updatedTodo); // Ensure rawText is updated
    })
  );
  setStore('editingTodoId', null); // Also exit editing mode here if called directly
};


// Effect to save todos to localStorage whenever they change
createEffect(() => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store.todos));
  // console.log("Store todos saved to localStorage:", store.todos);
});


const setActiveFilter = (filter: FilterOption) => {
  setStore(
    produce(s => {
      s.activeFilter = filter;
      if (filter.type === FilterType.PROJECT) {
        s.selectedProject = filter.value;
        s.selectedContext = undefined;
      } else if (filter.type === FilterType.CONTEXT) {
        s.selectedContext = filter.value;
        s.selectedProject = undefined;
      } else {
        s.selectedProject = undefined;
        s.selectedContext = undefined;
      }
    })
  );
};


// --- Selectors / Derived State ---

// Memoized list of available projects and contexts for filter dropdowns
const availableProjects = createMemo(() => {
  const projects = new Set<string>();
  store.todos.forEach(todo => todo.projects.forEach(p => projects.add(p)));
  return Array.from(projects).sort();
});

const availableContexts = createMemo(() => {
  const contexts = new Set<string>();
  store.todos.forEach(todo => todo.contexts.forEach(c => contexts.add(c)));
  return Array.from(contexts).sort();
});

// The core filtered and sorted list
const filteredTodos: Accessor<Todo[]> = createMemo(() => {
  let items = [...store.todos]; // Start with a copy

  // Apply filter
  switch (store.activeFilter.type) {
    case FilterType.ACTIVE:
      items = items.filter(todo => !todo.completed);
      break;
    case FilterType.COMPLETED:
      items = items.filter(todo => todo.completed);
      break;
    case FilterType.PROJECT:
      if (store.selectedProject) {
        items = items.filter(todo => todo.projects.includes(store.selectedProject!));
      }
      break;
    case FilterType.CONTEXT:
      if (store.selectedContext) {
        items = items.filter(todo => todo.contexts.includes(store.selectedContext!));
      }
      break;
    // FilterType.ALL and FilterType.PRIORITY don't filter out items here,
    // PRIORITY is mainly for sorting.
  }

  // Apply sorting (Default: Priority, then by creation date if available, then by raw text)
  // Completed tasks always sort to the bottom unless specifically filtering for them.
  items.sort((a, b) => {
    // 1. Completed tasks to the bottom (unless filtering for completed)
    if (store.activeFilter.type !== FilterType.COMPLETED) {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
    }
    // If both are completed, sort by completionDate descending (newest first)
    if (a.completed && b.completed) {
      return (b.completionDate || '').localeCompare(a.completionDate || '');
    }

    // 2. Priority (A is highest) - only for active tasks
    if (!a.completed && !b.completed) {
      const prioA = a.priority || 'Z' + '{'; // Treat no priority as lowest (after Z)
      const prioB = b.priority || 'Z' + '{';
      if (prioA < prioB) return -1;
      if (prioA > prioB) return 1;
    }

    // 3. Creation Date (oldest first, if available)
    if (a.creationDate && b.creationDate) {
      const dateComparison = a.creationDate.localeCompare(b.creationDate);
      if (dateComparison !== 0) return dateComparison;
    } else if (a.creationDate) {
      return -1; // a has date, b does not, a comes first
    } else if (b.creationDate) {
      return 1;  // b has date, a does not, b comes first
    }

    // 4. Fallback to raw text
    return a.rawText.localeCompare(b.rawText);
  });

  return items;
});

// Export the reactive store state and the actions
export {
  store,
  addTodo,
  deleteTodo,
  toggleTodo,
  // updateTodo,
  setActiveFilter,
  availableProjects,
  availableContexts,
  filteredTodos, // Components will use this
  saveEditedTodo, // New action for saving edits
  setEditingTodoId, // New action to control edit mode
};

