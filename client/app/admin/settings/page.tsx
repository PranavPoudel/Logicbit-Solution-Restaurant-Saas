"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Building2, Percent, Truck, ToggleLeft, Search } from "lucide-react";

const STORAGE_KEY = "logicbit-admin-settings";

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
  defaultCommissionPercent: string;
  vatPercent: string;
  currency: string;
  maxDeliveryRadiusKm: string;
  minOrderAmount: string;
  requireRestaurantApproval: boolean;
  emailOnNewOrder: boolean;
  maintenanceMode: boolean;
  cookieBanner: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  googleAnalyticsId: string;
}

const DEFAULTS: PlatformSettings = {
  platformName: "LogicBit",
  supportEmail: "",
  supportPhone: "",
  supportAddress: "",
  defaultCommissionPercent: "10",
  vatPercent: "13",
  currency: "NPR",
  maxDeliveryRadiusKm: "10",
  minOrderAmount: "0",
  requireRestaurantApproval: false,
  emailOnNewOrder: true,
  maintenanceMode: false,
  cookieBanner: true,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  googleAnalyticsId: "",
};

type Errors = Partial<Record<keyof PlatformSettings, string>>;

function isNumberInRange(value: string, min: number, max: number) {
  if (value.trim() === "") return false;
  const n = Number(value);
  return !isNaN(n) && n >= min && n <= max;
}

function validate(s: PlatformSettings): Errors {
  const errors: Errors = {};
  if (!s.platformName.trim()) errors.platformName = "Platform name is required.";
  if (s.supportEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.supportEmail.trim())) {
    errors.supportEmail = "Enter a valid email address.";
  }
  if (!isNumberInRange(s.defaultCommissionPercent, 0, 100)) {
    errors.defaultCommissionPercent = "Enter a number from 0 to 100.";
  }
  if (!isNumberInRange(s.vatPercent, 0, 100)) {
    errors.vatPercent = "Enter a number from 0 to 100.";
  }
  if (!s.currency.trim()) errors.currency = "Currency is required.";
  if (!isNumberInRange(s.maxDeliveryRadiusKm, 1, 200)) {
    errors.maxDeliveryRadiusKm = "Enter a number from 1 to 200.";
  }
  if (!isNumberInRange(s.minOrderAmount, 0, 1000000)) {
    errors.minOrderAmount = "Enter 0 or a positive number.";
  }
  if (s.seoDescription.length > 160) {
    errors.seoDescription = "Keep the description under 160 characters.";
  }
  if (s.googleAnalyticsId.trim() && !/^(G|UA|GTM)-[A-Z0-9-]+$/i.test(s.googleAnalyticsId.trim())) {
    errors.googleAnalyticsId = "Use a format like G-XXXXXXXXXX.";
  }
  return errors;
}

