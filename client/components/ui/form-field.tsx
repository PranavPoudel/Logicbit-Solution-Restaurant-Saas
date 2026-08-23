// components/ui/form-field.tsx
import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? inputProps.name;
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-[#17181C] mb-1.5"
      >
        {label}
      </label>
      <input
        id={fieldId}
        {...inputProps}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-[#17181C] placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-colors ${
          error
            ? "border-red-300 focus:ring-red-200"
            : "border-[#E8E7E2] focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
        }`}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
