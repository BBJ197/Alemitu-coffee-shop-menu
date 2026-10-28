import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { MenuTag } from "../api/menu";
import { useMenu } from "../api/useMenu";
import { useExpireOnUnauthorized } from "./hooks";
import {
  emptyItemForm,
  fromItem,
  serverFieldErrors,
  toPayload,
  validateItemForm,
  type ItemFormValues,
} from "./itemForm";
import type { AdminCategory } from "./itemsApi";
import {
  useAdminCategories,
  useAdminItems,
  useCreateItem,
  useUpdateItem,
} from "./itemsHooks";

const GROUPS = ["fasting", "diet", "temperature"] as const;
const GROUP_LABELS: Record<MenuTag["group"], string> = {
  fasting: "Fasting",
  diet: "Diet",
  temperature: "Temperature",
};

function Field(props: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={props.id}>{props.label}</label>
      {props.children}
      {props.error && (
        <p id={`${props.id}-error`} className="admin-field__error">
          {props.error}
        </p>
      )}
    </div>
  );
}

const aria = (id: string, error?: string) => ({
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : undefined,
});

function ItemForm(props: {
  itemId?: string;
  initial: ItemFormValues;
  categories: AdminCategory[];
  tags?: MenuTag[];
  tagsFailed: boolean;
}) {
  const navigate = useNavigate();
  const create = useCreateItem();
  const update = useUpdateItem();
  const save = props.itemId ? update : create;
  const [values, setValues] = useState(props.initial);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof ItemFormValues>(
    key: K,
    value: ItemFormValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const serverErrors = serverFieldErrors(save.error);
  const errors =
    Object.keys(clientErrors).length > 0 ? clientErrors : serverErrors;
  const hasFieldErrors = Object.keys(errors).length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateItemForm(values);
    setClientErrors(found);
    if (Object.keys(found).length > 0) return;
    const payload = toPayload(values);
    const done = () =>
      navigate("/admin/items", { state: { saved: payload.nameEn.trim() } });
    if (props.itemId)
      update.mutate({ id: props.itemId, payload }, { onSuccess: done });
    else create.mutate(payload, { onSuccess: done });
  }

  return (
    <form className="admin-form admin-form--wide" onSubmit={handleSubmit}>
      <Field id="item-category" label="Category" error={errors.categoryId}>
        <select
          id="item-category"
          value={values.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
          {...aria("item-category", errors.categoryId)}
        >
          <option value="">Choose a category</option>
          {props.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn}
            </option>
          ))}
        </select>
      </Field>

      <div className="admin-row">
        <Field id="item-name-en" label="Name (English)" error={errors.nameEn}>
          <input
            id="item-name-en"
            type="text"
            value={values.nameEn}
            onChange={(e) => set("nameEn", e.target.value)}
            {...aria("item-name-en", errors.nameEn)}
          />
        </Field>
        <Field id="item-name-am" label="Name (Amharic)" error={errors.nameAm}>
          <input
            id="item-name-am"
            type="text"
            lang="am"
            value={values.nameAm}
            onChange={(e) => set("nameAm", e.target.value)}
            {...aria("item-name-am", errors.nameAm)}
          />
        </Field>
      </div>

      <Field
        id="item-desc-en"
        label="Description (English)"
        error={errors.descriptionEn}
      >
        <textarea
          id="item-desc-en"
          rows={3}
          value={values.descriptionEn}
          onChange={(e) => set("descriptionEn", e.target.value)}
          {...aria("item-desc-en", errors.descriptionEn)}
        />
      </Field>
      <Field
        id="item-desc-am"
        label="Description (Amharic)"
        error={errors.descriptionAm}
      >
        <textarea
          id="item-desc-am"
          rows={3}
          lang="am"
          value={values.descriptionAm}
          onChange={(e) => set("descriptionAm", e.target.value)}
          {...aria("item-desc-am", errors.descriptionAm)}
        />
      </Field>

      <Field id="item-price" label="Price (ETB)" error={errors.price}>
        <input
          id="item-price"
          type="text"
          inputMode="decimal"
          value={values.price}
          onChange={(e) => set("price", e.target.value)}
          {...aria("item-price", errors.price)}
        />
      </Field>

      <fieldset className="admin-fieldset">
        <legend>Serving hours</legend>
        <p className="admin-hint">Leave both empty for items served all day.</p>
        <div className="admin-row">
          <Field
            id="item-from"
            label="Served from"
            error={errors.availableFrom}
          >
            <input
              id="item-from"
              type="time"
              value={values.availableFrom}
              onChange={(e) => set("availableFrom", e.target.value)}
              {...aria("item-from", errors.availableFrom)}
            />
          </Field>
          <Field id="item-to" label="Served until" error={errors.availableTo}>
            <input
              id="item-to"
              type="time"
              value={values.availableTo}
              onChange={(e) => set("availableTo", e.target.value)}
              {...aria("item-to", errors.availableTo)}
            />
          </Field>
        </div>
      </fieldset>

      <label className="admin-check">
        <input
          type="checkbox"
          checked={values.isAvailable}
          onChange={(e) => set("isAvailable", e.target.checked)}
        />
        Available to order
      </label>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={values.isFeatured}
          onChange={(e) => set("isFeatured", e.target.checked)}
        />
        Show in Popular
      </label>

      <fieldset className="admin-fieldset">
        <legend>Tags</legend>
        {props.tags ? (
          GROUPS.map((group) => {
            const list = props.tags?.filter((t) => t.group === group) ?? [];
            if (list.length === 0) return null;
            return (
              <div key={group} className="admin-taggroup">
                <span className="admin-taggroup__label">
                  {GROUP_LABELS[group]}
                </span>
                {list.map((tag) => (
                  <label key={tag.id} className="admin-check">
                    <input
                      type="checkbox"
                      checked={values.tagIds.includes(tag.id)}
                      onChange={(e) =>
                        set(
                          "tagIds",
                          e.target.checked
                            ? [...values.tagIds, tag.id]
                            : values.tagIds.filter((id) => id !== tag.id),
                        )
                      }
                    />
                    {tag.nameEn}
                  </label>
                ))}
              </div>
            );
          })
        ) : props.tagsFailed ? (
          <p>Tags couldn't load. The tags this item already has are kept.</p>
        ) : (
          <p role="status">Loading tags…</p>
        )}
      </fieldset>

      {hasFieldErrors && (
        <p role="alert" className="admin-error">
          Fix the highlighted fields, then save again.
        </p>
      )}
      {save.isError && !hasFieldErrors && (
        <p role="alert" className="admin-error">
          Couldn't save the item. Check your connection and try again.
        </p>
      )}

      <div className="admin-form__actions">
        <button
          type="submit"
          className="admin-button"
          disabled={save.isPending}
        >
          {save.isPending
            ? "Saving…"
            : props.itemId
              ? "Save changes"
              : "Add item"}
        </button>
        <Link
          className="admin-button admin-button--quiet admin-button--link"
          to="/admin/items"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export default function AdminItemFormPage() {
  const { id } = useParams();
  const items = useAdminItems();
  const categories = useAdminCategories();
  const menu = useMenu();
  useExpireOnUnauthorized(items.error ?? categories.error);

  if (items.isPending || categories.isPending)
    return <p role="status">Loading…</p>;

  if (items.isError || categories.isError || !items.data || !categories.data) {
    return (
      <div role="alert" className="admin-error">
        <p>Couldn't load the form. Check your connection and try again.</p>
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

  const item = id ? items.data.find((i) => i.id === id) : undefined;
  if (id && !item) {
    return (
      <>
        <h1>Item not found</h1>
        <p>
          It may have been deleted.{" "}
          <Link className="admin-link" to="/admin/items">
            Back to items
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>{id ? "Edit item" : "Add item"}</h1>
      <ItemForm
        key={id ?? "new"}
        itemId={id}
        initial={item ? fromItem(item) : emptyItemForm}
        categories={categories.data}
        tags={menu.data?.tags}
        tagsFailed={menu.isError}
      />
    </>
  );
}
