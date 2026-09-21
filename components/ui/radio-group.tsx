"use client";

import * as React from "react";

interface RadioGroupContextValue {
  value: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
  value: "",
});

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  "aria-labelledby"?: string;
}

export function RadioGroup({
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  disabled = false,
  className = "",
  children,
  "aria-labelledby": ariaLabelledby,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const handleChange = onValueChange ?? setInternalValue;

  return (
    <RadioGroupContext.Provider
      value={{ value, onValueChange: handleChange, disabled }}
    >
      <div
        role="radiogroup"
        className={`grid gap-3 ${className}`}
        aria-labelledby={ariaLabelledby}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  id?: string;
  className?: string;
}

export function RadioGroupItem({
  value,
  id,
  className = "",
}: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext);
  const isChecked = context.value === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      disabled={context.disabled}
      className={`aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
        isChecked ? "border-primary" : ""
      } ${className}`}
      id={id}
      onClick={() => context.onValueChange?.(value)}
    >
      {isChecked && (
        <span className="flex items-center justify-center">
          <span className="size-2 rounded-full bg-primary" />
        </span>
      )}
    </button>
  );
}
