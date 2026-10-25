import { useCallback, useEffect, useState } from "react";
import { loadLang, saveLang, type Lang } from "./language";

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    saveLang(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [lang]);

  return { lang, setLang };
}
