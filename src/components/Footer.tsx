import Icon from "./Icon";
import { socialLinks } from "../data";
const currentYear = new Date().getFullYear();

export default function Footer() {
  const links = socialLinks.filter((s) => s.href);

  return (
    <footer className="footer-section">
      <div className="section-content">
        <p className="copyright-text">
          &copy; {currentYear} Alemitu Coffee. All rights reserved.
        </p>

        <div className="social-link-list">
          {links.map((s) => (
            <a
              href={s.href}
              className="social-link"
              aria-label={s.label}
              key={s.id}
            >
              <Icon icon={s.icon} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
