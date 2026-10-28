import { useEffect, useRef, useState, type FormEvent } from "react";
import { AdminApiError } from "./api";
import { useExpireOnUnauthorized } from "./hooks";
import type { AdminTag, TagGroup } from "./tagsApi";
import {
  useAdminTags,
  useCreateTag,
  useDeleteTag,
  useRenameTag,
  useReorderTags,
} from "./tagsHooks";

const GROUPS: { key: TagGroup; label: string }[] = [
  { key: "fasting", label: "Fasting" },
  { key: "diet", label: "Diet" },
  { key: "temperature", label: "Temperature" },
];

const plural = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

function problem(error: unknown, fallback: string) {
  if (error instanceof AdminApiError) {
    const name = error.fields.nameEn?.[0];
    if (name) return name;
  }
  return fallback;
}

type Mode = "view" | "edit" | "delete";

function TagRow({
  tag,
  groupIds,
  onMessage,
}: {
  tag: AdminTag;
  groupIds: string[];
  onMessage: (text: string) => void;
}) {
  const rename = useRenameTag();
  const reorder = useReorderTags();
  const remove = useDeleteTag();
  const [mode, setMode] = useState<Mode>("view");
  const [nameEn, setNameEn] = useState(tag.nameEn);
  const [nameAm, setNameAm] = useState(tag.nameAm ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const renameRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const previous = useRef<Mode>("view");

  // Keyboard users: move focus into the form or question, and back on cancel.
  useEffect(() => {
    if (mode === "edit") inputRef.current?.focus();
    else if (mode === "delete") cancelRef.current?.focus();
    else if (previous.current === "edit") renameRef.current?.focus();
    else if (previous.current === "delete") deleteRef.current?.focus();
    previous.current = mode;
  }, [mode]);

  const index = groupIds.indexOf(tag.id);
  const busy = rename.isPending || reorder.isPending || remove.isPending;

  function move(delta: -1 | 1) {
    const next = [...groupIds];
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
    rename.mutate(
      { id: tag.id, payload: { nameEn: name, nameAm: nameAm.trim() } },
      {
        onSuccess: () => {
          setMode("view");
          onMessage(`Saved "${name}".`);
        },
      },
    );
  }

  const viewErrors = [
    reorder.isError
      ? problem(reorder.error, "Couldn't change the order. Try again.")
      : null,
  ].filter((text): text is string => text !== null);

  return (
    <li className="admin-item">
      <div>
        <span className="admin-item__name">{tag.nameEn}</span>
        {tag.nameAm && (
          <span lang="am" className="admin-item__am">
            {tag.nameAm}
          </span>
        )}
        <div className="admin-item__facts">
          <span className="admin-chip">{plural(tag.itemCount)}</span>
        </div>
        {viewErrors.map((text) => (
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
              <label htmlFor={`tag-en-${tag.id}`}>Name (English)</label>
              <input
                id={`tag-en-${tag.id}`}
                ref={inputRef}
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={
                  nameError ? `tag-en-err-${tag.id}` : undefined
                }
              />
              {nameError && (
                <p className="admin-field__error" id={`tag-en-err-${tag.id}`}>
                  {nameError}
                </p>
              )}
            </div>
            <div className="admin-field">
              <label htmlFor={`tag-am-${tag.id}`}>Name (Amharic)</label>
              <input
                id={`tag-am-${tag.id}`}
                type="text"
                lang="am"
                value={nameAm}
                onChange={(e) => setNameAm(e.target.value)}
              />
            </div>
            {rename.isError && (
              <p role="alert" className="admin-error">
                {problem(rename.error, "Couldn't save the tag. Try again.")}
              </p>
            )}
            <div className="admin-form__actions">
              <button type="submit" className="admin-button" disabled={busy}>
                {rename.isPending ? "Saving…" : "Save"}
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
          aria-label={`Confirm deleting ${tag.nameEn}`}
          className="admin-confirm"
          onKeyDown={(e) => {
            if (e.key === "Escape") setMode("view");
          }}
        >
          <p>
            {tag.itemCount > 0
              ? `Delete "${tag.nameEn}"? It will be removed from ${plural(tag.itemCount)}. This can't be undone.`
              : `Delete "${tag.nameEn}"? This can't be undone.`}
          </p>
          {remove.isError && (
            <p role="alert" className="admin-error">
              Couldn't delete the tag. Try again.
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
              remove.mutate(tag.id, {
                onSuccess: () => onMessage(`Deleted "${tag.nameEn}".`),
              })
            }
          >
            {remove.isPending ? "Deleting…" : "Delete tag"}
          </button>
        </div>
      ) : mode === "view" ? (
        <div className="admin-item__actions">
          <button
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Move up: ${tag.nameEn}`}
            disabled={index <= 0 || busy}
            onClick={() => move(-1)}
          >
            Move up
          </button>
          <button
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Move down: ${tag.nameEn}`}
            disabled={index === groupIds.length - 1 || busy}
            onClick={() => move(1)}
          >
            Move down
          </button>
          <button
            ref={renameRef}
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Rename: ${tag.nameEn}`}
            onClick={() => {
              setNameEn(tag.nameEn);
              setNameAm(tag.nameAm ?? "");
              setNameError(null);
              rename.reset();
              setMode("edit");
            }}
          >
            Rename
          </button>
          <button
            ref={deleteRef}
            type="button"
            className="admin-button admin-button--quiet"
            aria-label={`Delete: ${tag.nameEn}`}
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

export default function AdminTagsPage() {
  const tags = useAdminTags();
  const create = useCreateTag();
  const [group, setGroup] = useState<TagGroup>("fasting");
  const [nameEn, setNameEn] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useExpireOnUnauthorized(tags.error);

  if (tags.isPending) return <p role="status">Loading tags…</p>;

  if (tags.isError || !tags.data) {
    return (
      <div role="alert" className="admin-error">
        <p>Couldn't load the tags. Check your connection and try again.</p>
        <button
          type="button"
          className="admin-button"
          onClick={() => void tags.refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  const all = tags.data;

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
      { group, nameEn: name, nameAm: nameAm.trim() },
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
        <h1>Tags</h1>
      </div>
      <p>
        Tags label items, for example Fasting or Hot, and customers can filter
        the menu by them. Deleting a tag removes it from every item that has it.
      </p>

      <form className="admin-inline-form" onSubmit={add} noValidate>
        <div className="admin-field">
          <label htmlFor="new-tag-group">Group</label>
          <select
            id="new-tag-group"
            value={group}
            onChange={(e) => setGroup(e.target.value as TagGroup)}
          >
            {GROUPS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="new-tag-en">New tag name (English)</label>
          <input
            id="new-tag-en"
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "new-tag-en-error" : undefined}
          />
          {nameError && (
            <p className="admin-field__error" id="new-tag-en-error">
              {nameError}
            </p>
          )}
        </div>
        <div className="admin-field">
          <label htmlFor="new-tag-am">Amharic name (optional)</label>
          <input
            id="new-tag-am"
            type="text"
            lang="am"
            value={nameAm}
            onChange={(e) => setNameAm(e.target.value)}
          />
        </div>
        {create.isError && (
          <p role="alert" className="admin-error">
            {problem(create.error, "Couldn't add the tag. Try again.")}
          </p>
        )}
        <div className="admin-form__actions">
          <button
            type="submit"
            className="admin-button"
            disabled={create.isPending}
          >
            {create.isPending ? "Adding…" : "Add tag"}
          </button>
        </div>
      </form>

      {message && (
        <p role="status" className="admin-success">
          {message}
        </p>
      )}

      {GROUPS.map(({ key, label }) => {
        const list = all.filter((t) => t.group === key);
        const groupIds = list.map((t) => t.id);
        return (
          <section key={key} aria-labelledby={`tag-group-${key}`}>
            <h2 id={`tag-group-${key}`} className="admin-section-title">
              {label}
            </h2>
            {list.length === 0 ? (
              <p>No tags in this group.</p>
            ) : (
              <ul className="admin-items">
                {list.map((tag) => (
                  <TagRow
                    key={tag.id}
                    tag={tag}
                    groupIds={groupIds}
                    onMessage={setMessage}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
