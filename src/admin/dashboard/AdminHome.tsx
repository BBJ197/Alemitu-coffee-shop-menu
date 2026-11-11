import { Link } from "react-router-dom";
import { summarize } from "./dashboardSummary";
import { useExpireOnUnauthorized } from "../hooks";
import { useAdminCategories, useAdminItems } from "../items/itemsHooks";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

function Summary() {
  const items = useAdminItems();
  const categories = useAdminCategories();
  useExpireOnUnauthorized(items.error);
  useExpireOnUnauthorized(categories.error);

  if (items.isPending || categories.isPending)
    return <p role="status">Loading your menu summary…</p>;

  if (items.isError || categories.isError || !items.data || !categories.data) {
    return (
      <div role="alert" className="admin-error">
        <p>Couldn't load the summary. Check your connection and try again.</p>
        <button
          type="button"
          className="admin-button"
          onClick={() => {
            void items.refetch();
            void categories.refetch();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const s = summarize(items.data, categories.data);
  const stats: [string, number, string][] = [
    ["Items", s.items, "brand"],
    ["Available", s.available, "ok"],
    ["Unavailable", s.unavailable, "bad"],
    ["Popular", s.popular, "gold"],
    ["Without a photo", s.withoutPhoto, "muted"],
    ["Categories", s.categories, "brand"],
    ["Hidden categories", s.hiddenCategories, "muted"],
  ];
  const nothingToFix = s.unavailable === 0 && s.itemsInHiddenCategories === 0;
  const pct = s.items ? Math.round((s.available / s.items) * 100) : 0;

  return (
    <>
      <dl className="admin-stats">
        {stats.map(([label, value, tone]) => (
          <div key={label} className={`admin-stat admin-stat--${tone}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3 className="admin-panel__title">Menu availability</h3>
          <span className="admin-panel__value">{pct}%</span>
        </div>
        <div
          className="admin-meter"
          role="img"
          aria-label={`${pct}% of items are available`}
        >
          <div className="admin-meter__bar" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <h3 className="admin-section-title">Needs attention</h3>
      {nothingToFix && (
        <div className="admin-alert admin-alert--ok">
          <p>Nothing needs attention right now.</p>
        </div>
      )}
      {s.itemsInHiddenCategories > 0 && (
        <div className="admin-alert admin-alert--warn">
          <p>
            {`${plural(s.itemsInHiddenCategories, "item is", "items are")} in a hidden category, so customers can't see ${s.itemsInHiddenCategories === 1 ? "it" : "them"}. `}
            <Link className="admin-link" to="/admin/categories">
              Review categories
            </Link>
          </p>
        </div>
      )}
      {s.unavailable > 0 && (
        <div className="admin-alert admin-alert--warn">
          <div>
            <p>
              {`${plural(s.unavailable, "item is", "items are")} marked unavailable. Customers see ${s.unavailable === 1 ? "it" : "them"} dimmed.`}
            </p>
            <ul className="admin-linklist">
              {s.unavailableItems.map((item) => (
                <li key={item.id}>
                  <Link
                    className="admin-link"
                    to={`/admin/items/${item.id}/edit`}
                  >
                    {item.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminHome() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      <section className="admin-hero">
        <span className="admin-hero__date">{today}</span>
        <h1>Dashboard</h1>
        <p>Here's your menu at a glance.</p>
        <div className="admin-actions">
          <Link
            className="admin-action admin-action--primary"
            to="/admin/items/new"
          >
            Add an item
          </Link>
          <Link className="admin-action" to="/admin/items">
            Manage menu items
          </Link>
          <Link className="admin-action" to="/admin/qr">
            Print the QR code
          </Link>
        </div>
      </section>
      <h2 className="admin-section-title">Menu at a glance</h2>
      <Summary />
    </>
  );
}
