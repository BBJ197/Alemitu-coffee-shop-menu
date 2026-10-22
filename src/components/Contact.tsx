import { useState, type ChangeEvent, type FormEvent } from "react";
import { contactInfo } from "../data";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", form); // connect to a backend/email service later
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section className="contact-section" id="contact">
      <h2 className="section-title">Contact Us</h2>
      <div className="section-content">
        <ul className="contact-info-list">
          {contactInfo.map((info) => (
            <li className="contact-info" key={info.id}>
              <i className={info.icon}></i>
              <p>{info.text}</p>
            </li>
          ))}
        </ul>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            className="form-input"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className="form-input"
            value={form.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            placeholder="Your message"
            className="form-input"
            value={form.message}
            onChange={handleChange}
            required
          />
          <button className="submit-button" type="submit">
            Submit
          </button>
        </form>
      </div>
    </section>
  );
}
