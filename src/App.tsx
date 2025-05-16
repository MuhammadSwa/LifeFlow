import { createEffect, createSignal, For, onMount, Show, type Component } from 'solid-js';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import { TodoStats } from './components/TodoStats';
import FilterControls from './components/FilterControls';
import flatpickr from 'flatpickr';
import TimePickerPopup from './components/TimePickerPopup';

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

