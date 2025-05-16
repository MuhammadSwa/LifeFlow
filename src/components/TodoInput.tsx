// updateSuggestions(text, cursorPos):
// This is the core logic that parses the input text around the cursorPos.
// It uses regex or string methods to detect patterns like (, @word, +word, dword.
// Sets suggestionMode and filters suggestionItems (e.g., availableContexts(), availableProjects()) based on the typed query.
// Calls getCharPosition to try and determine where the popup should appear. This is the hardest part to get pixel-perfect without a library.
// handleSuggestionSelect(selectedItem):
// This function is called when a user selects an item from the SuggestionDropdown.
// It needs to intelligently insert the selectedItem into the inputValue at the correct position, replacing the partially typed trigger (e.g., (A becomes (A), @ph becomes @phone).
// It uses cursorPos and string manipulation.
// Crucially, it uses setTimeout(() => inputRef?.setSelectionRange(...), 0) to update the cursor position after Solid has re-rendered the input with the new value.

// handleDateSelect(date):
// Inserts the selected date, typically after "due:".

// handleKeyDown:
// If suggestion dropdown is active, it lets the dropdown's own keydown handler (passed via global event listener) manage navigation.
// Handles Enter for submitting the todo, Escape for closing popups.
//
// Positioning (getCharPosition and triggerCharRect):
//
// getCharPosition is a placeholder for a more robust solution. Accurately finding the pixel coordinates of a character within an <input type="text"> is non-trivial. Libraries like textarea-caret exist for <textarea>, but inputs are different.
//
// One common trick is to briefly create a hidden <span> with the text up to the cursor, measure its width, and add that to the input's left offset. This is implemented crudely in getCharPosition.
//
// The triggerCharRect signal stores this position so SuggestionDropdown and DatePickerPopup can use it in their style prop.
//
// Focus Management (onBlur, setTimeout):
//
// When the input blurs, you want to hide popups, but not if the blur was caused by clicking on a popup item. setTimeout provides a small delay to allow the click event on the popup to fire before hiding it.
//
// Ensuring the input regains focus appropriately after a selection can also be tricky.
//
// "due:" Keyword and Date Picker:
//
// The logic for 'd' is:
//
// User types 'd'.
//
// If it looks like they are starting to type "due", show "due:YYYY-MM-DD" as a suggestion.
//
// If they select "due:YYYY-MM-DD" from the suggestion:
//
// Replace the typed part (e.g., "d" or "du") with "due:".
//
// Set triggerCharRect to the position after "due:".
//
// Open the DatePickerPopup.
//
// Set cursor after "due:".
//
// When a date is selected from DatePickerPopup, it's appended after "due:".
//
// Next Steps and Refinements:
//
// Robust Cursor/Character Positioning: This is critical. Research libraries or more advanced techniques for getCharPosition. If you can't get perfect char positioning, you might position the dropdowns simply below the input, aligned left.
//
// Date Picker Implementation: Choose and integrate a good date picker library or build out DatePickerPopup.tsx.
//
// Styling: Ensure popups are styled well and don't cause layout shifts.
//
// Accessibility (ARIA): Add appropriate ARIA attributes to the input and popups (e.g., aria-controls, aria-haspopup, aria-activedescendant on the input when dropdown is open, roles on dropdown items). SuggestionDropdown has some basics.
//
// Edge Cases: Test thoroughly with various inputs, cursor movements, selections, etc.
//
// Refactoring: This TodoInput component will be large. Consider breaking down its internal logic into smaller helper functions or even custom primitives if parts are reusable.
//
// Global Event Listener in SuggestionDropdown: The use of a global event listener with capture: true in SuggestionDropdown is a common way to ensure it can intercept keyboard events even if the input field technically has focus. Make sure onCleanup correctly removes it.
//

