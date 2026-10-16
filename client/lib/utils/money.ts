// lib/utils/money.ts
import { theme } from "@/config/theme";

export const money = (amount: number) => `${theme.content.currencyPrefix} ${amount}`;
