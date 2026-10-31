import { Link } from "react-router-dom";
import MenuIcon from "./MenuIcon";

export default function Menu() {
  return (
    <section className="menu-section" id="menu">
      <div className="section-content menu-band">
        <span className="menu-band-icon">
          <MenuIcon name="cup" size={56} />
        </span>
        <p className="menu-band-eyebrow">
          Fasting &bull; Non-fasting &bull; Hot &bull; Cold
        </p>
        <h2 className="section-title">Our Menu</h2>
        <p className="menu-teaser-sub">
          Hot and cold drinks, fasting and non-fasting dishes, and desserts.
          Open the full menu to see every item, price and photo.
        </p>
        <Link to="/menu" className="menu-cta-button">
          See the full menu
        </Link>
        <p className="menu-band-note">
          Prices and availability are always up to date.
        </p>
      </div>
    </section>
  );
}
