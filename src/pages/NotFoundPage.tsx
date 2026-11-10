import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main id="main" className="not-found">
      <img
        className="not-found-logo"
        src="/Alemiti-Coffee-Emblem.png"
        alt=""
        width={96}
        height={96}
      />
      <h1>Page not found</h1>
      <p>Sorry, we could not find the page you are looking for.</p>
      <div className="not-found-actions">
        <Link className="not-found-link" to="/menu">
          View the menu
        </Link>
        <Link className="not-found-link not-found-link-alt" to="/">
          Back to home
        </Link>
      </div>
    </main>
  );
}
