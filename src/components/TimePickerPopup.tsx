import { createSignal, onMount, onCleanup, Accessor, Setter, JSX, createEffect } from 'solid-js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { formatDate } from '../utils/date';

interface TimePickerPopupProps {
  show: Accessor<boolean>;
  setShow: Setter<boolean>;
  onSelectDate: (date: string) => void; // YYYY-MM-DD
  inputRef: HTMLTextAreaElement;
  triggerCharPosition?: Accessor<{ top: number; left: number } | null>;
}


const TimePickerPopup = (props: TimePickerPopupProps) => {
  const [selectedDate, setSelectedDate] = createSignal(new Date());
  const [timePickerInstance, setTimePickerInstance] = createSignal<flatpickr.Instance | null>(null);
  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (props.show()) {
      inputRef?.focus();
    }
  })


  const handleDateSelect = () => {
    if (selectedDate) {
      // const formattedDate = selectedDate.toISOString().split('T')[0];
      // TODO: change format
      props.onSelectDate(formatDate(selectedDate()));
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


  onMount(() => {
    // Calculate date range (today + 30 days)
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    // Initialize flatpickr
    const fpInstance = flatpickr(inputRef!, {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      defaultDate: today,
      minDate: today,
      allowInput: true,
      inline: true, // This makes the calendar always visible
      static: true, // Positions the calendar better when inline
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          setSelectedDate(selectedDates[0]);
        }
      }
    });

    setTimePickerInstance(fpInstance);
  });

  // Handle key down events (for Enter key)
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleDateSelect();
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      props.setShow(false);
    }
  };

  onCleanup(() => {
    // Clean up flatpickr instance
    const instance = timePickerInstance();
    if (instance) {
      instance.destroy();
    }
  });


  return (
    <div style={style()}>
      <div class="w-full max-w-md mx-auto p-4" onkeydown={handleKeyDown} tabindex="0">
        <div class="mb-4">
          <input
            ref={inputRef}
            id="datetime-picker"
            type="text"
            class="w-full"
            onkeydown={handleKeyDown}

          />
        </div>

        <button
          onClick={handleDateSelect}
          class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Confirm Selection
        </button>
      </div>
    </div>

  );
};

export default TimePickerPopup;
