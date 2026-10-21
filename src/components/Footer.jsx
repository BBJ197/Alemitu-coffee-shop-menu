const socials = ["fa-facebook", "fa-instagram", "fa-x-twitter"];

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="section-content">
        <p className="copyright-text">© 2024 Coffee Shop</p>

        <div className="social-link-list">
          {socials.map((icon) => (
            <a href="#" className="social-link" key={icon}>
              <i className={`fa-brands ${icon}`}></i>
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
