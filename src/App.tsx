import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import { TodoStats } from './components/TodoStats';
import FilterControls from './components/FilterControls';
import { Todo } from '../shared/schema';
import { createSignal, For, onMount, Show, } from 'solid-js';
// import { z } from './zero';
import { createQuery } from '@rocicorp/zero/solid';
import { useZero } from './ZeroContext';
import { addTodo, loadTodos } from './stores/todoStore';
import { FAB } from './components/FAB';
import { Header } from './components/Header';



// function App({ z }: { z: Zero<Schema, Mutators> }) {
function App() {




  // const [todosQuery] = createQuery(() => z.query.todo, { ttl: "forever" })

  // --- Signals for Form Inputs ---
  const [rawTodoInput, setRawTodoInput] = createSignal('');
  const [selectedProjectName, setSelectedProjectName] = createSignal<string | null>(null);
  const [selectedAreaName, setSelectedAreaName] = createSignal<string | null>(null);
  const [newProjectName, setNewProjectName] = createSignal('');
  const [newContextName, setNewContextName] = createSignal('');

  // --- Signals for Filters ---
  const [filterCompleted, setFilterCompleted] = createSignal<boolean | 'all'>('all'); // 'all', true, false
  const [filterProjectName, setFilterProjectName] = createSignal<string | 'all'>('all');
  const [filterContextName, setFilterContextName] = createSignal<string | 'all'>('all');
  const [filterPriority, setFilterPriority] = createSignal<Todo['priority'] | 'all'>('all');


  const todosQuery = loadTodos()
  // addTodo('todo @area +project')
  onMount(() => {
  })
  // const z = useZero();
  // // --- Zero Queries ---
  // // Query for all todos, including related project and context for display and filtering
  // const [todosQuery] = createQuery(() =>
  //   z.query.todo // Use singular 'todo' if that's your Zero schema table name
  //     .related('project') // Assumes 'project' is the relationship name in schema.ts
  //     .related('area') // Assumes 'context' is the relationship name
  //     .orderBy('createdAt', 'desc')
  // );



  // const addTodo1 = async () => {
  //   const newTodoText = 'dh pfdfd dh vs,g hggi wgn hggi ugd; ,ugn Ng; ,wpf; ,sgl'
  //   try {
  //     // Optimistic update: .client waits for local write
  //     await z.mutate.todo.add({
  //       rawText: newTodoText,
  //
  //       description: newTodoText,
  //       projectName: 'test',
  //       areaName: 'todo',
  //       priority: 'A',
  //       dueDate: 123987213,
  //     }).client;
  //   } catch (e) {
  //     console.error("Failed to add todo:", e);
  //     alert(`Error: ${e.message}`);
  //   }
  // };



  //
  // // --- Derived Memos ---
  // NOTE: what does this do?
  // const todosWithRelations = createMemo<TodoWithRelations[]>(() => {
  //   return (todosQuery() ?? []).map(t => ({
  //     ...t,
  //     // The .related() calls should already populate these if relationships are set up
  //     // project: t.project, 
  //     // context: t.context,
  //   })) as TodoWithRelations[]; // Cast if necessary, Zero should type this well
  // });

  //
  //
  // const filteredTodos = createMemo(() => {
  //   let items = todosWithRelations(); // Start with all todos (with relations)
  //
  //   if (filterCompleted() !== 'all') {
  //     items = items.filter(todo => todo.completed === filterCompleted());
  //   }
  //   if (filterProjectName() !== 'all') {
  //     items = items.filter(todo => todo.projectName === filterProjectName());
  //   }
  //   if (filterContextName() !== 'all') {
  //     items = items.filter(todo => todo.areaName === filterContextName());
  //   }
  //   if (filterPriority() !== 'all') {
  //     items = items.filter(todo => todo.priority === filterPriority());
  //   }
  //   return items;
  // });

  //

  let todoInputTextAreaElement: HTMLTextAreaElement | undefined;
  const handleFabClick = () => {
    if (todoInputTextAreaElement) {
      todoInputTextAreaElement.focus();
      // Optional: Scroll the input into view if it might be off-screen
      // This is helpful if the user has scrolled down the page.
      todoInputTextAreaElement.scrollIntoView();
    } else {
      console.warn("Textarea ref for TodoInput is not yet available.");
    }
  };


  return (
    <div class="bg-gray-100 font-sans text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-200 "> {/* Increased max-width a bit */}
      <div class="container p-4 py-8 min-h-screen max-w-2xl mx-auto pb-[88px] sm:pb-6">


        <Header />

        <TodoInput textAreaRef={el => todoInputTextAreaElement = el} />
        {/**/}
        <FilterControls />
        {/**/}
        <TodoStats />
        {/**/}
        <TodoList />

        <FAB onClick={handleFabClick} />


      </div>


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

// const addTodo = async () => {
//   const rawText = rawTodoInput().trim();
//   if (!rawText) return;
//
//   const { description, projectName, areaName: contextName, priority, dueDate } = parseTodoTxtLine(rawText);
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
//       projectName: projectName || (selectedProjectName() && selectedProjectName() !== 'new' ? undefined : newProjectName() || undefined),
//       areaName: contextName || (selectedAreaName() && selectedAreaName() !== 'new' ? undefined : newContextName() || undefined),
//       priority: priority,
//       dueDate: dueDate,
//     }).client; // Use .client to await optimistic update
//
//     setRawTodoInput('');
//     setNewProjectName('');
//     setNewContextName('');
//     // Optionally reset selected project/context if they were for "new"
//     if (selectedProjectName() === 'new') setSelectedProjectName(null);
//     if (selectedAreaName() === 'new') setSelectedAreaName(null);
//
//   } catch (e: any) {
//     console.error("Failed to add todo:", e);
//     alert(`Error adding todo: ${e.message}`);
//   }
// };

