import { Link } from "react-router-dom";
import heroImg from "../assets/images/hero.webp";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="section-content">
        <div className="hero-details">
          <h1 className="title">Best Coffee</h1>
          <p className="subtitle">
            Make your day great with our special coffee!
          </p>
          <p className="description">
            Welcome to our coffee paradise, where every bean tells a story and
            every cup sparks joy.
          </p>
          <div className="buttons">
            <Link to="/menu" className="button order-now">
              View Menu
            </Link>
            <a href="#contact" className="button contact-us">
              Contact Us
            </a>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <img
            src={heroImg}
            alt="Traditional Ethiopian jebena coffee pot beside a painted cup with a splash of coffee, surrounded by coffee beans and spices"
            className="hero-image"
          />
        </div>
      </div>
    </section>
  );
}
