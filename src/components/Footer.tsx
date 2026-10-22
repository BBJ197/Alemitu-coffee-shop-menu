import Icon from "./Icon";
import { socialLinks } from "../data";

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="section-content">
        <p className="copyright-text">&copy; 2024 Coffee Shop</p>

        <div className="social-link-list">
          {socialLinks.map((s) => (
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

        <p className="policy-text">
          <a href="#" className="policy-link">
            Privacy policy
          </a>
          <span className="separator">.</span>
          <a href="#" className="policy-link">
            Refund policy
          </a>
        </p>
      </div>
    </footer>
  );
}
