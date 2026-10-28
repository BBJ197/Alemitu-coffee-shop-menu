import { useState, type FormEvent } from "react";
import { useChangePassword } from "./hooks";
import { passwordErrorMessage, validateNewPassword } from "./passwordForm";

function PasswordField(props: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        type="password"
        autoComplete={props.autoComplete}
        required
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDone(false);
    const invalid = validateNewPassword(current, next, confirm);
    setProblem(invalid);
    if (invalid) return;
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setConfirm("");
          setDone(true);
        },
      },
    );
  }

  const message =
    problem ?? (change.isError ? passwordErrorMessage(change.error) : null);

  return (
    <>
      <h1>Account</h1>
      <p>
        Change your password. Every other device you are signed in on will be
        signed out.
      </p>
      <form className="admin-form" onSubmit={handleSubmit}>
        <PasswordField
          id="current-password"
          label="Current password"
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
        />
        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          value={next}
          onChange={setNext}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
        />
        {message && (
          <p role="alert" className="admin-error">
            {message}
          </p>
        )}
        <div role="status">
          {done && (
            <p className="admin-success">
              Password changed. Other devices have been signed out.
            </p>
          )}
        </div>
        <button
          type="submit"
          className="admin-button"
          disabled={change.isPending}
        >
          {change.isPending ? "Saving…" : "Change password"}
        </button>
      </form>
    </>
  );
}
