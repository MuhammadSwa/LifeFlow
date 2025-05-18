import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import { TodoStats } from './components/TodoStats';
import FilterControls from './components/FilterControls';
import { Todo, TodoWithRelations, type Schema } from '../shared/schema';
import { createQuery } from '@rocicorp/zero/solid'
import { Zero } from '@rocicorp/zero';
import { Mutators } from '../shared/mutators';
import { createMemo, createSignal, For, onMount } from 'solid-js';



function App({ z }: { z: Zero<Schema, Mutators> }) {



  // const [todosQuery] = createQuery(() => z.query.todo, { ttl: "forever" })

  // --- Signals for Form Inputs ---
  const [rawTodoInput, setRawTodoInput] = createSignal('');
  const [selectedProjectId, setSelectedProjectId] = createSignal<string | null>(null);
  const [selectedContextId, setSelectedContextId] = createSignal<string | null>(null);
  const [newProjectName, setNewProjectName] = createSignal('');
  const [newContextName, setNewContextName] = createSignal('');

  // --- Signals for Filters ---
  const [filterCompleted, setFilterCompleted] = createSignal<boolean | 'all'>('all'); // 'all', true, false
  const [filterProjectId, setFilterProjectId] = createSignal<string | 'all'>('all');
  const [filterContextId, setFilterContextId] = createSignal<string | 'all'>('all');
  const [filterPriority, setFilterPriority] = createSignal<Todo['priority'] | 'all'>('all');


  // --- Zero Queries ---
  // Query for all todos, including related project and context for display and filtering
  const [todosQuery] = createQuery(() =>
    z.query.todo // Use singular 'todo' if that's your Zero schema table name
      .related('project') // Assumes 'project' is the relationship name in schema.ts
      .related('area') // Assumes 'context' is the relationship name
      .orderBy('createdAt', 'desc')
  );


  const addTodo = async () => {
    const newTodoText = 'dh pfdfd dh vs,g hggi wgn hggi ugd; ,ugn Ng; ,wpf; ,sgl'
    try {
      // Optimistic update: .client waits for local write
      await z.mutate.todo.add({
        rawText: newTodoText,

        description: newTodoText,
        projectName: 'test',
        areaName: 'todo',
        priority: 'A',
        dueDate: 123987213,
      }).client;
    } catch (e) {
      console.error("Failed to add todo:", e);
      alert(`Error: ${e.message}`);
    }
  };



  // // Query for projects to populate filter dropdown
  const projectsQuery = createQuery(() => z.query.project.orderBy('name', 'asc')); // Singular
  //
  // // Query for contexts to populate filter dropdown
  const areaQuery = createQuery(() => z.query.area.orderBy('name', 'asc')); // Singular
  //
  // // --- Derived Memos ---
  // NOTE: what does this do?
  const todosWithRelations = createMemo<TodoWithRelations[]>(() => {
    return (todosQuery() ?? []).map(t => ({
      ...t,
      // The .related() calls should already populate these if relationships are set up
      // project: t.project, 
      // context: t.context,
    })) as TodoWithRelations[]; // Cast if necessary, Zero should type this well
  });

  //
  //
  const filteredTodos = createMemo(() => {
    let items = todosWithRelations(); // Start with all todos (with relations)

    if (filterCompleted() !== 'all') {
      items = items.filter(todo => todo.completed === filterCompleted());
    }
    if (filterProjectId() !== 'all') {
      items = items.filter(todo => todo.projectId === filterProjectId());
    }
    if (filterContextId() !== 'all') {
      items = items.filter(todo => todo.areaId === filterContextId());
    }
    if (filterPriority() !== 'all') {
      items = items.filter(todo => todo.priority === filterPriority());
    }
    return items;
  });
  //
  // // --- Mutator Functions ---
  // const parseTodoInput = (raw: string): { description: string; projectName?: string; areaName?: string; priority?: Todo['priority']; dueDate?: number } => {
  //   let description = raw;
  //   let projectName: string | undefined;
  //   let areaName: string | undefined;
  //   let priority: Todo['priority'] | undefined;
  //   let dueDate: number | undefined;
  //
  //   // Basic parsing, can be made more robust
  //   const projectMatch = raw.match(/\+([\w-]+)/);
  //   if (projectMatch) {
  //     projectName = projectMatch[1];
  //     description = description.replace(projectMatch[0], '').trim();
  //   }
  //   const contextMatch = raw.match(/@([\w-]+)/);
  //   if (contextMatch) {
  //     areaName = contextMatch[1];
  //     description = description.replace(contextMatch[0], '').trim();
  //   }
  //   const priorityMatch = raw.match(/\(([A-D])\)/i);
  //   if (priorityMatch) {
  //     priority = priorityMatch[1].toUpperCase() as TodoRow['priority'];
  //     description = description.replace(priorityMatch[0], '').trim();
  //   }
  //   const dueDateMatch = raw.match(/due:(\d{4}-\d{2}-\d{2})/);
  //   if (dueDateMatch) {
  //     try {
  //       dueDate = new Date(dueDateMatch[1]).getTime();
  //       description = description.replace(dueDateMatch[0], '').trim();
  //     } catch (e) { /* ignore invalid date */ }
  //   }
  //   return { description: description.trim(), projectName, areaName: areaName, priority, dueDate };
  // };
  //
  // const addTodo = async () => {
  //   const rawText = rawTodoInput().trim();
  //   if (!rawText) return;
  //
  //   const { description, projectName, areaName: contextName, priority, dueDate } = parseTodoInput(rawText);
  //
  //   if (!description) {
  //     alert("Todo description cannot be empty after parsing metadata.");
  //     return;
  //   }
  //
  //   try {
  //     await z.mutate.todo.add({
  //       rawText: rawText,
  //       description: description,
  //       projectName: projectName || (selectedProjectId() && selectedProjectId() !== 'new' ? undefined : newProjectName() || undefined),
  //       contextName: contextName || (selectedContextId() && selectedContextId() !== 'new' ? undefined : newContextName() || undefined),
  //       projectId: selectedProjectId() && selectedProjectId() !== 'new' ? selectedProjectId() : undefined,
  //       contextId: selectedContextId() && selectedContextId() !== 'new' ? selectedContextId() : undefined,
  //       priority: priority,
  //       dueDate: dueDate,
  //     }).client; // Use .client to await optimistic update
  //
  //     setRawTodoInput('');
  //     setNewProjectName('');
  //     setNewContextName('');
  //     // Optionally reset selected project/context if they were for "new"
  //     if (selectedProjectId() === 'new') setSelectedProjectId(null);
  //     if (selectedContextId() === 'new') setSelectedContextId(null);
  //
  //   } catch (e: any) {
  //     console.error("Failed to add todo:", e);
  //     alert(`Error adding todo: ${e.message}`);
  //   }
  // };
  //
  // const toggleTodo = async (id: string) => {
  //   try {
  //     await z.mutate.todo.toggleCompleted({ id }).client;
  //   } catch (e: any) {
  //     console.error("Failed to toggle todo:", e);
  //     alert(`Error toggling todo: ${e.message}`);
  //   }
  // };
  //
  // const deleteTodo = async (id: string) => {
  //   if (confirm("Are you sure you want to delete this todo?")) {
  //     try {
  //       await z.mutate.todo.delete({ id }).client;
  //     } catch (e: any) {
  //       console.error("Failed to delete todo:", e);
  //       alert(`Error deleting todo: ${e.message}`);
  //     }
  //   }
  // };
  //
  // const priorityDisplay = (priority: TodoRow['priority']) => {
  //   if (!priority) return '';
  //   return `(${priority})`;
  // }

  return (
    <div class="p-4 max-w-xl mx-auto"> {/* Increased max-width a bit */}


      <For each={todosQuery()}>
        {(todo) => (
          <>
            <li>hello</li>
            <li>{todo.description}</li>
          </>
        )}
      </For>

      <TodoInput />

      <FilterControls /> {/* Add the filter controls */}

      <TodoStats />

      <TodoList />


    </div>
  );
};

