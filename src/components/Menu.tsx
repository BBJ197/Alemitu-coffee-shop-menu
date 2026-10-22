import { menuItems } from "../data";

export default function Menu() {
  return (
    <section className="menu-section" id="menu">
      <h2 className="section-title">Our Menu</h2>
      <div className="section-content">
        <ul className="menu-list">
          {menuItems.map((item) => (
            <li className="menu-item" key={item.id}>
              <img src={item.image} alt={item.name} className="menu-image" />
              <h3 className="name">{item.name}</h3>
              <p className="text">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
