export type Lang = "en" | "am";

const STORAGE_KEY = "alemitu-lang";

/** Amharic text when present and not blank, otherwise English. */
export function pickText(
  en: string,
  am: string | null | undefined,
  lang: Lang,
): string {
  return lang === "am" && am && am.trim() !== "" ? am : en;
}

export function pickOptional(
  en: string | null,
  am: string | null | undefined,
  lang: Lang,
): string | null {
  return lang === "am" && am && am.trim() !== "" ? am : en;
}

export function loadLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === "am" ? "am" : "en";
  } catch {
    return "en";
  }
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this visit only.
  }
}
