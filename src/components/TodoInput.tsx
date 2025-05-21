import { createSignal, onMount, } from "solid-js";
import { addTodo } from "../stores/todoStore";
import SuggestionDropdown from "./SuggestionDropdown";
import { parseTodoTxtLine } from "../parsers/todoTxtParser";
import TimePickerPopup from "./TimePickerPopup";
import { Caret } from "textarea-caret-ts";
import { Todo } from "../../shared/schema";
import { useZero } from "../ZeroContext";
import { createQuery } from "@rocicorp/zero/solid";

// Type for the suggestion mode
type SuggestionMode = null | 'priority' | 'project' | 'context' | 'date_keyword';

// Standard priorities for todos
const PRIORITIES = ['A', 'B', 'C', 'D'];

// --- Helper Functions ---
// get the relative position of the cursor in the input
// NOTE: this works okay, but maybe use popper.js?
const getCharRectInInput = (inputRef: HTMLTextAreaElement | undefined): { top: number; left: number } | null => {
  if (!inputRef) return null;
  const coordinates = Caret.getRelativePosition(inputRef);
  return coordinates.top && coordinates.left ? coordinates : null;
};


interface TodoInputProps {
  textAreaRef?: (element: HTMLTextAreaElement) => void; // Callback ref for the textarea
  // ... any other props TodoInput might take
}

// --- Component Definition ---

