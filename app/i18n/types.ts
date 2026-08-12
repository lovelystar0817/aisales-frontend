// Import the English translations to use as the source of truth for types
import enTranslation from './locales/en.json';

// Define the translation resources type based on the English translation structure
export type TranslationResources = typeof enTranslation;

// Helper type to convert all leaf values to string type
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};

// This type ensures all translations follow the same structure as English
// but allows string values to be different
export type StrictTranslationResources = DeepStringify<TranslationResources>;

// If you need a more flexible approach that doesn't require exact structure matching:
export type FlexibleTranslationResources = {
  [K in keyof TranslationResources]?: TranslationResources[K] extends object
    ? {
        [P in keyof TranslationResources[K]]?: string | object;
      }
    : string;
};

// Use this type if you want to allow translations to have different structures
// while still providing some type checking for the top-level keys

// Create a type for translation keys with dot notation
export type TranslationKeys =
  | keyof TranslationResources
  | DotNotation<TranslationResources>;

// Type for nested objects with dot notation
type DotNotation<T extends object> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}.${DotNotation<T[K]>}`
    : K;
}[keyof T & (string | number)];
