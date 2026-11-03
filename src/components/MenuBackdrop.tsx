import type { CSSProperties } from "react";

type Kind = "bean" | "jebena" | "cup" | "injera" | "chili" | "teff";

type Spec = {
  kind: Kind;
  x: number;
  size: number;
  dur: number;
  delay: number;
  drift: number;
  gold?: boolean;
};

// Ethiopian coffee and food icons that drift slowly up the page.
// Negative delays so the screen is already populated on first paint.
const ITEMS: Spec[] = [
  { kind: "jebena", x: 6, size: 54, dur: 34, delay: -6, drift: 30 },
  {
    kind: "bean",
    x: 20,
    size: 30,
    dur: 26,
    delay: -18,
    drift: -24,
    gold: true,
  },
  { kind: "injera", x: 34, size: 50, dur: 38, delay: -12, drift: 20 },
  { kind: "cup", x: 48, size: 44, dur: 30, delay: -2, drift: -30 },
  {
    kind: "chili",
    x: 60,
    size: 36,
    dur: 28,
    delay: -22,
    drift: 26,
    gold: true,
  },
  { kind: "teff", x: 72, size: 46, dur: 36, delay: -9, drift: -20 },
  { kind: "bean", x: 84, size: 34, dur: 24, delay: -15, drift: 24 },
  {
    kind: "jebena",
    x: 92,
    size: 42,
    dur: 40,
    delay: -27,
    drift: -26,
    gold: true,
  },
  { kind: "cup", x: 12, size: 38, dur: 32, delay: -30, drift: 22 },
  { kind: "injera", x: 78, size: 40, dur: 35, delay: -4, drift: -18 },
];

function Shape({ kind }: { kind: Kind }) {
  switch (kind) {
    case "bean":
      return (
        <g transform="rotate(35 24 24)">
          <ellipse cx="24" cy="24" rx="10" ry="16" />
          <path d="M24 8C30 18 18 30 24 40" />
        </g>
      );
    case "jebena":
      return (
        <>
          <path d="M21 6H27L26 17C34 20 37 27 35 35C34 40 30 42 24 42C18 42 14 40 13 35C11 27 14 20 22 17Z" />
          <path d="M21 6C21 3 27 3 27 6" />
          <path d="M35 28L42 22" />
          <path d="M13 26C6 26 6 38 14 38" />
        </>
      );
    case "cup":
      return (
        <>
          <path d="M10 20H34V30C34 36 30 40 22 40C14 40 10 36 10 30Z" />
          <path d="M34 23C41 23 41 33 34 33" />
          <path d="M8 44H38" />
          <path d="M17 8C14 12 20 14 17 18" />
          <path d="M25 8C22 12 28 14 25 18" />
        </>
      );
    case "injera":
      return (
        <>
          <circle cx="24" cy="24" r="18" />
          <circle cx="24" cy="24" r="11" />
          <circle cx="24" cy="24" r="2" />
          <circle cx="18" cy="20" r="1.5" />
          <circle cx="30" cy="20" r="1.5" />
          <circle cx="24" cy="31" r="1.5" />
        </>
      );
    case "chili":
      return (
        <>
          <path d="M30 10C36 8 40 12 38 18C34 30 20 40 8 40C16 32 26 22 28 12Z" />
          <path d="M28 12C28 8 30 6 32 5" />
        </>
      );
    case "teff":
      return (
        <>
          <path d="M24 44V10" />
          <path d="M24 10C21 6 24 3 24 3C24 3 27 6 24 10Z" />
          <path d="M24 20C17 20 15 14 15 14C22 14 24 20 24 20Z" />
          <path d="M24 20C31 20 33 14 33 14C26 14 24 20 24 20Z" />
          <path d="M24 30C17 30 15 24 15 24C22 24 24 30 24 30Z" />
          <path d="M24 30C31 30 33 24 33 24C26 24 24 30 24 30Z" />
          <path d="M24 40C17 40 15 34 15 34C22 34 24 40 24 40Z" />
          <path d="M24 40C31 40 33 34 33 34C26 34 24 40 24 40Z" />
        </>
      );
  }
}

export default function MenuBackdrop() {
  return (
    <div className="menu-bg" aria-hidden="true">
      {ITEMS.map((item, i) => (
        <span
          key={i}
          className={item.gold ? "menu-bg-item is-gold" : "menu-bg-item"}
          style={
            {
              "--x": `${item.x}%`,
              "--y": `${10 + ((i * 17) % 75)}%`,
              "--size": `${item.size}px`,
              "--dur": `${item.dur}s`,
              "--delay": `${item.delay}s`,
              "--drift": `${item.drift}px`,
            } as CSSProperties
          }
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
          >
            <Shape kind={item.kind} />
          </svg>
        </span>
      ))}
    </div>
  );
}
