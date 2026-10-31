import { Link } from "react-router-dom";
import { menuItems } from "../data";

export default function Menu() {
  return (
    <section className="menu-section" id="menu">
      <h2 className="section-title">Our Menu</h2>
      <p className="menu-teaser-sub">
        Hot and cold drinks, fasting and non-fasting dishes, and desserts. Open
        the full menu to see every item, price and photo.
      </p>
      <div className="section-content">
        <ul className="menu-list">
          {menuItems.map((item) => (
            <li className="menu-item" key={item.id}>
              <Link to="/menu" className="menu-teaser-card">
                <img src={item.image} alt="" className="menu-image" />
                <h3 className="name">{item.name}</h3>
                <p className="text">{item.text}</p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="menu-cta">
          <Link to="/menu" className="menu-cta-button">
            See the full menu
          </Link>
        </div>
      </div>
    </section>
  );
}
