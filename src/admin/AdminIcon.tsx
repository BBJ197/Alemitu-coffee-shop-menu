import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export default function AdminIcon({ icon }: { icon: IconDefinition }) {
  const [w, h, , , path] = icon.icon;
  return (
    <svg
      className="adm-icon"
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d={Array.isArray(path) ? path.join(" ") : path}
      />
    </svg>
  );
}