import { Accessor, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { addTodo, availableContexts, availableProjects, setEditingTodoId } from "../stores/todoStore";
import DatePickerPopup from "./DatePickerPopup";
import SuggestionDropdown from "./SuggestionDropdown";
import { parseTodoTxtLine } from "../parsers/todoTxtParser";
import { Todo } from "../types";
import TimePickerPopup from "./TimePickerPopup";

type SuggestionMode = null | 'priority' | 'project' | 'context' | 'date_keyword';


const PRIORITIES = ['A', 'B', 'C', 'D']; // Standard priorities


const TodoInput = () => {
  const [inputValue, setInputValue] = createSignal('');
  let inputRef: HTMLInputElement | undefined;

  const [showSuggestions, setShowSuggestions] = createSignal(false);
  const [suggestionMode, setSuggestionMode] = createSignal<SuggestionMode>(null);
  const [suggestionItems, setSuggestionItems] = createSignal<string[]>([]);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = createSignal(0);

  const [showDatePicker, setShowDatePicker] = createSignal(false);

  // To store the screen position of the character that triggered the popup
  const [triggerCharRect, setTriggerCharRect] = createSignal<{ top: number, left: number } | null>(null);


  // Function to get cursor position or character position
  // This is a simplified version. Real cursor/char position in a text input is tricky.
  // Libraries like 'textarea-caret' can help for textareas. For inputs, it's harder.
  // This function will estimate based on input value length for simplicity.
  const getCharPosition = (charIndex: number): { top: number; left: number } | null => {
    if (!inputRef) return null;
    const rect = inputRef.getBoundingClientRect();
    // Crude estimation:
    const charWidth = inputRef.scrollWidth / (inputRef.value.length || 1);
    // A more robust way involves creating a temporary span with text up to charIndex
    // and measuring its width. For now, this is a placeholder.
    // const leftOffset = charIndex * charWidth; // This is very approximate

    // For simplicity, let's try to position based on where the last typed char might be.
    // We can try to get caret position using selectionStart
    const selectionStart = inputRef.selectionStart || 0;
    const tempSpan = document.createElement('span');
    tempSpan.style.font = window.getComputedStyle(inputRef).font;
    tempSpan.style.visibility = 'hidden';
    tempSpan.textContent = inputRef.value.substring(0, selectionStart);
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);


    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + textWidth,
    };
  };


  const updateSuggestions = (text: string, cursorPos: number) => {
    const charBeforeCursor = text[cursorPos - 1];
    const textBeforeCursor = text.substring(0, cursorPos);
    // regex: match any non-whitespace character at the end of the string
    const wordBeforeCursorMatch = textBeforeCursor.match(/[\S]+$/);
    const currentWord = wordBeforeCursorMatch ? wordBeforeCursorMatch[0] : "";

    // Reset suggestions first
    setShowSuggestions(false);
    setShowDatePicker(false);
    setSuggestionMode(null);
    setTriggerCharRect(null); // Reset position

    // --- Check for existing elements ---
    // parse the current input to see what's already there.
    // This is a simplified check. A full parse on every keystroke might be too much,
    // but for key elements, it's useful.
    const existingTodo = parseTodoTxtLine(text);

    interface SuggestionConfig {
      triggerChar: string;
      condition: (charBeforeCursor: string, text: string, cursorPos: number, currentWord: string, existingTodo: Todo) => boolean;
      getItems: (currentWord: string, availableContexts: Accessor<string[]>, availableProjects: Accessor<string[]>, PRIORITIES: string[]) => string[];
      getTriggerRect: (cursorPos: number, currentWord: string, getCharPosition: (charIndex: number) => { top: number; left: number } | null) => { top: number; left: number } | null;
    }

    // Define suggestion configurations in a data structure
    const suggestionConfigs: Record<string, SuggestionConfig> = {
      priority: {
        triggerChar: '(',
        condition: (charBeforeCursor, text, cursorPos, currentWord, existingTodo) =>
          // trigger suggestion when char is ( and there's no existing priority
          charBeforeCursor === '(' && !existingTodo.priority,
        getItems: (currentWord, availableContexts, availableProjects, PRIORITIES) =>
          PRIORITIES.map(p => `(${p})`),
        getTriggerRect: (cursorPos, currentWord, getCharPosition) =>
          getCharPosition(cursorPos - 1),
      },
      context: {
        triggerChar: '@',
        condition: (charBeforeCursor, text, cursorPos, currentWord, existingData) =>
          // trigger suggestion when char is @, and it's not part of a work like 'me@' and there's no existing context
          charBeforeCursor === '@' && currentWord.startsWith('@') && existingData.contexts.length === 0,
        getItems: (currentWord, availableContexts, availableProjects, PRIORITIES) => {
          const query = currentWord.substring(1).toLowerCase();
          // Filter availableContexts based on the query
          return availableContexts().filter(c => c.toLowerCase().startsWith(query));
        },
        getTriggerRect: (cursorPos, currentWord, getCharPosition) =>
          getCharPosition(cursorPos - currentWord.length),
      },
      project: {
        triggerChar: '+',
        condition: (charBeforeCursor, text, cursorPos, currentWord, existingData) =>
          charBeforeCursor === '+' && currentWord.startsWith('+') && existingData.projects.length === 0,
        getItems: (currentWord, availableContexts, availableProjects, PRIORITIES) => {
          const query = currentWord.substring(1).toLowerCase();
          // Filter availableProjects based on the query
          return availableProjects().filter(p => p.toLowerCase().startsWith(query));
        },
        getTriggerRect: (cursorPos, currentWord, getCharPosition) =>
          getCharPosition(cursorPos - currentWord.length),
      },
      date_keyword: {
        triggerChar: 'd', // or potentially the start of the word 'due'
        condition: (charBeforeCursor, text, cursorPos, currentWord, existingData) => {
          const potentialKeyword = currentWord.toLowerCase();
          // trigger suggestion when the word matches with 'due:'
          return "due:".startsWith(potentialKeyword) && potentialKeyword.length > 0 && !existingData.metadata.due;
        },
        getItems: (currentWord, availableContexts, availableProjects, PRIORITIES) =>
          ['due:YYYY-MM-DD'],
        getTriggerRect: (cursorPos, currentWord, getCharPosition) =>
          getCharPosition(cursorPos - currentWord.length),
      }
      // Add other suggestion types here
    };

    // --- Check for suggestions ---
    for (const [mode, config] of Object.entries(suggestionConfigs) as [SuggestionMode, SuggestionConfig][]) {
      if (config.condition(charBeforeCursor, text, cursorPos, currentWord, existingTodo)) {
        const suggestionItems = config.getItems(currentWord, availableContexts, availableProjects, PRIORITIES);
        if (mode !== 'date_keyword' || suggestionItems.length > 0) { // Only show date keyword if there are items (always one in this case)
          setSuggestionMode(mode);
          setSuggestionItems(suggestionItems);
          setShowSuggestions(suggestionItems.length > 0);
          setTriggerCharRect(config.getTriggerRect(cursorPos, currentWord, getCharPosition));
          return;
        }
      }
    }
  };

  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    const text = target.value;
    setInputValue(text);
    // a number that represents the beginning index of the selected text.
    // When nothing is selected(this case), then returns the position of the text input cursor (caret) inside of the <input> element.
    const cursorPos = target.selectionStart || 0;
    updateSuggestions(text, cursorPos);
  };

  const handleSuggestionSelect = (selectedItem: string) => {
    const currentText = inputValue();
    const cursorPos = inputRef?.selectionStart || currentText.length;

    let textToInsert = selectedItem;
    let replacementLength = 0; // How much of the current text to replace

    const mode = suggestionMode();

    if (mode === 'priority') { // e.g., selectedItem is "(A)"
      // Find the opening parenthesis before cursor
      const openParenIndex = currentText.substring(0, cursorPos).lastIndexOf('(');
      if (openParenIndex !== -1) {
        replacementLength = cursorPos - openParenIndex; // Replace from '(' to cursor
        const before = currentText.substring(0, openParenIndex);
        const after = currentText.substring(cursorPos);
        setInputValue(`${before}${textToInsert} ${after}`); // Add space after priority
        // Move cursor after the inserted text + space
        setTimeout(() => inputRef?.setSelectionRange(openParenIndex + textToInsert.length + 1, openParenIndex + textToInsert.length + 1), 0);
      }
    } else if (mode === 'context' || mode === 'project') { // e.g. selectedItem is "phone" or "MyProject"
      const triggerChar = mode === 'context' ? '@' : '+';
      textToInsert = `${triggerChar}${selectedItem} `; // Add trigger char and space

      const wordStartMatch = currentText.substring(0, cursorPos).match(new RegExp(`\\${triggerChar}\\S*$`));
      if (wordStartMatch && wordStartMatch.index !== undefined) {
        replacementLength = cursorPos - wordStartMatch.index;
        const before = currentText.substring(0, wordStartMatch.index);
        const after = currentText.substring(cursorPos);
        setInputValue(`${before}${textToInsert}${after}`);
        setTimeout(() => inputRef?.setSelectionRange(wordStartMatch.index! + textToInsert.length, wordStartMatch.index! + textToInsert.length), 0);
      }
    } else if (mode === 'date_keyword' && selectedItem.startsWith('due:')) {
      // Replace the typed keyword (e.g., "d", "du") with "due:"
      const wordStartMatch = currentText.substring(0, cursorPos).match(/\S+$/);
      if (wordStartMatch && wordStartMatch.index !== undefined) {
        const before = currentText.substring(0, wordStartMatch.index);
        const after = currentText.substring(cursorPos);
        const newText = `${before}due:`;
        setInputValue(`${newText}${after}`);
        setTriggerCharRect(getCharPosition(wordStartMatch.index + "due:".length - 1)); // Position for date picker
        setShowDatePicker(true); // Open date picker
        // Move cursor after "due:"
        setTimeout(() => {
          inputRef?.setSelectionRange(wordStartMatch.index! + "due:".length, wordStartMatch.index! + "due:".length);
          // inputRef?.focus(); // Ensure date picker doesn't steal focus immediately if it auto-focuses
        }, 0);
      }
    } else { // Fallback, just append (shouldn't happen with current modes)
      setInputValue(currentText.substring(0, cursorPos) + textToInsert + currentText.substring(cursorPos));
    }

    setShowSuggestions(false);
    setSuggestionMode(null);
    // inputRef?.focus(); // Re-focus input after selection
  };

  const handleDateSelect = (date: string) => { // YYYY-MM-DD
    const currentText = inputValue();
    const cursorPos = inputRef?.selectionStart || currentText.length;
    // Assuming "due:" is already typed and cursor is right after it
    const textBeforeDue = currentText.substring(0, cursorPos); // Should end with "due:"
    const textAfterDue = currentText.substring(cursorPos);

    if (textBeforeDue.endsWith("due:")) {
      setInputValue(`${textBeforeDue}${date} ${textAfterDue}`);
      // Move cursor after the date + space
      setTimeout(() => inputRef?.setSelectionRange(cursorPos + date.length + 1, cursorPos + date.length + 1), 0);
    }
    setShowDatePicker(false);
    // inputRef?.focus();
  };

  const handleSubmit = () => {

    const text = inputValue().trim();
    if (text) {
      addTodo(text);
      setInputValue('');
      setShowSuggestions(false);
      setShowDatePicker(false);
      setSuggestionMode(null);
    }

    inputRef?.focus();
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showSuggestions() && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
      // Let SuggestionDropdown handle these if it's active
      // The global listener in SuggestionDropdown should catch them.
      // e.preventDefault(); // May be needed if SuggestionDropdown doesn't prevent default correctly
      return;
    }
    if (showDatePicker() && e.key === 'Escape') {
      e.preventDefault();
      setShowDatePicker(false);
      inputRef?.focus();
      return;
    }

    if (e.key === 'Enter' && !showSuggestions() && !showDatePicker()) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowDatePicker(false);
    }
  };

  // // Close dropdowns if clicked outside
  const handleClickOutside = (event: MouseEvent) => {
    if (inputRef && !inputRef.contains(event.target as Node)) {
      // A bit more complex: check if click is on dropdown/datepicker itself
      // For now, a simpler check: if not input, hide.
      // This needs to be refined so clicking on dropdown items works.
      // SuggestionDropdown and DatePickerPopup should handle their own visibility on selection/blur.
    }
  };
  //
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

  return (
    <div class="relative"> {/* Parent needs to be relative for absolute positioning of popups */}
      <input
        ref={inputRef}
        type='text'
        placeholder="Type ( for priority, @ for context, + for project, d for due..."
        value={inputValue()}
        class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay hiding to allow click on dropdown/datepicker
          setTimeout(() => {
            if (!showDatePicker() && !document.activeElement?.closest('.suggestion-dropdown-class')) { // Add class to dropdown
              setShowSuggestions(false);
            }
          }, 150);
        }}
      />
      <SuggestionDropdown
        items={suggestionItems}
        show={showSuggestions}
        setShow={setShowSuggestions}
        onSelect={handleSuggestionSelect}
        inputRef={inputRef!} // Assert inputRef is defined
        highlightedIndex={highlightedSuggestionIndex}
        setHighlightedIndex={setHighlightedSuggestionIndex}
        triggerCharPosition={triggerCharRect}
      />
      <TimePickerPopup
        show={showDatePicker}
        setShow={setShowDatePicker}
        onSelectDate={handleDateSelect}
        inputRef={inputRef!}
        triggerCharPosition={triggerCharRect} // Can reuse or have specific for date
      />
      {/* Add button can be outside the relative div or styled appropriately */}
      <button
        class="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white rounded-md px-3 py-1 text-sm hover:bg-green-600"
        onClick={handleSubmit}
      >
        Add
      </button>
    </div>
  );
}

export default TodoInput
