
// For a full calendar, you'd likely use a library (e.g., flatpickr wrapped in a Solid component, or build a more complex one). Here's a very basic structure:
// src/components/DatePickerPopup.tsx
import { Component, Accessor, Setter, JSX } from 'solid-js';
import TimePickerPopup from './TimePickerPopup';
// For a real date picker, you'd import a library or build it out.
// This is a placeholder.

interface DatePickerPopupProps {
  show: Accessor<boolean>;
  setShow: Setter<boolean>;
  onSelectDate: (date: string) => void; // YYYY-MM-DD
  inputRef: HTMLInputElement;
  triggerCharPosition?: Accessor<{ top: number; left: number } | null>;
}

const DatePickerPopup: Component<DatePickerPopupProps> = (props) => {
  const handleDateSelect = (e: Event) => {
    const selectedDate = (e.currentTarget as HTMLInputElement).value;
    if (selectedDate) {
      props.onSelectDate(selectedDate);
      props.setShow(false);
    }
  };

  const style = (): JSX.CSSProperties => {
    if (!props.inputRef || !props.show()) return { display: 'none' };
    if (props.triggerCharPosition && props.triggerCharPosition()) {
      const pos = props.triggerCharPosition();
      if (pos) {
        return {
          position: 'absolute',
          top: `${pos.top + 20}px`,
          left: `${pos.left}px`,
          'z-index': '10',
          display: 'block',
        };
      }
    }
    // Fallback
    const rect = props.inputRef.getBoundingClientRect();
    return {
      position: 'absolute',
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      'z-index': '10',
      display: 'block',
      padding: '10px',
      background: 'white',
      border: '1px solid #ccc',
      'border-radius': '4px',
      'box-shadow': '0 2px 10px rgba(0,0,0,0.1)',
    };
  };

  return (
    <div style={style()}>
      {props.show() && (
        <TimePickerPopup handleDateSelect={handleDateSelect} />
      )}
    </div>
  )
  // A very simple native date input for demonstration
};

export default DatePickerPopup;

// <div style={style()}>
//   {props.show() && (
//     <TimePicker />
//   )}
// </div>

// return (
//   <div style={style()}>
//     {props.show() && (
//       <>
//         <label for="popup-date-picker" class="block text-sm font-medium text-gray-700 mb-1">Select Due Date:</label>
//         <input
//           type="date"
//           id="popup-date-picker"
//           class="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//           onChange={handleDateSelect}
//           onBlur={() => setTimeout(() => props.setShow(false), 100)} // Delay blur to allow click
//           autofocus // Try to focus it
//         />
//         <button onClick={() => props.setShow(false)} class="mt-2 text-xs text-gray-500">Close</button>
//       </>
//     )}
//   </div>
// );
