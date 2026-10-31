import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReveal } from "./useReveal";

function Page() {
  useReveal();
  return (
    <section className="about-section">
      <div className="section-content" data-testid="target" />
    </section>
  );
}

describe("useReveal", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing when IntersectionObserver is missing", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { getByTestId } = render(<Page />);

    expect(getByTestId("target")).not.toHaveClass("reveal");
  });

  it("reveals a section once it scrolls into view", () => {
    let callback: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const { getByTestId } = render(<Page />);
    const el = getByTestId("target");

    expect(el).toHaveClass("reveal");
    callback(
      [
        {
          isIntersecting: true,
          target: el,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(el).toHaveClass("is-visible");
  });
});
