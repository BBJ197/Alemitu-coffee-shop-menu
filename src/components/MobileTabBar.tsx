import { Link } from "react-router-dom";
import { pickText, type Lang } from "../lib/language";
import MenuIcon from "./MenuIcon";

function goTop() {
  const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
}

function goSearch() {
  const input = document.getElementById("menu-search");
  input?.scrollIntoView({ block: "center" });
  input?.focus();
}

export default function MobileTabBar({ lang }: { lang: Lang }) {
  return (
    <nav
      className="menu-tabbar"
      aria-label={pickText("Quick navigation", "ፈጣን አሰሳ", lang)}
    >
      <Link to="/">
        <MenuIcon name="cup" size={22} />
        {pickText("Home", "መነሻ", lang)}
      </Link>
      <button type="button" onClick={goSearch}>
        <MenuIcon name="search" size={22} />
        {pickText("Search", "ፈልግ", lang)}
      </button>
      <button type="button" onClick={goTop}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        {pickText("Top", "ወደ ላይ", lang)}
      </button>
    </nav>
  );
}
