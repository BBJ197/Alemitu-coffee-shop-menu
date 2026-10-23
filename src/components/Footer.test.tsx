import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "./Footer";

describe("Footer", () => {
  it("shows the current year and brand name", () => {
    render(<Footer />);

    expect(
      screen.getByText(
        new RegExp(`${new Date().getFullYear()} Alemitu Coffee`),
      ),
    ).toBeInTheDocument();
  });

  it("has no placeholder policy links or dead social links", () => {
    render(<Footer />);

    expect(screen.queryByText(/refund/i)).toBeNull();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
