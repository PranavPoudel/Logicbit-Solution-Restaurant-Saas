import type { InputHTMLAttributes } from "react";

interface SettingsFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function SettingsField({ label, hint, id, ...inputProps }: SettingsFieldProps) {
  const fieldId = id ?? inputProps.name;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
      </label>
      <input
        id={fieldId}
        {...inputProps}
        className="w-full bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
      />
      {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

export function SettingsToggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id?: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  // Auto-generate an ID based on the label if none is provided
  const toggleId = id ?? `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 pr-4">
        {/* Clicking the text now toggles the switch! */}
        <label htmlFor={toggleId} className="text-sm font-medium text-neutral-800 cursor-pointer">
          {label}
        </label>
        {hint && <p className="text-xs text-neutral-400 mt-0.5">{hint}</p>}
      </div>
      
      {/* Standard Tailwind UI Toggle Switch */}
      <label htmlFor={toggleId} className="relative inline-flex cursor-pointer">
        <input
          type="checkbox"
          id={toggleId}
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0F6B5C] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F6B5C]"></div>
      </label>
    </div>
  );
}