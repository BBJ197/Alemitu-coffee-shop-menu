type IconDefinition = {
  icon: readonly [number, number, unknown, unknown, string | string[]];
};

type IconProps = {
  icon: IconDefinition;
  className?: string;
};

export default function Icon({ icon, className }: IconProps) {
  const [width, height, , , pathData] = icon.icon;
  const d = typeof pathData === "string" ? pathData : pathData.join("");
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
