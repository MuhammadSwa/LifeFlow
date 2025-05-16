import { type Component } from 'solid-js';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import { TodoStats } from './components/TodoStats';
import FilterControls from './components/FilterControls';

const App: Component = () => {
  return (
    <div class="p-4 max-w-xl mx-auto"> {/* Increased max-width a bit */}

      <TodoInput />

      <FilterControls /> {/* Add the filter controls */}

      <TodoStats />

      <TodoList />

      {/* <TimePickerPopup /> */}
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
