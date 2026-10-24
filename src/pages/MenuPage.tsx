import { Link } from "react-router-dom";
import { useMenu } from "../api/useMenu";
import { formatEtb } from "../lib/format";

function Skeleton() {
  return (
    <div role="status" aria-label="Loading menu" className="menu-skeleton">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="menu-skeleton-card" aria-hidden="true" />
      ))}
    </div>
  );
}

export default function MenuPage() {
  const { data, isPending, isError, refetch, isFetching } = useMenu();

  return (
    <main id="main" className="menu-page">
      <div className="menu-page-header">
        <Link to="/">Back to home</Link>
        <h1>Menu</h1>
      </div>

      {isPending && <Skeleton />}

      {isError && (
        <div role="alert" className="menu-error">
          <p>
            We could not load the menu. Please check your connection and try
            again.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            Try again
          </button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <p>The menu is empty right now. Please check back soon.</p>
      )}

      {data &&
        data.categories.map((category) => {
          const items = data.items.filter(
            (item) => item.categoryId === category.id,
          );
          if (items.length === 0) return null;
          return (
            <section key={category.id} aria-labelledby={`cat-${category.id}`}>
              <h2 id={`cat-${category.id}`}>{category.nameEn}</h2>
              <ul className="menu-list">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={
                      item.isAvailable
                        ? "menu-card"
                        : "menu-card is-unavailable"
                    }
                  >
                    <div>
                      <h3>{item.nameEn}</h3>
                      {item.descriptionEn && <p>{item.descriptionEn}</p>}
                      {!item.isAvailable && (
                        <p className="menu-unavailable">Unavailable</p>
                      )}
                    </div>
                    <p className="menu-price">{formatEtb(item.priceEtb)}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </main>
  );
}
