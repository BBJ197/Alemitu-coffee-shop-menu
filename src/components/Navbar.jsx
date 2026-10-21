import { useState, useEffect, useRef } from "react";
import logo from "../assets/images/Alemiti-Coffee-Emblem.png";

const links = [
  { label: "Home", href: "#" },
  { label: "About", href: "#about" },
  { label: "Menu", href: "#menu" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const openBtnRef = useRef(null);

  // close menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !openBtnRef.current.contains(e.target)
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
          <h1 className="nav-text">
            <img src={logo} alt="logo" />
            Alemitu
          </h1>
        </a>

        <ul className={`nav-menu ${open ? "active" : ""}`} ref={menuRef}>
          <button
            id="menu-close-button"
            className="fas fa-times"
            onClick={() => setOpen(false)}
          ></button>

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
          className="fas fa-bars"
          ref={openBtnRef}
          onClick={() => setOpen(true)}
        ></button>
      </nav>
    </header>
  );
}
