import { useState } from "react";
import { Link } from "react-router-dom";
import type { Menu, MenuItem } from "../api/menu";
import { useMenu } from "../api/useMenu";
import MenuIcon from "../components/MenuIcon";
import MobileTabBar from "../components/MobileTabBar";
import {
  emptyFilters,
  filterItems,
  hasActiveFilters,
  type MenuFilters,
} from "../lib/filterMenu";
import { formatEtb } from "../lib/format";
import { iconForCategory, iconForTag } from "../lib/iconNames";
import { pickOptional, pickText, type Lang } from "../lib/language";
import { photoUrl } from "../lib/photoUrl";
import { pickPhoto } from "../lib/photos";
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

function ItemCard({
  item,
  menu,
  lang,
}: {
  item: MenuItem;
  menu: Menu;
  lang: Lang;
}) {
  const description = pickOptional(
    item.descriptionEn,
    item.descriptionAm,
    lang,
  );
  const badges = menu.tags.filter((tag) => item.tagIds.includes(tag.id));
  // The admin's uploaded photo when there is one, else the bundled test photo.
  const photo =
    photoUrl(item.imagePath) ??
    pickPhoto(menu.categories.findIndex((c) => c.id === item.categoryId));
  const classes = [
    "menu-card",
    item.isAvailable ? "" : "is-unavailable",
    photo ? "" : "no-photo",
  ]
    .filter(Boolean)
    .join(" ");
  const price = <p className="menu-price">{formatEtb(item.priceEtb)}</p>;
  return (
    <li className={classes}>
      {photo && (
        <div className="menu-card-media">
          <img
            className="menu-card-photo"
            src={photo}
            alt=""
            width="400"
            height="250"
            loading="lazy"
            decoding="async"
          />
          {price}
        </div>
      )}
      <div className="menu-card-body">
        <h3>{pickText(item.nameEn, item.nameAm, lang)}</h3>
        {description && <p className="menu-card-desc">{description}</p>}
        {badges.length > 0 && (
          <ul className="menu-badges">
            {badges.map((tag) => {
              const icon = iconForTag(tag.slug);
              return (
                <li key={tag.id} className="menu-badge">
                  {icon && <MenuIcon name={icon} size={14} />}
                  {pickText(tag.nameEn, tag.nameAm, lang)}
                </li>
              );
            })}
          </ul>
        )}
        {!item.isAvailable && <p className="menu-unavailable">Unavailable</p>}
        {!photo && price}
      </div>
    </li>
  );
}

export default function MenuPage() {
  const { data, isPending, isError, refetch, isFetching } = useMenu();
  const [filters, setFilters] = useState<MenuFilters>(emptyFilters);
  const { lang, setLang } = useLanguage();

  const visible = data ? filterItems(data, filters) : [];
  const active = hasActiveFilters(filters);
  const popular = active
    ? []
    : visible.filter((item) => item.isFeatured && item.isAvailable);
  const banner = pickPhoto(0);

  const toggleTag = (slug: string) =>
    setFilters((f) => ({
      ...f,
      tagSlugs: f.tagSlugs.includes(slug)
        ? f.tagSlugs.filter((s) => s !== slug)
        : [...f.tagSlugs, slug],
    }));

  return (
    <main id="main" className="menu-page">
      <div className="menu-topbar">
        <div className="menu-topbar-inner">
          <Link to="/" className="menu-brand" aria-label="Alemitu Coffee home">
            <MenuIcon name="cup" size={30} />
            <span>Alemitu Coffee</span>
          </Link>
          <nav className="menu-topnav" aria-label="Main">
            <Link to="/menu" aria-current="page">
              Menu
            </Link>
            <a href="/#about">About</a>
            <a href="/#contact">Contact</a>
          </nav>
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
      </div>

      <section className="menu-banner" aria-labelledby="menu-title">
        <div className="menu-banner-text">
          <p className="menu-eyebrow">
            Traditional taste &bull; Freshly brewed
          </p>
          <h1 id="menu-title">Our Menu</h1>
          <p className="menu-banner-sub">
            Authentic Ethiopian flavors, crafted with love.
          </p>
        </div>
        {banner && (
          <img
            className="menu-banner-img"
            src={banner}
            alt=""
            width="800"
            height="300"
            decoding="async"
          />
        )}
      </section>

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
            <div className="menu-search-wrap">
              <span className="menu-search-icon">
                <MenuIcon name="search" size={20} />
              </span>
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
            </div>
            <div
              className="menu-chip-row"
              role="group"
              aria-label="Dietary and temperature filters"
            >
              <button
                type="button"
                className="menu-chip"
                aria-label="Any diet"
                aria-pressed={filters.tagSlugs.length === 0}
                onClick={() => setFilters((f) => ({ ...f, tagSlugs: [] }))}
              >
                <MenuIcon name="grid" size={16} />
                Any diet
              </button>
              {data.tags.map((tag) => {
                const icon = iconForTag(tag.slug);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className="menu-chip"
                    aria-pressed={filters.tagSlugs.includes(tag.slug)}
                    onClick={() => toggleTag(tag.slug)}
                  >
                    {icon && <MenuIcon name={icon} size={16} />}
                    {pickText(tag.nameEn, tag.nameAm, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="menu-category-bar">
            <div className="menu-chip-row" role="group" aria-label="Categories">
              <button
                type="button"
                className="menu-chip"
                aria-pressed={filters.categoryId === null}
                onClick={() => setFilters((f) => ({ ...f, categoryId: null }))}
              >
                <MenuIcon name="grid" size={16} />
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
                  <MenuIcon name={iconForCategory(category.nameEn)} size={16} />
                  {pickText(category.nameEn, category.nameAm, lang)}
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

          {popular.length > 0 && (
            <section aria-labelledby="popular-heading" className="menu-popular">
              <div className="menu-section-head">
                <MenuIcon name="star" size={28} />
                <div>
                  <h2 id="popular-heading">Popular</h2>
                  <p className="menu-section-sub">Our most loved items</p>
                </div>
              </div>
              <ul className="menu-list">
                {popular.map((item) => (
                  <ItemCard key={item.id} item={item} menu={data} lang={lang} />
                ))}
              </ul>
            </section>
          )}

          {data.categories.map((category) => {
            const items = visible.filter(
              (item) => item.categoryId === category.id,
            );
            if (items.length === 0) return null;
            return (
              <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                <div className="menu-section-head">
                  <MenuIcon name={iconForCategory(category.nameEn)} size={28} />
                  <h2 id={`cat-${category.id}`}>
                    {pickText(category.nameEn, category.nameAm, lang)}
                  </h2>
                </div>
                <ul className="menu-list">
                  {items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      menu={data}
                      lang={lang}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
      <MobileTabBar lang={lang} />
    </main>
  );
}