export default App;





// // // Close dropdowns if clicked outside
// const handleClickOutside = (event: MouseEvent) => {
//   if (inputRef && !inputRef.contains(event.target as Node)) {
//     // A bit more complex: check if click is on dropdown/datepicker itself
//     // For now, a simpler check: if not input, hide.
//     // This needs to be refined so clicking on dropdown items works.
//     // SuggestionDropdown and DatePickerPopup should handle their own visibility on selection/blur.
//   }
// };

// createEffect(() => {
//   document.addEventListener('click', handleClickOutside);
//   onCleanup(() => document.removeEventListener('click', handleClickOutside));
//   // Instead of global click, rely on blur or Escape, or selection.
// });

// createEffect for global click outside (optional, use with care for popups)
// onMount(() => {
//   const handleClickOutside = (event: MouseEvent) => {
//     if (inputRef && !inputRef.contains(event.target as Node) &&
//       !document.querySelector('.suggestion-dropdown-class')?.contains(event.target as Node) &&
//       !document.querySelector('.time-picker-popup-class')?.contains(event.target as Node) &&
//       !document.querySelector('.todo-input-class')?.contains(event.target as Node)) {
//       setShowSuggestions(false);
//       setShowDatePicker(false);
//       setEditingTodoId(null);
//     }
//   };
//   document.addEventListener('click', handleClickOutside);
//   onCleanup(() => document.removeEventListener('click', handleClickOutside));
// });
