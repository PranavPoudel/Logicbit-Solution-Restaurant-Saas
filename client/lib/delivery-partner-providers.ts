// lib/delivery-partner-providers.ts
export type ProviderKind = "marketplace" | "courier";
export type ConnectMethod = "oauth" | "credentials";

export interface ProviderField {
  key: string;
  label: string;
  secret?: boolean;
}

export interface ProviderConfig {
  key: string;
  label: string;
  initials: string;
  color: string;
  kind: ProviderKind;
  connect?: ConnectMethod[];
  description: string;
  fields: ProviderField[];
}

export const PROVIDERS: ProviderConfig[] = [
  {
    key: "uber-eats",
    label: "Uber Eats",
    initials: "UE",
    color: "#06C167",
    kind: "marketplace",
    description: "Customers order in the Uber Eats app and their couriers deliver.",
    fields: [
      { key: "storeId", label: "Store ID" },
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client secret", secret: true },
    ],
  },
  {
    key: "uber-direct",
    label: "Uber Direct",
    initials: "UD",
    color: "#000000",
    kind: "courier",
    description: "You send orders from your own site and Uber couriers deliver them.",
    fields: [
      { key: "customerId", label: "Customer ID" },
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client secret", secret: true },
    ],
  },
  {
    key: "pathao",
    label: "Pathao",
    initials: "PA",
    color: "#E11D48",
    kind: "courier",
    description: "Pathao riders pick up and deliver your orders.",
    fields: [
      { key: "storeId", label: "Store ID" },
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client secret", secret: true },
    ],
  },
  {
    key: "foodmandu",
    label: "Foodmandu",
    initials: "FM",
    color: "#F97316",
    kind: "marketplace",
    description: "Foodmandu lists your restaurant and delivers with its own riders.",
    fields: [
      { key: "partnerId", label: "Partner ID" },
      { key: "apiKey", label: "API key", secret: true },
    ],
  },
  {
    key: "wolt",
    label: "Wolt",
    initials: "WO",
    color: "#009DE0",
    kind: "courier",
    description: "Wolt Drive couriers deliver orders placed on your own site.",
    fields: [
      { key: "merchantId", label: "Merchant ID" },
      { key: "apiKey", label: "API key", secret: true },
    ],
  },
  {
    key: "doordash",
    label: "DoorDash",
    initials: "DD",
    color: "#FF3008",
    kind: "courier",
    description: "DoorDash Drive couriers deliver orders placed on your own site.",
    fields: [
      { key: "developerId", label: "Developer ID" },
      { key: "keyId", label: "Key ID" },
      { key: "signingSecret", label: "Signing secret", secret: true },
    ],
  },
  {
    key: "other",
    label: "Other service",
    initials: "+",
    color: "#525252",
    kind: "courier",
    connect: ["credentials"],
    description: "Any other delivery company you work with.",
    fields: [
      { key: "accountId", label: "Account ID" },
      { key: "apiKey", label: "API key", secret: true },
    ],
  },
];

const BOTH: ConnectMethod[] = ["oauth", "credentials"];

export const OTHER_PROVIDER = PROVIDERS[PROVIDERS.length - 1];

export const findProvider = (name: string) => {
  const found = PROVIDERS.find((p) => p.label.toLowerCase() === name.trim().toLowerCase()) ?? OTHER_PROVIDER;
  return { ...found, connect: found.connect ?? BOTH };
};

export const formatPartnerFee = (p: { feeType: "FLAT" | "PERCENT"; feeValue: number }) =>
  p.feeType === "PERCENT" ? `${p.feeValue}% per order` : `Rs ${p.feeValue} per delivery`;
