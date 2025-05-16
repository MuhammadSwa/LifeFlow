// src/components/SuggestionDropdown.tsx
// Key features of SuggestionDropdown:
//
// Takes items, visibility state (show, setShow), onSelect callback, and inputRef.
//
// Handles ArrowDown, ArrowUp, Enter, Escape for navigation and selection.
//
// highlightedIndex to track the selected item.
//
// Basic positioning (this is the trickiest part and might need a library like Popper.js or more sophisticated calculations for precise cursor positioning if triggerCharPosition is not enough).
//
// triggerCharPosition prop to allow positioning relative to a specific character in the input.


import { Component, For, createEffect, onCleanup, Accessor, Setter, JSX } from 'solid-js';

interface SuggestionDropdownProps {
  items: Accessor<string[]>; // The list of suggestions
  show: Accessor<boolean>;
  setShow: Setter<boolean>;
  onSelect: (item: string) => void;
  inputRef: HTMLInputElement; // To position relative to the input or cursor
  highlightedIndex: Accessor<number>;
  setHighlightedIndex: Setter<number>;
  // Optional: for positioning based on a trigger char like '(' or '@'
  triggerCharPosition?: Accessor<{ top: number; left: number } | null>;
}

const SuggestionDropdown: Component<SuggestionDropdownProps> = (props) => {
  let dropdownRef: HTMLUListElement | undefined;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.show()) return;

    const itemsLength = props.items().length;
    if (itemsLength === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        props.setHighlightedIndex((prev) => (prev + 1) % itemsLength);
        break;
      case 'ArrowUp':
        e.preventDefault();
        props.setHighlightedIndex((prev) => (prev - 1 + itemsLength) % itemsLength);
        break;
      case 'Enter':
        // case 'Tab': // Tab can also select
        e.preventDefault();
        e.stopPropagation()
        if (props.highlightedIndex() >= 0 && props.highlightedIndex() < itemsLength) {
          props.onSelect(props.items()[props.highlightedIndex()]);
        }
        break;
      case 'Tab': // Tab now cycles, similar to ArrowDown/ArrowUp
        e.preventDefault();
        if (itemsLength > 0) { // Only cycle if there are items
          if (e.shiftKey) { // Shift + Tab cycles upwards
            props.setHighlightedIndex((prev) => (prev - 1 + itemsLength) % itemsLength);
          } else { // Tab cycles downwards
            props.setHighlightedIndex((prev) => (prev + 1) % itemsLength);
          }
        } else {
          // If no items, allow Tab to perform its default action (move focus)
          // So, don't set handled = true here.
          // Or, you might want to close the dropdown: props.setShow(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        props.setShow(false);
        break;
    }
  };

  createEffect(() => {
    if (props.show()) {
      // Reset highlighted index when items change or dropdown is shown
      props.setHighlightedIndex(0);
      // Add global keydown listener
      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      // Focus the input to ensure it captures these events if dropdown itself isn't focusable
      // props.inputRef?.focus();
    } else {
      document.removeEventListener('keydown', handleKeyDown, true);
    }
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown, true));
  });

  // Scroll highlighted item into view
  createEffect(() => {
    if (props.show() && dropdownRef) {
      const highlightedItem = dropdownRef.children[props.highlightedIndex()] as HTMLLIElement;
      highlightedItem?.scrollIntoView({ block: 'nearest' });
    }
  });


  // Basic positioning logic (can be improved)
  const style = (): JSX.CSSProperties => {
    if (!props.inputRef || !props.show()) return { display: 'none' };

    if (props.triggerCharPosition && props.triggerCharPosition()) {
      const pos = props.triggerCharPosition();
      if (pos) {
        return {
          position: 'absolute',
          top: `${pos.top + 20}px`, // Offset below the char
          left: `${pos.left}px`,
          'z-index': '10',
          display: 'block',
        };
      }
    }
    // Fallback positioning (e.g., below input - needs more work for precise cursor pos)
    const rect = props.inputRef.getBoundingClientRect();
    return {
      position: 'absolute',
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      'z-index': '10',
      display: 'block',
    };
  };

  return (
    <ul
      ref={dropdownRef}
      class="absolute bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto py-1 text-sm"
      style={style()}
      role="listbox"
    >
      <For each={props.items()}>
        {(item, index) => (
          <li
            class={`px-3 py-1.5 cursor-pointer hover:bg-blue-500 hover:text-white
                            ${index() === props.highlightedIndex() ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            onClick={() => props.onSelect(item)}
            onMouseOver={() => props.setHighlightedIndex(index())} // Highlight on hover
            role="option"
            aria-selected={index() === props.highlightedIndex()}
          >
            {item}
          </li>
        )}
      </For>
      {props.items().length === 0 && props.show() && (
        <li class="px-3 py-1.5 text-gray-500 italic">No suggestions</li>
      )}
    </ul>
  );
};

export default SuggestionDropdown;
