import { useEffect, useRef, useState, type FormEvent } from "react";
import { AdminApiError } from "./api";
import {
  useCreateCategory,
  useDeleteCategory,
  useReorderCategories,
  useUpdateCategory,
} from "./categoriesHooks";
import { useExpireOnUnauthorized } from "./hooks";
import type { AdminCategory } from "./itemsApi";
import { useAdminCategories } from "./itemsHooks";

const IN_USE = "This category still has items. Move or delete them first.";

function problem(error: unknown, fallback: string) {
  if (error instanceof AdminApiError) {
    const name = error.fields.nameEn?.[0];
    if (name) return name;
    if (error.code === "category_in_use") return IN_USE;
  }
  return fallback;
}

type Mode = "view" | "edit" | "delete";

function CategoryRow({
  category,
  ids,
  onMessage,
}: {
  category: AdminCategory;
  ids: string[];
  onMessage: (text: string) => void;
}) {
  const update = useUpdateCategory();
  const reorder = useReorderCategories();
  const remove = useDeleteCategory();
  const [mode, setMode] = useState<Mode>("view");
  const [nameEn, setNameEn] = useState(category.nameEn);
  const [nameAm, setNameAm] = useState(category.nameAm ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const previous = useRef<Mode>("view");

  // Keyboard users: move focus into the form or question, and back on cancel.
  useEffect(() => {
    if (mode === "edit") inputRef.current?.focus();
    else if (mode === "delete") cancelRef.current?.focus();
    else if (previous.current === "edit") editRef.current?.focus();
    else if (previous.current === "delete") deleteRef.current?.focus();
    previous.current = mode;
  }, [mode]);

  const index = ids.indexOf(category.id);
  const count = category.itemCount ?? 0;
  const inUse = count > 0;
  const busy = update.isPending || reorder.isPending || remove.isPending;

  function move(delta: -1 | 1) {
    const next = [...ids];
    const target = index + delta;
    [next[index], next[target]] = [next[target]!, next[index]!];
    reorder.mutate(next);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const name = nameEn.trim();
    if (!name) {
      setNameError("Name is required");
      return;
    }
    setNameError(null);
    update.mutate(
      {
        id: category.id,
        payload: {
          nameEn: name,
          nameAm: nameAm.trim(),
          isVisible: category.isVisible,
        },
      },
      {
        onSuccess: () => {
          setMode("view");
          onMessage(`Saved "${name}".`);
        },
      },
    );
  }

  function toggleVisible() {
    update.mutate(
      {
        id: category.id,
        payload: {
          nameEn: category.nameEn,
          nameAm: category.nameAm ?? "",
          isVisible: !category.isVisible,
        },
      },
      {
        onSuccess: () =>
          onMessage(
            category.isVisible
              ? `"${category.nameEn}" is now hidden from customers.`
              : `"${category.nameEn}" is now shown to customers.`,
          ),
      },
    );
  }

  const errors = [
    update.isError && mode === "view"
      ? problem(update.error, "Couldn't update the category. Try again.")
      : null,
    reorder.isError
      ? problem(reorder.error, "Couldn't change the order. Try again.")
      : null,
    remove.isError && mode !== "delete"
      ? problem(remove.error, "Couldn't delete the category. Try again.")
      : null,
  ].filter((text): text is string => text !== null);

  return (
    <li className="admin-item">
      <div>
        <span className="admin-item__name">{category.nameEn}</span>
        {category.nameAm && (
          <span lang="am" className="admin-item__am">
            {category.nameAm}
          </span>
        )}
        <div className="admin-item__facts">
          <span className="admin-chip">
            {`${count} ${count === 1 ? "item" : "items"}`}
          </span>
          {!category.isVisible && (
            <span className="admin-chip admin-chip--off">
              Hidden from customers
            </span>
          )}
        </div>
        {errors.map((text) => (
          <p key={text} role="alert" className="admin-error">
            {text}
          </p>
        ))}

        {mode === "edit" && (
          <form
            className="admin-inline-form"
            onSubmit={save}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMode("view");
            }}
            noValidate
          >
            <div className="admin-field">
              <label htmlFor={`cat-en-${category.id}`}>Name (English)</label>
              <input
                id={`cat-en-${category.id}`}
                ref={inputRef}
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={
                  nameError ? `cat-en-err-${category.id}` : undefined
                }
              />
              {nameError && (
                <p
                  className="admin-field__error"
                  id={`cat-en-err-${category.id}`}
                >
                  {nameError}
                </p>
              )}
            </div>
            <div className="admin-field">
              <label htmlFor={`cat-am-${category.id}`}>Name (Amharic)</label>
              <input
                id={`cat-am-${category.id}`}
                type="text"
                lang="am"
                value={nameAm}
                onChange={(e) => setNameAm(e.target.value)}
              />
            </div>
            {update.isError && (
              <p role="alert" className="admin-error">
                {problem(
                  update.error,
                  "Couldn't save the category. Try again.",
                )}
              </p>
            )}
            <div className="admin-form__actions">
              <button type="submit" className="admin-button" disabled={busy}>
                {update.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="admin-button admin-button--quiet"
                onClick={() => setMode("view")}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {mode === "delete" ? (
        <div
          role="group"
          aria-label={`Confirm deleting ${category.nameEn}`}
          className="admin-confirm"
          onKeyDown={(e) => {
            if (e.key === "Escape") setMode("view");
          }}
        >
          {inUse || remove.error instanceof AdminApiError ? (
            <>
              <p role="alert">
                {`"${category.nameEn}" can't be deleted yet. ${
                  inUse
                    ? `It still has ${count} ${count === 1 ? "item" : "items"}. Move or delete them first.`
                    : problem(remove.error, "Try again.")
                }`}
              </p>
              <button
                ref={cancelRef}
                type="button"
                className="admin-button admin-button--quiet"
                onClick={() => setMode("view")}
              >
                Close
              </button>
            </>
          ) : (
            <>
              <p>{`Delete "${category.nameEn}"? This can't be undone.`}</p>
              {remove.isError && (
                <p role="alert" className="admin-error">
                  Couldn't delete the category. Try again.
                </p>
              )}
              <button
                ref={cancelRef}
                type="button"
                className="admin-button admin-button--quiet"
                onClick={() => setMode("view")}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-button admin-button--danger"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(category.id, {
                    onSuccess: () => onMessage(`Deleted "${category.nameEn}".`),
                  })
                }
              >
                {remove.isPending ? "Deleting…" : "Delete category"}
              </button>
            </>
          )}
        </div>
      ) : mode === "view" ? (
        <div className="admin-item__actions">
          <button
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Move up: ${category.nameEn}`}
            disabled={index <= 0 || busy}
            onClick={() => move(-1)}
          >
            Move up
          </button>
          <button
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Move down: ${category.nameEn}`}
            disabled={index === ids.length - 1 || busy}
            onClick={() => move(1)}
          >
            Move down
          </button>
          <button
            ref={editRef}
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Rename: ${category.nameEn}`}
            onClick={() => {
              setNameEn(category.nameEn);
              setNameAm(category.nameAm ?? "");
              setNameError(null);
              update.reset();
              setMode("edit");
            }}
          >
            Rename
          </button>
          <button
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`${category.isVisible ? "Hide" : "Show"}: ${category.nameEn}`}
            disabled={busy}
            onClick={toggleVisible}
          >
            {category.isVisible ? "Hide" : "Show"}
          </button>
          <button
            ref={deleteRef}
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Delete: ${category.nameEn}`}
            onClick={() => {
              remove.reset();
              setMode("delete");
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </li>
  );
}

export default function AdminCategoriesPage() {
  const categories = useAdminCategories();
  const create = useCreateCategory();
  const [nameEn, setNameEn] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useExpireOnUnauthorized(categories.error);

  if (categories.isPending) return <p role="status">Loading categories…</p>;

  if (categories.isError || !categories.data) {
    return (
      <div role="alert" className="admin-error">
        <p>
          Couldn't load the categories. Check your connection and try again.
        </p>
        <button
          type="button"
          className="admin-button"
          onClick={() => void categories.refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  const ids = categories.data.map((c) => c.id);

  function add(event: FormEvent) {
    event.preventDefault();
    const name = nameEn.trim();
    setMessage(null);
    if (!name) {
      setNameError("Name is required");
      return;
    }
    setNameError(null);
    create.mutate(
      { nameEn: name, nameAm: nameAm.trim(), isVisible: true },
      {
        onSuccess: () => {
          setNameEn("");
          setNameAm("");
          setMessage(`Added "${name}".`);
        },
      },
    );
  }

  return (
    <>
      <div className="admin-page-head">
        <h1>Categories</h1>
      </div>
      <p>
        Customers see categories in this order. Hidden categories, and the items
        in them, don't appear on the menu.
      </p>

      <form className="admin-inline-form" onSubmit={add} noValidate>
        <div className="admin-field">
          <label htmlFor="new-cat-en">New category name (English)</label>
          <input
            id="new-cat-en"
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "new-cat-en-error" : undefined}
          />
          {nameError && (
            <p className="admin-field__error" id="new-cat-en-error">
              {nameError}
            </p>
          )}
        </div>
        <div className="admin-field">
          <label htmlFor="new-cat-am">Amharic name (optional)</label>
          <input
            id="new-cat-am"
            type="text"
            lang="am"
            value={nameAm}
            onChange={(e) => setNameAm(e.target.value)}
          />
        </div>
        {create.isError && (
          <p role="alert" className="admin-error">
            {problem(create.error, "Couldn't add the category. Try again.")}
          </p>
        )}
        <div className="admin-form__actions">
          <button
            type="submit"
            className="admin-button"
            disabled={create.isPending}
          >
            {create.isPending ? "Adding…" : "Add category"}
          </button>
        </div>
      </form>

      {message && (
        <p role="status" className="admin-success">
          {message}
        </p>
      )}

      {categories.data.length === 0 ? (
        <p>There are no categories yet. Add the first one above.</p>
      ) : (
        <ul className="admin-items">
          {categories.data.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              ids={ids}
              onMessage={setMessage}
            />
          ))}
        </ul>
      )}
    </>
  );
}
