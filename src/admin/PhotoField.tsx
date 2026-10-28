import { useState, type ChangeEvent } from "react";
import { ImageError, validateImageFile } from "../lib/imageResize";
import { photoUrl } from "../lib/photoUrl";
import { AdminApiError } from "./api";
import { useUploadImage } from "./imagesHooks";

function messageFor(error: unknown): string {
  if (error instanceof ImageError) {
    if (error.code === "unreadable")
      return "That file couldn't be read as a photo. Try another one.";
    if (error.code === "unsupported")
      return "This browser can't convert photos. Try Chrome, Edge or Firefox.";
    return "That photo is too detailed to shrink. Try a simpler one.";
  }
  if (error instanceof AdminApiError && error.status === 413)
    return "That photo is still too large after shrinking. Try another one.";
  return "Couldn't upload the photo. Check your connection and try again.";
}

export default function PhotoField(props: {
  path: string | null;
  itemName: string;
  onChange: (path: string | null) => void;
}) {
  const upload = useUploadImage();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const url = photoUrl(props.path);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = ""; // lets the same file be chosen again
    if (!file) return;
    setNote(null);
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    upload.mutate(file, {
      onSuccess: (path) => {
        props.onChange(path);
        setNote("Photo ready. Save the item to keep it.");
      },
      onError: (err) => setError(messageFor(err)),
    });
  }

  return (
    <div className="admin-field">
      <label htmlFor="item-photo">Photo</label>
      {url && (
        <img
          className="admin-photo-preview"
          src={url}
          alt={`Photo of ${props.itemName.trim() || "this item"}`}
          width="160"
          height="100"
        />
      )}
      <input
        id="item-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={choose}
        disabled={upload.isPending}
        aria-describedby="item-photo-hint"
      />
      <p id="item-photo-hint" className="admin-hint">
        {props.path ? "Choose a new file to replace the photo. " : "Optional. "}
        JPEG, PNG or WebP. It is resized and converted automatically.
      </p>
      {upload.isPending && <p role="status">Preparing and uploading photo…</p>}
      {note && !upload.isPending && (
        <p role="status" className="admin-success">
          {note}
        </p>
      )}
      {error && (
        <p role="alert" className="admin-field__error">
          {error}
        </p>
      )}
      {props.path && (
        <div>
          <button
            type="button"
            className="admin-button admin-button--quiet"
            onClick={() => {
              props.onChange(null);
              setError(null);
              setNote("Photo removed. Save the item to apply.");
            }}
            disabled={upload.isPending}
          >
            Remove photo
          </button>
        </div>
      )}
    </div>
  );
}
