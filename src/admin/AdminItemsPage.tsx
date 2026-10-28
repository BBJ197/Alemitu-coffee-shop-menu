import { useEffect, useRef, useState } from "react";
import { formatEtb } from "../lib/format";
import { useExpireOnUnauthorized } from "./hooks";
import {
  useAdminCategories,
  useAdminItems,
  useDeleteItem,
  useToggleAvailability,
} from "./itemsHooks";
import type { AdminItem } from "./itemsApi";

const hhmm = (time: string) => time.slice(0, 5);

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
          {item.availableFrom && item.availableTo && (
            <span className="admin-chip">
              {`Served ${hhmm(item.availableFrom)}–${hhmm(item.availableTo)}`}
            </span>
          )}
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

  const byCategory = new Map<string, AdminItem[]>();
  for (const item of items.data) {
    const list = byCategory.get(item.categoryId) ?? [];
    list.push(item);
    byCategory.set(item.categoryId, list);
  }

  return (
    <>
      <h1>Menu items</h1>
      {items.data.length === 0 ? (
        <p>There are no menu items yet.</p>
      ) : (
        <p>Customers see changes within about 30 seconds.</p>
      )}
      {items.data.length > 0 &&
        categories.data.map((category) => {
          const list = byCategory.get(category.id) ?? [];
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
