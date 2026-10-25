import { useState } from "react";
import { Link } from "react-router-dom";
import { useMenu } from "../api/useMenu";
import {
  emptyFilters,
  filterItems,
  hasActiveFilters,
  type MenuFilters,
} from "../lib/filterMenu";
import { formatEtb } from "../lib/format";
import { pickOptional, pickText } from "../lib/language";
import { useLanguage } from "../lib/useLanguage";

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
  const [filters, setFilters] = useState<MenuFilters>(emptyFilters);
  const { lang, setLang } = useLanguage();

  const visible = data ? filterItems(data, filters) : [];
  const active = hasActiveFilters(filters);

  const toggleTag = (slug: string) =>
    setFilters((f) => ({
      ...f,
      tagSlugs: f.tagSlugs.includes(slug)
        ? f.tagSlugs.filter((s) => s !== slug)
        : [...f.tagSlugs, slug],
    }));

  return (
    <main id="main" className="menu-page">
      <div className="menu-page-header">
        <Link to="/">Back to home</Link>
        <h1>Menu</h1>
        <div className="menu-lang" role="group" aria-label="Language">
          <button
            type="button"
            className="menu-chip"
            lang="en"
            aria-label="English"
            aria-pressed={lang === "en"}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            className="menu-chip"
            lang="am"
            aria-label="Amharic"
            aria-pressed={lang === "am"}
            onClick={() => setLang("am")}
          >
            {"\u12A0\u121B"}
          </button>
        </div>
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
            className="menu-button"
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

      {data && data.items.length > 0 && (
        <>
          <div className="menu-filters">
            <label htmlFor="menu-search" className="menu-search-label">
              Search the menu
            </label>
            <input
              id="menu-search"
              type="search"
              className="menu-search"
              placeholder="Search by name, description or category"
              value={filters.query}
              onChange={(e) =>
                setFilters((f) => ({ ...f, query: e.target.value }))
              }
            />

            <div className="menu-chip-row" role="group" aria-label="Categories">
              <button
                type="button"
                className="menu-chip"
                aria-pressed={filters.categoryId === null}
                onClick={() => setFilters((f) => ({ ...f, categoryId: null }))}
              >
                All
              </button>
              {data.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="menu-chip"
                  aria-pressed={filters.categoryId === category.id}
                  onClick={() =>
                    setFilters((f) => ({ ...f, categoryId: category.id }))
                  }
                >
                  {pickText(category.nameEn, category.nameAm, lang)}
                </button>
              ))}
            </div>

            <div
              className="menu-chip-row"
              role="group"
              aria-label="Dietary and temperature filters"
            >
              {data.tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="menu-chip"
                  aria-pressed={filters.tagSlugs.includes(tag.slug)}
                  onClick={() => toggleTag(tag.slug)}
                >
                  {pickText(tag.nameEn, tag.nameAm, lang)}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-summary">
            <p role="status">
              {visible.length} {visible.length === 1 ? "item" : "items"}
            </p>
            {active && (
              <button
                type="button"
                className="menu-button"
                onClick={() => setFilters(emptyFilters)}
              >
                Clear filters
              </button>
            )}
          </div>

          {visible.length === 0 && (
            <p className="menu-empty">
              No items match. Try different words or clear the filters.
            </p>
          )}

          {data.categories.map((category) => {
            const items = visible.filter(
              (item) => item.categoryId === category.id,
            );
            if (items.length === 0) return null;
            const categoryName = pickText(
              category.nameEn,
              category.nameAm,
              lang,
            );
            return (
              <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                <h2 id={`cat-${category.id}`}>{categoryName}</h2>
                <ul className="menu-list">
                  {items.map((item) => {
                    const description = pickOptional(
                      item.descriptionEn,
                      item.descriptionAm,
                      lang,
                    );
                    return (
                      <li
                        key={item.id}
                        className={
                          item.isAvailable
                            ? "menu-card"
                            : "menu-card is-unavailable"
                        }
                      >
                        <div>
                          <h3>{pickText(item.nameEn, item.nameAm, lang)}</h3>
                          {description && <p>{description}</p>}
                          {!item.isAvailable && (
                            <p className="menu-unavailable">Unavailable</p>
                          )}
                        </div>
                        <p className="menu-price">{formatEtb(item.priceEtb)}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
