import { useEffect, useRef, type Child } from "hono/jsx";
import "vanilla-colorful/hex-color-picker.js";
import type { HexColorPicker } from "vanilla-colorful/hex-color-picker.js";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  class?: string;
  children: Child;
}

export function Field({ id, label, hint, error, class: className, children }: FieldProps) {
  return (
    <div class={className ? `field ${className}` : "field"}>
      <label for={id}>{label}</label>
      {children}
      {hint && (
        <p class="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <p class="error" id={`${id}-error`} role="alert">
        {error}
      </p>
    </div>
  );
}

interface SegmentedProps<T extends string> {
  name: string;
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ name, legend, options, value, onChange }: SegmentedProps<T>) {
  return (
    <fieldset class="segmented">
      <legend>{legend}</legend>
      <div class="segmented-track">
        {options.map((option) => (
          <label>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function placePopover(popover: HTMLElement, anchor: HTMLElement) {
  const gap = 8;
  const box = anchor.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = popover;
  const below = box.bottom + gap + height <= innerHeight || box.top - gap - height < 0;
  popover.style.top = `${scrollY + (below ? box.bottom + gap : box.top - gap - height)}px`;
  popover.style.left = `${scrollX + Math.max(gap, Math.min(box.left, innerWidth - width - gap))}px`;
}

interface ColorInputProps {
  id: string;
  label: string;
  value: string;
  color: string;
  invalid: boolean;
  optional?: boolean;
  inputLabel?: string;
  onChange: (value: string) => void;
}

export function ColorInput({ id, label, value, color, invalid, optional, inputLabel, onChange }: ColorInputProps) {
  const swatch = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const picker = useRef<HexColorPicker>(null);
  const latestOnChange = useRef(onChange);
  latestOnChange.current = onChange;

  useEffect(() => {
    const element = picker.current!;
    const listener = (event: Event) =>
      latestOnChange.current((event as CustomEvent<{ value: string }>).detail.value.toUpperCase());
    element.addEventListener("color-changed", listener);
    return () => element.removeEventListener("color-changed", listener);
  }, []);

  const onToggle = (event: ToggleEvent) => {
    const element = popover.current!;
    if (event.newState !== "open") return element.removeAttribute("data-placed");
    picker.current!.color = color.toLowerCase();
    placePopover(element, swatch.current!);
    element.setAttribute("data-placed", "");
  };

  const reset = () => {
    onChange("");
    popover.current!.hidePopover();
  };

  return (
    <div class="color-input">
      <button
        ref={swatch}
        type="button"
        class="swatch"
        id={`${id}-swatch`}
        popovertarget={`${id}-popover`}
        aria-label={`Pick ${label.toLowerCase()} color`}
        style={`--swatch:${color}`}
        data-default={optional && !value.trim()}
      />
      <div ref={popover} id={`${id}-popover`} class="color-popover" popover="auto" onToggle={onToggle}>
        <hex-color-picker ref={picker} />
        {optional && (
          <button type="button" class="reset" onClick={reset}>
            Use style default
          </button>
        )}
      </div>
      <input
        id={id}
        class="mono"
        value={value}
        placeholder={optional ? color : undefined}
        autocomplete="off"
        aria-label={inputLabel}
        aria-invalid={invalid ? "true" : undefined}
        aria-describedby={`${id}-error`}
        onInput={(event: Event) => onChange((event.target as HTMLInputElement).value)}
      />
    </div>
  );
}
