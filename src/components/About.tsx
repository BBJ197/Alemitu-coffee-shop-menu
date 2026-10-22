import aboutImg from "../assets/images/About-us.webp";

const socials = ["fa-facebook", "fa-instagram", "fa-x-twitter"];

export default function About() {
  return (
    <section className="about-section" id="about">
      <div className="section-content">
        <div className="about-image-wrapper">
          <img src={aboutImg} alt="About" className="about-image" />
        </div>
        <div className="about-ditails">
          <h2 className="section-title">About Us</h2>
          <p className="text">
            At Coffee House in Berndorf, Germany, we pride ourselves on being a
            go-to destination for coffee lovers and conversation seekers alike.
            We're dedicated to providing an exceptional coffee experience in a
            cozy and inviting atmosphere, where guests can relax, unwind, and
            enjoy their time in comfort.
          </p>
          <div className="social-link-list">
            {socials.map((icon) => (
              <a href="#" className="social-link" key={icon}>
                <i className={`fa-brands ${icon}`}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
