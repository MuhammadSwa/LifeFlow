import { Show } from "solid-js"

export const FAB = (props: { onClick: () => void }) => {

  function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.maxTouchPoints > 0);
  }

  return (
    <Show when={isTouchDevice()}>
      <button
        type="button"
        onClick={props.onClick} // Call the new handler
        aria-label="Add new todo"
        class="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white
                 w-14 h-14 rounded-full flex items-center justify-center
                 shadow-xl transition-all duration-150 ease-in-out hover:scale-110
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
      // sm:hidden // Visible by default (mobile), hidden on sm screens and up
      >
        {/* Plus Icon SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
      </button>
    </Show>
  )

}
