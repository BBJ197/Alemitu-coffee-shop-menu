import { Link } from "react-router-dom";
import { summarize } from "./dashboardSummary";
import { useExpireOnUnauthorized } from "./hooks";
import { useAdminCategories, useAdminItems } from "./itemsHooks";

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
  const stats: [string, number][] = [
    ["Items", s.items],
    ["Available", s.available],
    ["Unavailable", s.unavailable],
    ["Popular", s.popular],
    ["With a schedule", s.scheduled],
    ["Without a photo", s.withoutPhoto],
    ["Categories", s.categories],
    ["Hidden categories", s.hiddenCategories],
  ];
  const nothingToFix = s.unavailable === 0 && s.itemsInHiddenCategories === 0;

  return (
    <>
      <dl className="admin-stats">
        {stats.map(([label, value]) => (
          <div key={label} className="admin-stat">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="admin-section-title">Needs attention</h3>
      {nothingToFix && <p>Nothing needs attention right now.</p>}
      {s.itemsInHiddenCategories > 0 && (
        <p>
          {`${plural(s.itemsInHiddenCategories, "item is", "items are")} in a hidden category, so customers can't see ${s.itemsInHiddenCategories === 1 ? "it" : "them"}. `}
          <Link className="admin-link" to="/admin/categories">
            Review categories
          </Link>
        </p>
      )}
      {s.unavailable > 0 && (
        <>
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
        </>
      )}
    </>
  );
}

export default function AdminHome() {
  return (
    <>
      <h1>Dashboard</h1>
      <p>Here's your menu at a glance.</p>
      <p className="admin-quicklinks">
        <Link className="admin-link" to="/admin/items/new">
          Add an item
        </Link>
        <Link className="admin-link" to="/admin/items">
          Manage menu items
        </Link>
        <Link className="admin-link" to="/admin/qr">
          Print the QR code
        </Link>
      </p>
      <h2 className="admin-section-title">Menu at a glance</h2>
      <Summary />
    </>
  );
}
