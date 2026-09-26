"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ConfirmEmailPage() {
  const [message, setMessage] = useState("Confirming your email…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const values = new URLSearchParams(window.location.hash.slice(1));
    const errorDescription = values.get("error_description");
    const accessToken = values.get("access_token");
    const refreshToken = values.get("refresh_token");
    if (errorDescription || !accessToken || !refreshToken) {
      setFailed(true);
      setMessage(
        errorDescription?.replace(/\+/g, " ") ||
          "This confirmation link is incomplete or has expired.",
      );
      return;
    }
    fetch("/api/auth/confirm", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Confirmation failed");
        window.history.replaceState(null, "", window.location.pathname);
        setMessage("Your email is confirmed. Let’s begin your Life Map.");
        window.setTimeout(() => window.location.replace("/room/profile"), 900);
      })
      .catch((error) => {
        setFailed(true);
        setMessage(error.message);
      });
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-lg md:p-12">
        <p className="font-serif text-4xl text-primary">Mori</p>
        <h1 className="mt-8 text-3xl font-semibold text-text">
          {failed ? "We couldn’t confirm that link" : "Email confirmation"}
        </h1>
        <p role="status" className="mt-4 text-lg leading-relaxed text-text/70">
          {message}
        </p>
        {failed && (
          <Link
            href="/auth"
            className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 font-semibold text-white"
          >
            Return to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
