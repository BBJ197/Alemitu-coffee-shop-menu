import { useEffect } from "react";

const TARGETS = [
  ".about-section .section-content",
  ".testimonials-section .section-content",
  ".contact-section .section-content",
  ".menu-band",
].join(", ");

/** Fades sections in as they scroll into view. Does nothing without IntersectionObserver. */
export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    for (const el of document.querySelectorAll(TARGETS)) {
      el.classList.add("reveal");
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
}
