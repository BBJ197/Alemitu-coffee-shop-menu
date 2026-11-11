import { useState } from "react";
import { useExpireOnUnauthorized } from "../hooks";
import {
  useDeleteMessage,
  useMessages,
  useSetMessageRead,
} from "./messagesHooks";

export default function AdminMessagesPage() {
  const messages = useMessages();
  const setRead = useSetMessageRead();
  const remove = useDeleteMessage();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  useExpireOnUnauthorized(messages.error);

  const unread = messages.data?.filter((m) => !m.isRead).length ?? 0;

  return (
    <>
      <h1>Messages</h1>
      <p>
        Messages sent from the Contact Us form on your website.
        {messages.data && ` ${unread} unread.`}
      </p>

      {messages.isPending && <p role="status">Loading messages…</p>}

      {messages.isError && (
        <div role="alert" className="admin-error">
          <p>Couldn't load messages. Check your connection and try again.</p>
          <button
            type="button"
            className="admin-button"
            onClick={() => void messages.refetch()}
          >
            Try again
          </button>
        </div>
      )}

      {(setRead.isError || remove.isError) && (
        <p role="alert" className="admin-error">
          That didn't work. Please try again.
        </p>
      )}

      {messages.data?.length === 0 && <p>No messages yet.</p>}

      <ul className="admin-messages">
        {messages.data?.map((m) => (
          <li
            key={m.id}
            className={`admin-message${m.isRead ? "" : " admin-message--unread"}`}
          >
            <p className="admin-message-head">
              <strong>{m.name}</strong>{" "}
              <a className="admin-link" href={`mailto:${m.email}`}>
                {m.email}
              </a>{" "}
              <time dateTime={m.createdAt}>
                {new Date(m.createdAt).toLocaleString()}
              </time>
            </p>
            <p className="admin-message-body">{m.message}</p>
            <div className="admin-row">
              <a
                className="admin-button"
                href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Alemitu Coffee")}`}
              >
                Reply
              </a>
              <button
                type="button"
                className="admin-button admin-button--quiet"
                disabled={setRead.isPending}
                onClick={() => setRead.mutate({ id: m.id, isRead: !m.isRead })}
              >
                {m.isRead ? "Mark as unread" : "Mark as read"}
              </button>
              {confirmId === m.id ? (
                <>
                  <button
                    type="button"
                    className="admin-button admin-button--danger"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(m.id, {
                        onSuccess: () => setConfirmId(null),
                      })
                    }
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    className="admin-button admin-button--quiet"
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="admin-button admin-button--quiet"
                  onClick={() => setConfirmId(m.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
