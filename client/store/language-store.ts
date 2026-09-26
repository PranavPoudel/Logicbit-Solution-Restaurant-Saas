// store/language-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ja' | 'np' | 'hi'; // We can add more languages  later

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    { 
      name: 'logicbit-language-preference', // Saves to localStorage
    }
  )
);