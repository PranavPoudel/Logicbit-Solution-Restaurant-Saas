// components/owner-settings/settings-field.tsx
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
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {hint && <p className="text-xs text-neutral-400 mt-0.5">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${
          checked ? "bg-[#0F6B5C]" : "bg-neutral-200"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
