import { useState, useEffect, useRef } from "react";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/images/Alemiti-Coffee-Emblem.png";
import Icon from "./Icon";

const links = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Menu", href: "#menu" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

  // close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !openBtnRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <header>
      <nav className="nav-bar section-content">
        <a href="#" className="nv-logo">
          <span className="nav-text">
            <img src={logo} alt="" />
            Alemitu
          </span>
        </a>

        <ul className={`nav-menu ${open ? "active" : ""}`} ref={menuRef}>
          <li className="nav-close-item">
            <button
              id="menu-close-button"
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <Icon icon={faXmark} />
            </button>
          </li>

          {links.map((link) => (
            <li className="nav-item" key={link.label}>
              <a
                href={link.href}
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          id="menu-open-button"
          type="button"
          aria-label="Open menu"
          ref={openBtnRef}
          onClick={() => setOpen(true)}
        >
          <Icon icon={faBars} />
        </button>
      </nav>
    </header>
  );
}
