import { createSignal, onMount } from "solid-js";
import { availableContexts, availableProjects } from "../stores/todoStore";
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
const getCharRectInInput = (inputRef: HTMLTextAreaElement | HTMLInputElement | undefined): { top: number; left: number } | null => {
  if (!inputRef) return null;

  if (inputRef instanceof HTMLTextAreaElement) {
    const coordinates = Caret.getRelativePosition(inputRef);
    return coordinates.top && coordinates.left ? coordinates : null;
  } else {
    // For regular inputs, we need a different approach
    const coordinates = {
      top: inputRef.offsetHeight,
      left: inputRef.selectionStart ? inputRef.selectionStart * 8 : 0 // rough estimate for character width
    };
    return coordinates;
  }
};

export interface TodoInputControlProps {
  initialValue: string;
  onSave: (text: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  inputType?: 'textarea' | 'input';
  buttonStyle?: 'floating' | 'inline' | 'none';
  showButtons?: boolean;
  buttonLabels?: {
    save: string;
    cancel?: string;
  };
  inputRef?: HTMLTextAreaElement | HTMLInputElement;
  setInputRef?: (el: HTMLTextAreaElement | HTMLInputElement) => void;
  placeholder?: string;
  class?: string;
  onKeyDown?: (e: KeyboardEvent) => void;
}

const TodoInputControl = (props: TodoInputControlProps) => {
  // --- State Signals ---
  const [inputValue, setInputValue] = createSignal(props.initialValue || '');
  let localInputRef: HTMLTextAreaElement | HTMLInputElement | undefined;

  // Define a getter for the actual inputRef to use
  const getInputRef = () => props.inputRef || localInputRef;

  // Set the ref when it's available
  const setRef = (el: HTMLTextAreaElement | HTMLInputElement) => {
    localInputRef = el;
    if (props.setInputRef) {
      props.setInputRef(el);
    }
  };

  onMount(() => {
    if (props.autoFocus) {
      getInputRef()?.focus();
    }
  });

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
    // Character or pattern that triggers this suggestion type
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
  const suggestionConfigs: Record<Exclude<SuggestionMode, null>, SuggestionConfig> = {
    priority: {
      triggerPattern: '(',
      condition: (charBeforeCursor, _, existingTodo) =>
        charBeforeCursor === '(' && !existingTodo.priority,
      getItems: () => PRIORITIES.map(p => `(${p})`),
      getPopupPosition: () => getCharRectInInput(getInputRef()),
    },
    context: {
      triggerPattern: '@',
      condition: (_, currentWord, existingTodo) =>
        currentWord.startsWith('@') && existingTodo.contexts.length === 0,
      getItems: (currentWord) => {
        const query = currentWord.substring(1).toLowerCase();
        return availableContexts().filter(c => c.toLowerCase().startsWith(query));
      },
      getPopupPosition: () => getCharRectInInput(getInputRef()),
    },
    project: {
      triggerPattern: '+',
      condition: (_, currentWord, existingTodo) =>
        currentWord.startsWith('+') && existingTodo.projects.length === 0,
      getItems: (currentWord) => {
        const query = currentWord.substring(1).toLowerCase();
        return availableProjects().filter(p => p.toLowerCase().startsWith(query));
      },
      getPopupPosition: () => getCharRectInInput(getInputRef()),
    },
    date_keyword: {
      triggerPattern: 'due:',
      condition: (_, currentWord, existingTodo) => {
        const potentialKeyword = currentWord.toLowerCase();
        return "due:".startsWith(potentialKeyword) && potentialKeyword.length > 0 && !existingTodo.metadata.due;
      },
      getItems: () => ['due:YYYY-MM-DD'],
      getPopupPosition: () => getCharRectInInput(getInputRef()),
      onSelectAction: (currentText, cursorPos, _) => {
        // Replace the typed keyword with "due:"
        const wordStartMatch = currentText.substring(0, cursorPos).match(/\S+$/);
        if (!wordStartMatch || wordStartMatch.index === undefined) return;

        const textBefore = currentText.substring(0, wordStartMatch.index);
        const textAfter = currentText.substring(cursorPos);
        const newText = `${textBefore}due:${textAfter}`;

        setInputValue(newText);

        const dueKeywordEndPos = wordStartMatch.index + "due:".length;
        setPopupPosition(getCharRectInInput(getInputRef()));
        setShowDatePicker(true);

        // Move cursor after "due:"
        setTimeout(() => {
          const inputRef = getInputRef();
          if (inputRef) {
            inputRef.setSelectionRange(dueKeywordEndPos, dueKeywordEndPos);
          }
        }, 0);
      }
    }
  };

  // Analyzes the input text and cursor position to determine if suggestions should be shown
  const updateSuggestionsState = (text: string, cursorPos: number) => {
    // Reset states before evaluating
    setShowSuggestions(false);
    setShowDatePicker(false);
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
    const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
    const text = target.value;
    setInputValue(text);
    updateSuggestionsState(text, target.selectionStart || 0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Let SuggestionDropdown handle its keys if active
    if (showSuggestions() && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
      return; // Let SuggestionDropdown handle this
    }

    // Handle Escape for DatePicker
    if (showDatePicker() && e.key === 'Escape') {
      e.preventDefault();
      setShowDatePicker(false);
      getInputRef()?.focus();
      return;
    }

    // Handle Enter for submitting
    if (e.key === 'Enter' && !showSuggestions() && !showDatePicker()) {
      // Don't prevent default for textarea as Enter should create a new line
      if (props.inputType !== 'textarea') {
        e.preventDefault();
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      // Close popups on Escape
      setShowSuggestions(false);
      setShowDatePicker(false);
      setSuggestionMode(null);

      // Call onCancel if provided
      if (props.onCancel) {
        props.onCancel();
      }
    }

    // Forward the keydown event if a handler was provided
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events on the dropdown/datepicker
    setTimeout(() => {
      // Check if focus is now inside the suggestion dropdown or date picker
      const activeEl = document.activeElement;
      const isFocusInPopup = activeEl?.closest('.suggestion-dropdown-class') ||
        activeEl?.closest('.time-picker-popup-class');

      if (!isFocusInPopup) {
        setShowSuggestions(false);
      }
      if (!showDatePicker() && !isFocusInPopup) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  // Handles selection of an item from the suggestion dropdown
  const handleSuggestionSelect = (selectedItem: string) => {
    const mode = suggestionMode();
    const inputRef = getInputRef();
    if (!mode || !inputRef) return;

    const config = suggestionConfigs[mode];
    if (config.onSelectAction) {
      config.onSelectAction(inputValue(), inputRef.selectionStart || 0, selectedItem);
      setShowSuggestions(false);
      setSuggestionMode(null);
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

    if (startIndexToReplace !== -1) {
      const newText = `${textBeforeReplacement}${textToInsert}${textAfterReplacement}`;
      setInputValue(newText);
      const finalCursorPos = startIndexToReplace + newCursorPosOffset;
      setTimeout(() => {
        const ref = getInputRef();
        if (ref) ref.setSelectionRange(finalCursorPos, finalCursorPos);
      }, 0);
    } else {
      // Fallback: simple insertion
      const before = currentText.substring(0, cursorPos);
      const after = currentText.substring(cursorPos);
      setInputValue(`${before}${selectedItem} ${after}`);
      const finalCursorPos = cursorPos + selectedItem.length + 1;
      setTimeout(() => {
        const ref = getInputRef();
        if (ref) ref.setSelectionRange(finalCursorPos, finalCursorPos);
      }, 0);
    }

    setShowSuggestions(false);
    setSuggestionMode(null);
  };

  // Handles selection of a date from the TimePickerPopup
  const handleDateSelect = (date: string) => { // date is YYYY-MM-DD
    const inputRef = getInputRef();
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
      setTimeout(() => {
        const ref = getInputRef();
        if (ref) ref.setSelectionRange(finalCursorPos, finalCursorPos);
      }, 0);
    } else {
      // Fallback if "due:" is not immediately before cursor
      const newText = `${currentText.trim()} due:${date} `;
      setInputValue(newText);
      const finalCursorPos = newText.length;
      setTimeout(() => {
        const ref = getInputRef();
        if (ref) ref.setSelectionRange(finalCursorPos, finalCursorPos);
      }, 0);
    }

    setShowDatePicker(false);
    inputRef.focus();
  };

  // Submit handler
  const handleSubmit = () => {
    const text = inputValue().trim();
    if (text) {
      props.onSave(text);
    }

    // Reset all popups/suggestions
    setShowSuggestions(false);
    setShowDatePicker(false);
    setSuggestionMode(null);
    setPopupPosition(null);
  };

  // Render buttons based on props
  const renderButtons = () => {
    if (!props.showButtons) return null;

    return (
      <div class="flex gap-2 justify-end mt-2">
        <button
          onClick={handleSubmit}
          class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          {props.buttonLabels?.save || 'Save'}
        </button>
        {props.onCancel && (
          <button
            onClick={props.onCancel}
            class="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {props.buttonLabels?.cancel || 'Cancel'}
          </button>
        )}
      </div>
    );
  };

  // Render the floating button
  const renderFloatingButton = () => {
    if (props.buttonStyle !== 'floating') return null;

    return (
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white rounded-md px-3 py-1 text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
        onClick={handleSubmit}
      >
        {props.buttonLabels?.save || 'Add'}
      </button>
    );
  };

  // Different input element based on type prop
  const renderInput = () => {
    const commonProps = {
      ref: setRef,
      value: inputValue(),
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      onBlur: handleInputBlur,
      placeholder: props.placeholder || "Type ( for priority, @ for context, + for project, 'due:' for due date...",
      class: `w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.buttonStyle === 'floating' ? 'pr-16' : ''} ${props.class || ''}`
    };

    if (props.inputType === 'textarea') {
      return <textarea {...commonProps} />;
    }

    return <input type="text" {...commonProps} />;
  };

  // --- JSX ---
  return (
    <div class="relative">
      {renderInput()}
      {renderFloatingButton()}
      {props.buttonStyle === 'inline' && renderButtons()}

      {/* Suggestion Dropdown */}
      <SuggestionDropdown
        items={suggestionItems}
        show={showSuggestions}
        setShow={setShowSuggestions}
        onSelect={handleSuggestionSelect}
        inputRef={getInputRef() as HTMLTextAreaElement}
        highlightedIndex={highlightedSuggestionIndex}
        setHighlightedIndex={setHighlightedSuggestionIndex}
        triggerCharPosition={popupPosition}
      />

      {/* Time Picker Popup */}
      <TimePickerPopup
        show={showDatePicker}
        setShow={setShowDatePicker}
        onSelectDate={handleDateSelect}
        inputRef={getInputRef() as HTMLTextAreaElement}
        triggerCharPosition={popupPosition}
      />
    </div>
  );
};

export default TodoInputControl;
