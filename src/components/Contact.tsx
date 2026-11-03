import { useState, type ChangeEvent, type FormEvent } from "react";
import { ContactError, sendContact } from "../api/contact";
import { contactInfo } from "../data";
import Icon from "./Icon";

type Status = "idle" | "sending" | "sent" | "error" | "limited";

const empty = { name: "", email: "", message: "", website: "" };

export default function Contact() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState<Status>("idle");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await sendContact(form);
      setForm(empty);
      setStatus("sent");
    } catch (err) {
      setStatus(
        err instanceof ContactError && err.status === 429 ? "limited" : "error",
      );
    }
  };

  return (
    <section className="contact-section" id="contact">
      <h2 className="section-title">Contact Us</h2>
      <div className="section-content">
        <ul className="contact-info-list">
          {contactInfo.map((info) => (
            <li className="contact-info" key={info.id}>
              <Icon icon={info.icon} />
              <p>{info.text}</p>
            </li>
          ))}
        </ul>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            aria-label="Your name"
            autoComplete="name"
            className="form-input"
            value={form.name}
            onChange={handleChange}
            maxLength={100}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            aria-label="Your email"
            autoComplete="email"
            className="form-input"
            value={form.email}
            onChange={handleChange}
            maxLength={254}
            required
          />
          <textarea
            name="message"
            placeholder="Your message"
            aria-label="Your message"
            className="form-input"
            value={form.message}
            onChange={handleChange}
            maxLength={2000}
            required
          />
          <div className="contact-hp" aria-hidden="true">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={handleChange}
            />
          </div>
          <button
            className="submit-button"
            type="submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending…" : "Submit"}
          </button>
          {status === "sent" && (
            <p role="status" className="contact-status">
              Thank you! Your message was sent. We'll get back to you soon.
            </p>
          )}
          {(status === "error" || status === "limited") && (
            <p role="alert" className="contact-status contact-status--error">
              {status === "limited"
                ? "You've sent a lot of messages. Please try again later."
                : "Sorry, we couldn't send your message. Please try again."}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