const TodoInput = (props: TodoInputProps) => {
  // --- State Signals ---
  const [inputValue, setInputValue] = createSignal('');
  // const availableProjects = useAvailableProjects()
  // const availableAreas = useAvailableAreas()
  const z = useZero()
  let inputRef: HTMLTextAreaElement | undefined; // Ref for the input element

  // This function will be called by the ref attribute on the textarea.
  // It sets the internal reference and also calls the parent's ref callback if provided.
  const setupTextareaRef = (element: HTMLTextAreaElement) => {
    inputRef = element; // For internal use within TodoInput
    if (props.textAreaRef) {
      props.textAreaRef(element); // Pass the element up to the parent
    }
  };


  const [availableProjects] = createQuery(() => z.query.project.orderBy('name', 'asc')); // Singular
  const [availableAreas] = createQuery(() => z.query.area.orderBy('name', 'asc')); // Singular


  onMount(() => {
    console.log(availableProjects()[0])
    inputRef?.focus();
  })

  // Suggestion Dropdown State
  const [showSuggestions, setShowSuggestions] = createSignal(false);
  const [suggestionMode, setSuggestionMode] = createSignal<SuggestionMode>(null);
  const [suggestionItems, setSuggestionItems] = createSignal<string[]>([]);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = createSignal(0);

  // Date Picker Popup State
  const [showDatePicker, setShowDatePicker] = createSignal(false);

  // Position for popups (suggestions or date picker)
  const [popupPosition, setPopupPosition] = createSignal<{ top: number; left: number } | null>(null);


  // --- Suggestion Logic ---

  interface SuggestionConfig {
    // Character or pattern that triggers this suggestion type (for documentation/debugging)
    triggerPattern: string;
    // Condition to activate this suggestion mode
    condition: (charBeforeCursor: string, currentWord: string, existingTodo: Todo) => boolean;
    // Function to get suggestion items
    getItems: (currentWord: string) => string[];
    // Function to calculate the position for the suggestion popup
    getPopupPosition: () => { top: number; left: number } | null;
    // Optional: Action to take when this suggestion type is selected but doesn't directly insert text (e.g., open date picker)
    onSelectAction?: (currentText: string, cursorPos: number, selectedItem: string) => void;
  }

  // Configuration for different suggestion types
  // Note: `availableContexts` and `availableProjects` are accessors, so call them with `()`
  const suggestionConfigs: Record<Exclude<SuggestionMode, null>, SuggestionConfig> = {
    priority: {
      triggerPattern: '(',
      condition: (charBeforeCursor, _, existingTodo) =>
        charBeforeCursor === '(' && !existingTodo.priority,
      getItems: () => PRIORITIES.map(p => `(${p})`),
      getPopupPosition: () => getCharRectInInput(inputRef),
    },
    context: {
      triggerPattern: '@',
      condition: (_, currentWord, existingTodo) =>
        currentWord.startsWith('@') && existingTodo.areaName === null, // Allow multiple later if needed
      getItems: (currentWord) => {
        const query = currentWord.substring(1).toLowerCase();
        const areas = availableAreas(); // Call the accessor
        if (!areas) return []; // Guard against undefined/null
        return areas
          .filter(p => p.name.toLowerCase().startsWith(query))
          .map(p => p.name); // <--- Added .map(p => p.name)
      },
      getPopupPosition: () => getCharRectInInput(inputRef),
    },
    project: {
      triggerPattern: '+',
      condition: (_, currentWord, existingTodo) =>
        currentWord.startsWith('+') && existingTodo.projectName === null, // Allow multiple later if needed
      getItems: (currentWord) => {
        const query = currentWord.substring(1).toLowerCase();
        const projects = availableProjects(); // Call the accessor
        if (!projects) return []; // Guard against undefined/null
        return projects
          .filter(p => p.name.toLowerCase().startsWith(query))
          .map(p => p.name); // <--- Added .map(p => p.name)

      },
      getPopupPosition: () => getCharRectInInput(inputRef),
    },
    date_keyword: {
      triggerPattern: 'due:',
      condition: (_, currentWord, existingTodo) => {
        const potentialKeyword = currentWord.toLowerCase();
        return "due:".startsWith(potentialKeyword) && potentialKeyword.length > 0 && !existingTodo.dueDate;
      },
      getItems: () => ['due:YYYY-MM-DD'], // This is more of a placeholder to trigger the mode
      getPopupPosition: () => getCharRectInInput(inputRef),
      onSelectAction: (currentText, cursorPos, _) => {
        // Replace the typed keyword (e.g., "d", "du") with "due:"
        const wordStartMatch = currentText.substring(0, cursorPos).match(/\S+$/);
        if (wordStartMatch && wordStartMatch.index !== undefined && inputRef) {
          const before = currentText.substring(0, wordStartMatch.index);
          const after = currentText.substring(cursorPos);
          const newText = `${before}due:`;
          setInputValue(`${newText}${after}`);

          const dueKeywordEndPos = wordStartMatch.index + "due:".length;
          setPopupPosition(getCharRectInInput(inputRef));
          setShowDatePicker(true);

          // Move cursor after "due:"
          setTimeout(() => inputRef?.setSelectionRange(dueKeywordEndPos, dueKeywordEndPos), 0);
        }
      }
    },
  };

  /**
   * Analyzes the input text and cursor position to determine if suggestions should be shown.
   */
  const updateSuggestionsState = (text: string, cursorPos: number) => {
    // Reset states before evaluating
    setShowSuggestions(false);
    setShowDatePicker(false); // Date picker might be triggered by suggestions
    setSuggestionMode(null);
    setPopupPosition(null);

    if (cursorPos === 0) return; // No suggestions at the beginning of an empty input

    const charBeforeCursor = text[cursorPos - 1];
    const textBeforeCursor = text.substring(0, cursorPos);
    const wordMatch = textBeforeCursor.match(/[\S]+$/); // Match last non-whitespace word
    const currentWord = wordMatch ? wordMatch[0] : "";

    const existingTodo = parseTodoTxtLine(text); // Parse to check existing elements

    for (const [mode, config] of Object.entries(suggestionConfigs) as [Exclude<SuggestionMode, null>, SuggestionConfig][]) {
      if (config.condition(charBeforeCursor, currentWord, existingTodo)) {
        const items = config.getItems(currentWord);
        if (items.length > 0) {
          setSuggestionMode(mode);
          setSuggestionItems(items);
          setShowSuggestions(true);
          setPopupPosition(config.getPopupPosition());
          setHighlightedSuggestionIndex(0); // Reset highlight
          return; // Found a mode, exit
        }
      }
    }
  };


  // --- Event Handlers ---

  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    const text = target.value;
    setInputValue(text);
    updateSuggestionsState(text, target.selectionStart || 0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Let SuggestionDropdown handle its keys if active
    if (showSuggestions() && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
      // The SuggestionDropdown itself should handle e.preventDefault() if needed.
      // This allows SuggestionDropdown to manage navigation and selection.
      return;
    }

    // Handle Escape for DatePicker
    if (showDatePicker() && e.key === 'Escape') {
      e.preventDefault();
      setShowDatePicker(false);
      inputRef?.focus();
      return;
    }

    // Handle Enter for submitting the todo
    if (e.key === 'Enter' && !showSuggestions() && !showDatePicker()) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      // General escape closes any active popup
      setShowSuggestions(false);
      setShowDatePicker(false);
      setSuggestionMode(null);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events on the dropdown/datepicker
    setTimeout(() => {
      // Check if focus is now inside the suggestion dropdown or date picker
      const activeEl = document.activeElement;
      const isFocusInPopup = activeEl?.closest('.suggestion-dropdown-class') || activeEl?.closest('.time-picker-popup-class');

      if (!isFocusInPopup) {
        setShowSuggestions(false);
        // setShowDatePicker(false); // Date picker might have its own blur handling or be modal
      }
      if (!showDatePicker() && !isFocusInPopup) { // Keep this original logic for suggestion dropdown
        setShowSuggestions(false);
      }
    }, 150);
  };

  /**
   * Handles selection of an item from the suggestion dropdown.
   */
  const handleSuggestionSelect = (selectedItem: string) => {
    const mode = suggestionMode();
    if (!mode || !inputRef) return;

    const config = suggestionConfigs[mode];
    if (config.onSelectAction) {
      config.onSelectAction(inputValue(), inputRef.selectionStart || 0, selectedItem);
      setShowSuggestions(false);
      setSuggestionMode(null);
      // onSelectAction (like for date_keyword) handles focus and input update
      return;
    }

    const currentText = inputValue();
    const cursorPos = inputRef.selectionStart || currentText.length;
    let textToInsert = selectedItem;
    let newCursorPosOffset = 0;

    // Common logic: find the word/trigger before cursor to replace it
    let startIndexToReplace = -1;
    let textBeforeReplacement = "";
    let textAfterReplacement = currentText.substring(cursorPos);

    if (mode === 'priority') { // e.g., selectedItem is "(A)"
      startIndexToReplace = currentText.substring(0, cursorPos).lastIndexOf('(');
      if (startIndexToReplace !== -1) {
        textBeforeReplacement = currentText.substring(0, startIndexToReplace);
        // textToInsert is already `(A)`
        textToInsert += " "; // Add space after priority
        newCursorPosOffset = textToInsert.length;
      }
    } else if (mode === 'context' || mode === 'project') {
      const triggerChar = mode === 'context' ? '@' : '+';
      const wordRegex = new RegExp(`\\${triggerChar}\\S*$`);
      const match = currentText.substring(0, cursorPos).match(wordRegex);
      if (match && match.index !== undefined) {
        startIndexToReplace = match.index;
        textBeforeReplacement = currentText.substring(0, startIndexToReplace);
        textToInsert = `${triggerChar}${selectedItem} `; // Prepend trigger and add space
        newCursorPosOffset = textToInsert.length;
      }
    }
    // Note: 'date_keyword' is handled by onSelectAction in its config.

    if (startIndexToReplace !== -1) {
      const newText = `${textBeforeReplacement}${textToInsert}${textAfterReplacement}`;
      setInputValue(newText);
      const finalCursorPos = startIndexToReplace + newCursorPosOffset;
      setTimeout(() => inputRef?.setSelectionRange(finalCursorPos, finalCursorPos), 0);
    } else {
      // Fallback: simple insertion if specific replacement logic fails (should be rare)
      const before = currentText.substring(0, cursorPos);
      const after = currentText.substring(cursorPos);
      setInputValue(`${before}${selectedItem} ${after}`);
      const finalCursorPos = cursorPos + selectedItem.length + 1;
      setTimeout(() => inputRef?.setSelectionRange(finalCursorPos, finalCursorPos), 0);
    }

    setShowSuggestions(false);
    setSuggestionMode(null);
    // inputRef.focus(); // Refocus after selection, if not handled by setTimeout
  };

  /**
   * Handles selection of a date from the TimePickerPopup.
   */
  const handleDateSelect = (date: string) => { // date is YYYY-MM-DD
    if (!inputRef) return;

    const currentText = inputValue();
    const cursorPos = inputRef.selectionStart || currentText.length;

    // Expect "due:" to be just before the cursor where date will be inserted
    const textBeforeCursor = currentText.substring(0, cursorPos);
    const textAfterCursor = currentText.substring(cursorPos);

    if (textBeforeCursor.endsWith("due:")) {
      const newText = `${textBeforeCursor}${date} ${textAfterCursor}`;
      setInputValue(newText);
      const finalCursorPos = cursorPos + date.length + 1; // After date and space
      setTimeout(() => inputRef?.setSelectionRange(finalCursorPos, finalCursorPos), 0);
    } else {
      // Fallback if "due:" is not immediately before cursor (e.g., user moved cursor)
      // This might need more robust handling depending on desired UX
      const newText = `${currentText.trim()} due:${date} `;
      setInputValue(newText);
      const finalCursorPos = newText.length;
      setTimeout(() => inputRef?.setSelectionRange(finalCursorPos, finalCursorPos), 0);
    }

    setShowDatePicker(false);
    inputRef.focus();
  };

  /**
   * Handles form submission (adding the todo).
   */
  const handleSubmit = () => {
    const text = inputValue().trim();
    if (text) {
      addTodo(z, text);
      setInputValue(''); // Clear input
      // Reset all popups/suggestions
      setShowSuggestions(false);
      setShowDatePicker(false);
      setSuggestionMode(null);
      setPopupPosition(null);
    }
    inputRef?.focus(); // Keep focus on input for next todo
  };


  // <div class="mb-6">
  //   <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
  //     <span class="inline-flex items-center"><kbd
  //         class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Tab</kbd><span class="ml-1">to
  //         autocomplete</span></span>
  //     <span class="inline-flex items-center"><kbd
  //         class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd><span class="ml-1">to add
  //         task</span></span>
  //     <span class="inline-flex items-center"><kbd
  //         class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑/↓</kbd><span class="ml-1">to navigate
  //         suggestions</span></span>
  //   </div>
  // </div>

  // --- JSX ---
  return (
    <div class="mb-6">
      <div class="relative">
        <textarea
          id="taskInput"
          ref={setupTextareaRef}
          placeholder="Type ( for priority, @ for context, + for project, 'due:' for due date..."
          value={inputValue()}
          class="w-full px-4 py-3 rounded-lg shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white focus-visible"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
        />

        <button id="addTaskBtn"
          type="button" // Important for forms if not submitting
          onClick={handleSubmit}
          class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus-visible">
          Add
        </button>


        {/* Suggestion Dropdown: ensure it has 'suggestion-dropdown-class' if used in onBlur */}
        <SuggestionDropdown
          items={suggestionItems}
          show={showSuggestions}
          setShow={setShowSuggestions}
          onSelect={handleSuggestionSelect}
          inputRef={inputRef!} // Asserting inputRef is defined as dropdown is shown based on it
          highlightedIndex={highlightedSuggestionIndex}
          setHighlightedIndex={setHighlightedSuggestionIndex}
          triggerCharPosition={popupPosition} // Use the unified popupPosition
        // Add a class for onBlur detection, e.g., class="suggestion-dropdown-class"
        />

        {/* Time Picker Popup: ensure it has 'time-picker-popup-class' if used in onBlur */}
        <TimePickerPopup
          show={showDatePicker}
          setShow={setShowDatePicker}
          onSelectDate={handleDateSelect}
          inputRef={inputRef!}
          triggerCharPosition={popupPosition} // Use the unified popupPosition
        // Add a class for onBlur detection, e.g., class="time-picker-popup-class"
        />
      </div>
    </div>
  );
};

export default TodoInput;
