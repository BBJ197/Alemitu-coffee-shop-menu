import heroImg from "../assets/images/hero.webp";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="section-content">
        <div className="hero-details">
          <h2 className="title">Best Coffee</h2>
          <h3 className="subtitle">
            Make your day great with our special coffee!
          </h3>
          <p className="description">
            Welcome to our coffee paradise, where every bean tells a story and
            every cup sparks joy.
          </p>
          <div className="buttons">
            <a href="#menu" className="button order-now">
              Order Now
            </a>
            <a href="#contact" className="button contact-us">
              Contact Us
            </a>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <img src={heroImg} alt="Hero" className="hero-image" />
        </div>
      </div>
    </section>
  );
}
