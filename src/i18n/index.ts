import { nl } from './nl';

export type TranslationKey = keyof typeof nl;

const dictionaries = { nl } as const;
export type Locale = keyof typeof dictionaries;

/**
 * Only Dutch exists today, and the spec says so. The indirection is here from
 * the first commit anyway, because retrofitting i18n means touching every
 * component that ever shipped, while carrying it from the start costs one
 * function call per string.
 */
let activeLocale: Locale = 'nl';

export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getLocale(): Locale {
  return activeLocale;
}

/**
 * Interpolates {name} placeholders. Deliberately not a template engine: a
 * string that needs logic is a string that should have been two strings.
 */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const template: string = dictionaries[activeLocale][key];
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}
