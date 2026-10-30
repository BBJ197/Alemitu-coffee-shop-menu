import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { formatEtb } from "../lib/format";
import { useExpireOnUnauthorized } from "./hooks";
import {
  emptyItemFilters,
  filterAdminItems,
  hasItemFilters,
  type ItemFilters,
  type StatusFilter,
} from "./itemFilters";
import {
  useAdminCategories,
  useAdminItems,
  useDeleteItem,
  useToggleAvailability,
} from "./itemsHooks";
import type { AdminItem } from "./itemsApi";

function ItemRow({ item }: { item: AdminItem }) {
  const toggle = useToggleAvailability();
  const remove = useDeleteItem();
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Keyboard users: focus the safe choice when asking, and return focus on cancel.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (wasConfirming.current) deleteRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const toggleText = item.isAvailable ? "Mark unavailable" : "Mark available";

  return (
    <li className="admin-item">
      <div>
        <span className="admin-item__name">{item.nameEn}</span>
        {item.nameAm && (
          <span lang="am" className="admin-item__am">
            {item.nameAm}
          </span>
        )}
        <div className="admin-item__facts">
          <span className="admin-price">{formatEtb(item.priceEtb)}</span>
          <span
            className={`admin-chip ${item.isAvailable ? "admin-chip--on" : "admin-chip--off"}`}
          >
            {item.isAvailable ? "Available" : "Unavailable"}
          </span>
          {item.isFeatured && <span className="admin-chip">Popular</span>}
        </div>
        {toggle.isError && (
          <p role="alert" className="admin-error">
            Couldn't update availability. Try again.
          </p>
        )}
        {remove.isError && (
          <p role="alert" className="admin-error">
            Couldn't delete the item. Try again.
          </p>
        )}
      </div>

      {confirming ? (
        <div
          role="group"
          aria-label={`Confirm deleting ${item.nameEn}`}
          className="admin-confirm"
          onKeyDown={(e) => {
            if (e.key === "Escape") setConfirming(false);
          }}
        >
          <p>{`Delete "${item.nameEn}"? This can't be undone.`}</p>
          <button
            ref={cancelRef}
            type="button"
            className="admin-button admin-button--quiet"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-button admin-button--danger"
            onClick={() => remove.mutate(item.id)}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Deleting…" : "Delete item"}
          </button>
        </div>
      ) : (
        <div className="admin-item__actions">
          <Link
            className="admin-button admin-button--quiet admin-button--link"
            to={`/admin/items/${item.id}/edit`}
            aria-label={`Edit: ${item.nameEn}`}
          >
            Edit
          </Link>
          <button
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`${toggleText}: ${item.nameEn}`}
            onClick={() =>
              toggle.mutate({ id: item.id, isAvailable: !item.isAvailable })
            }
            disabled={toggle.isPending}
          >
            {toggleText}
          </button>
          <button
            ref={deleteRef}
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Delete: ${item.nameEn}`}
            onClick={() => setConfirming(true)}
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default function AdminItemsPage() {
  const items = useAdminItems();
  const categories = useAdminCategories();
  const location = useLocation();
  const [filters, setFilters] = useState<ItemFilters>(emptyItemFilters);
  useExpireOnUnauthorized(items.error ?? categories.error);

  if (items.isPending || categories.isPending)
    return <p role="status">Loading items…</p>;

  if (items.isError || categories.isError || !items.data || !categories.data) {
    return (
      <div role="alert" className="admin-error">
        <p>
          Couldn't load the menu items. Check your connection and try again.
        </p>
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

  const saved = (location.state as { saved?: string } | null)?.saved;
  const active = hasItemFilters(filters);
  const visible = filterAdminItems(items.data, categories.data, filters);
  const byCategory = new Map<string, AdminItem[]>();
  for (const item of visible) {
    const list = byCategory.get(item.categoryId) ?? [];
    list.push(item);
    byCategory.set(item.categoryId, list);
  }
  const total = items.data.length;

  return (
    <>
      <div className="admin-page-head">
        <h1>Menu items</h1>
        <Link className="admin-button admin-button--link" to="/admin/items/new">
          Add item
        </Link>
      </div>

      {saved && (
        <p role="status" className="admin-success">
          {`Saved "${saved}".`}
        </p>
      )}

      {total === 0 ? (
        <p>There are no menu items yet.</p>
      ) : (
        <>
          <p>Customers see changes within about 30 seconds.</p>
          <div className="admin-filters">
            <div className="admin-field">
              <label htmlFor="item-search">Search items</label>
              <input
                id="item-search"
                type="search"
                placeholder="Name, description or category"
                value={filters.query}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, query: e.target.value }))
                }
              />
            </div>
            <div className="admin-field">
              <label htmlFor="item-category">Category</label>
              <select
                id="item-category"
                value={filters.categoryId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, categoryId: e.target.value }))
                }
              >
                <option value="">All categories</option>
                {categories.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="item-status">Show</label>
              <select
                id="item-status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: e.target.value as StatusFilter,
                  }))
                }
              >
                <option value="all">All items</option>
                <option value="available">Only available</option>
                <option value="unavailable">Only unavailable</option>
                <option value="popular">Only popular</option>
              </select>
            </div>
            {active && (
              <button
                type="button"
                className="admin-button admin-button--quiet"
                onClick={() => setFilters(emptyItemFilters)}
              >
                Clear filters
              </button>
            )}
          </div>
          <p role="status">
            {active
              ? `Showing ${visible.length} of ${total} items.`
              : `${total} ${total === 1 ? "item" : "items"}.`}
          </p>
          {visible.length === 0 && <p>No items match your filters.</p>}
        </>
      )}

      {total > 0 &&
        categories.data.map((category) => {
          const list = byCategory.get(category.id) ?? [];
          if (active && list.length === 0) return null;
          return (
            <section key={category.id} aria-labelledby={`cat-${category.id}`}>
              <h2 id={`cat-${category.id}`} className="admin-section-title">
                {category.nameEn}
                {!category.isVisible && (
                  <span className="admin-chip">Hidden from customers</span>
                )}
              </h2>
              {list.length === 0 ? (
                <p>No items in this category.</p>
              ) : (
                <ul className="admin-items">
                  {list.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
    </>
  );
}
