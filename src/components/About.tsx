import aboutImg from "../assets/images/About-us.webp";
import Icon from "./Icon";
import { socialLinks } from "../data";

export default function About() {
  return (
    <section className="about-section" id="about">
      <div className="section-content">
        <div className="about-image-wrapper">
          <img
            src={aboutImg}
            alt="A woman in traditional white Ethiopian dress with red embroidery roasting coffee over a charcoal stove during a coffee ceremony"
            className="about-image"
          />
        </div>
        <div className="about-ditails">
          <h2 className="section-title">About Us</h2>
          <p className="text">
            Alemitu Coffee is a coffee house in the heart of Addis Ababa, at the
            Jambo Building in Addisu Gebeya. We serve Ethiopian coffee, fasting
            and non-fasting dishes, cold drinks, refreshments and desserts in a
            warm, welcoming space where you can relax, catch up and enjoy every
            cup.
          </p>
          <div className="social-link-list">
            {socialLinks
              .filter((s) => s.href)
              .map((s) => (
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
      </div>
    </section>
  );
}
