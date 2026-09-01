"use client";

import { FormEvent, useState } from "react";
import { trackProductEvent } from "@/lib/analytics";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        pain: data.get("message"),
        provider: "other",
        source: "direct",
      }),
    });
    if (!response.ok) { setState("error"); return; }
    form.reset();
    setState("sent");
    trackProductEvent("contact_submitted", { outcome: "success", surface: "public_docs" });
  }

  return <form className="contact-form" onSubmit={submit}>
    <label><span>Name</span><input name="name" autoComplete="name" required /></label>
    <label><span>Work email</span><input name="email" type="email" autoComplete="email" required /></label>
    <label><span>What do you need to meter or bill?</span><textarea name="message" rows={6} maxLength={500} required /></label>
    <footer>
      <p role="status">{state === "sent" ? "Message received. We will reply by email." : state === "error" ? "The message was not saved. Try again." : "Private beta questions and onboarding requests are welcome."}</p>
      <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending" : "Send message"}</button>
    </footer>
  </form>;
}