// ---------- small UI pieces ----------
function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-blue-700" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const classes = `w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? "border-rose-400" : "border-gray-200"
  }`;
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={classes}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={classes}
        />
      )}
      {error ? (
        <p className="text-xs text-rose-600 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

// ---------- page ----------
export default function AdminSettingsPage() {
  const [values, setValues] = useState<PlatformSettings>(DEFAULTS);
  const [saved, setSaved] = useState<PlatformSettings>(DEFAULTS);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);

  // Load saved settings from this browser
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as PlatformSettings;
        setValues(parsed);
        setSaved(parsed);
      }
    } catch (err) {
      console.error("Could not read saved settings:", err);
    }
  }, []);

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setMessage(null);
  };

  const handleSave = () => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage("Please fix the highlighted fields.");
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      setSaved(values);
      setMessage("Settings saved.");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Could not save settings:", err);
      setMessage("Could not save settings in this browser.");
    }
  };

  const handleReset = () => {
    if (!window.confirm("Reset all fields to the default values? You still need to press Save.")) return;
    setValues(DEFAULTS);
    setErrors({});
    setMessage(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform-wide settings for LogicBit
        </p>
      </div>

      <div className="px-4 py-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
        These settings are saved in this browser only for now. They will connect to the backend once a
        settings endpoint is available.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <Section
          icon={Building2}
          title="General"
          description="Platform name and support contact details"
        >
          <TextField
            label="Platform name"
            value={values.platformName}
            onChange={(v) => set("platformName", v)}
            error={errors.platformName}
          />
          <TextField
            label="Support email"
            type="email"
            value={values.supportEmail}
            onChange={(v) => set("supportEmail", v)}
            error={errors.supportEmail}
            placeholder="support@example.com"
          />
          <TextField
            label="Support phone"
            type="tel"
            value={values.supportPhone}
            onChange={(v) => set("supportPhone", v)}
            placeholder="Support phone number"
          />
          <TextField
            label="Address"
            value={values.supportAddress}
            onChange={(v) => set("supportAddress", v)}
            placeholder="City, Country"
          />
        </Section>

        {/* Commission & tax */}
        <Section
          icon={Percent}
          title="Commission and tax"
          description="Defaults used for new restaurants"
        >
          <TextField
            label="Default commission (%)"
            type="number"
            value={values.defaultCommissionPercent}
            onChange={(v) => set("defaultCommissionPercent", v)}
            error={errors.defaultCommissionPercent}
            hint="Platform share of each order for new restaurants."
          />
          <TextField
            label="VAT (%)"
            type="number"
            value={values.vatPercent}
            onChange={(v) => set("vatPercent", v)}
            error={errors.vatPercent}
          />
          <TextField
            label="Currency"
            value={values.currency}
            onChange={(v) => set("currency", v.toUpperCase())}
            error={errors.currency}
            hint="Currency code, for example NPR."
          />
        </Section>

        {/* Delivery */}
        <Section
          icon={Truck}
          title="Delivery and orders"
          description="Limits for delivery and ordering"
        >
          <TextField
            label="Maximum delivery radius (km)"
            type="number"
            value={values.maxDeliveryRadiusKm}
            onChange={(v) => set("maxDeliveryRadiusKm", v)}
            error={errors.maxDeliveryRadiusKm}
          />
          <TextField
            label="Minimum order amount"
            type="number"
            value={values.minOrderAmount}
            onChange={(v) => set("minOrderAmount", v)}
            error={errors.minOrderAmount}
            hint="Use 0 for no minimum."
          />
        </Section>

        {/* Switches */}
        <Section
          icon={ToggleLeft}
          title="Platform options"
          description="Turn platform features on or off"
        >
          <Toggle
            label="Approve new restaurants first"
            description="New restaurants wait for admin approval before going live."
            checked={values.requireRestaurantApproval}
            onChange={(v) => set("requireRestaurantApproval", v)}
          />
          <Toggle
            label="Email on new order"
            description="Send an email to the restaurant when an order is placed."
            checked={values.emailOnNewOrder}
            onChange={(v) => set("emailOnNewOrder", v)}
          />
          <Toggle
            label="Cookie banner"
            description="Show a cookie consent banner to visitors."
            checked={values.cookieBanner}
            onChange={(v) => set("cookieBanner", v)}
          />
          <Toggle
            label="Maintenance mode"
            description="Show a maintenance message to customers."
            checked={values.maintenanceMode}
            onChange={(v) => set("maintenanceMode", v)}
          />
        </Section>

        {/* SEO */}
        <div className="lg:col-span-2">
          <Section
            icon={Search}
            title="SEO and analytics"
            description="How the site appears in search engines, and the tracking code"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Site title"
                value={values.seoTitle}
                onChange={(v) => set("seoTitle", v)}
                placeholder="LogicBit - Order food online"
              />
              <TextField
                label="Google Analytics ID"
                value={values.googleAnalyticsId}
                onChange={(v) => set("googleAnalyticsId", v)}
                error={errors.googleAnalyticsId}
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <TextField
              label="Meta description"
              multiline
              value={values.seoDescription}
              onChange={(v) => set("seoDescription", v)}
              error={errors.seoDescription}
              hint={`${values.seoDescription.length}/160 characters`}
            />
            <TextField
              label="Meta keywords"
              value={values.seoKeywords}
              onChange={(v) => set("seoKeywords", v)}
              hint="Separate keywords with commas."
              placeholder="food delivery, restaurants, your city"
            />
          </Section>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-64 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between gap-4 z-40">
        <p
          className={`text-sm ${
            message?.startsWith("Settings saved")
              ? "text-emerald-600"
              : message
              ? "text-rose-600"
              : "text-gray-400"
          }`}
        >
          {message ?? (dirty ? "You have unsaved changes." : "All changes saved.")}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}