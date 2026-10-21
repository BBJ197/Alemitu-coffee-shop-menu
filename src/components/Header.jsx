import React, { useState } from "react";
import AlemitiCoffeeEmblem from "./assets/Alemiti-Coffee-Emblem.png";

const [menuOpen, setMenuOpen] = useState(false);

const Header = () => {
  return (
    <div>
      <nav className="nav-bar section-content">
        <a href="#" className="nv-logo">
          <h1 className="nav-text">
            <img src={AlemitiCoffeeEmblem} alt="Alemitu Coffee Logo" />
            Alemitu
          </h1>
        </a>

        <ul className={`nav-menu ${menuOpen ? "active" : ""}`}>
          <button
            id="menu-open-button"
            className="fas fa-bars"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          ></button>

          <li className="nav-item">
            <a href="#" className="nav-link" onClick={() => setMenuOpen(false)}>
              Home
            </a>
          </li>

          <li className="nav-item">
            <a
              href="#about"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              About
            </a>
          </li>

          <li className="nav-item">
            <a
              href="#menu"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Menu
            </a>
          </li>

          <li className="nav-item">
            <a
              href="#testimonials"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Testimonials
            </a>
          </li>

          <li className="nav-item">
            <a
              href="#contact"
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
          </li>
        </ul>

        <button
          id="menu-close-button"
          className="fas fa-times"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        ></button>
      </nav>
    </div>
  );
};

export default Header;
