// CheckboxComponent.jsx
import { createSignal } from "solid-js";

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
}
export const Checkbox = (props: CheckboxProps) => {
  const [checked, setChecked] = createSignal(props.checked);


  const handleChange = (e) => {
    const newChecked = e.target.checked;
    setChecked(newChecked);

    // Call parent onChange if provided
    if (props.onChange) {
      props.onChange();
    }
  };

  return (
    <label class="flex items-center cursor-pointer group">
      <div class="relative">
        {/* Hidden native checkbox */}
        <input
          type="checkbox"
          class="sr-only"
          checked={checked()}
          onChange={handleChange}
          aria-checked={checked()}
        />

        {/* Custom checkbox background */}
        <div
          class={`
            w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center 
            ${checked() ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-700 border-gray-600'}
          `}
        >
          {/* Check mark */}
          <svg
            class={`w-3 h-3 text-white transition-all duration-200 ${checked() ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    </label>
  );
};
