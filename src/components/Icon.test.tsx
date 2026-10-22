import { render } from "@testing-library/react";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { describe, expect, it } from "vitest";
import Icon from "./Icon";

describe("Icon", () => {
  it("renders a decorative inline SVG sized from the icon definition", () => {
    const { container } = render(<Icon icon={faBars} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute(
      "viewBox",
      `0 0 ${faBars.icon[0]} ${faBars.icon[1]}`,
    );
    expect(svg?.querySelector("path")).toHaveAttribute("d");
  });
});
