import { createSignal, } from "solid-js";
import { addTodo, availableContexts, availableProjects } from "../stores/todoStore";
import SuggestionDropdown from "./SuggestionDropdown";
import { parseTodoTxtLine } from "../parsers/todoTxtParser";
import { Todo } from "../types";
import TimePickerPopup from "./TimePickerPopup";
import { Caret } from "textarea-caret-ts";

// Type for the suggestion mode
type SuggestionMode = null | 'priority' | 'project' | 'context' | 'date_keyword';

// Standard priorities for todos
const PRIORITIES = ['A', 'B', 'C', 'D'];

// --- Helper Functions ---
// get the relative position of the cursor in the input
const getCharRectInInput = (inputRef: HTMLInputElement | undefined): { top: number; left: number } | null => {
  if (!inputRef) return null;
  const coordinates = Caret.getRelativePosition(inputRef);
  return coordinates.top && coordinates.left ? coordinates : null;
};


// --- Component Definition ---

const TodoInput = () => {
  // --- State Signals ---
  const [inputValue, setInputValue] = createSignal('');
  let inputRef: HTMLTextAreaElement | undefined; // Ref for the input element

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
    getPopupPosition: (cursorPos: number, currentWord: string) => { top: number; left: number } | null;
    // Optional: Action to take when this suggestion type is selected but doesn't directly insert text (e.g., open date picker)
    onSelectAction?: (currentText: string, cursorPos: number, selectedItem: string) => void;
  }

  // Configuration for different suggestion types
  // Note: `availableContexts` and `availableProjects` are accessors, so call them with `()`
  const suggestionConfigs: Record<Exclude<SuggestionMode, null>, SuggestionConfig> = {
    priority: {
      triggerPattern: '(',
      condition: (charBeforeCursor, currentWord, existingTodo) =>
        charBeforeCursor === '(' && !existingTodo.priority,
      getItems: () => PRIORITIES.map(p => `(${p})`),
      getPopupPosition: (cursorPos) => getCharRectInInput(inputRef),
    },
    context: {
      triggerPattern: '@',
      condition: (charBeforeCursor, currentWord, existingTodo) =>
        currentWord.startsWith('@') && existingTodo.contexts.length === 0, // Allow multiple later if needed
      getItems: (currentWord) => {
        const query = currentWord.substring(1).toLowerCase();
        return availableContexts().filter(c => c.toLowerCase().startsWith(query));
      },
      getPopupPosition: (cursorPos, currentWord) => getCharRectInInput(inputRef),
    },
    project: {
      triggerPattern: '+',
      condition: (charBeforeCursor, currentWord, existingTodo) =>
        currentWord.startsWith('+') && existingTodo.projects.length === 0, // Allow multiple later if needed
      getItems: (currentWord) => {
        const query = currentWord.substring(1).toLowerCase();
        return availableProjects().filter(p => p.toLowerCase().startsWith(query));
      },
      getPopupPosition: (cursorPos, currentWord) => getCharRectInInput(inputRef),
    },
    date_keyword: {
      triggerPattern: 'due:',
      condition: (charBeforeCursor, currentWord, existingTodo) => {
        const potentialKeyword = currentWord.toLowerCase();
        return "due:".startsWith(potentialKeyword) && potentialKeyword.length > 0 && !existingTodo.metadata.due;
      },
      getItems: () => ['due:YYYY-MM-DD'], // This is more of a placeholder to trigger the mode
      getPopupPosition: (cursorPos, currentWord) => getCharRectInInput(inputRef),
      onSelectAction: (currentText, cursorPos, selectedItem) => {
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
          setPopupPosition(config.getPopupPosition(cursorPos, currentWord));
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
      addTodo(text);
      setInputValue(''); // Clear input
      // Reset all popups/suggestions
      setShowSuggestions(false);
      setShowDatePicker(false);
      setSuggestionMode(null);
      setPopupPosition(null);
    }
    inputRef?.focus(); // Keep focus on input for next todo
  };

  // --- JSX ---
  return (
    <div class="relative">
      <textarea
        ref={inputRef}
        type="text"
        placeholder="Type ( for priority, @ for context, + for project, 'due:' for due date..."
        value={inputValue()}
        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16" // Added pr-16 for Add button
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleInputBlur}
      />

      <button
        type="button" // Important for forms if not submitting
        class="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white rounded-md px-3 py-1 text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        onClick={handleSubmit}
      >
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
  );
};

export default TodoInput;
