import { useState } from "react";
import { subscribeNewsletter } from "../lib/api";

export default function NewsletterForm({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await subscribeNewsletter(email);
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <p className={variant === "dark" ? "text-cream/80 text-sm" : "text-espresso/70 text-sm"}>
        You're on the list — watch your inbox.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={
            variant === "dark"
              ? "w-full bg-cream/10 border border-cream/20 rounded-l-full px-4 py-2.5 text-sm placeholder:text-cream/40 focus:outline-none focus:border-cola-red"
              : "flex-1 bg-transparent px-5 py-3 text-espresso placeholder:text-espresso/40 focus:outline-none"
          }
        />
        <button
          disabled={status === "loading"}
          className={
            variant === "dark"
              ? "bg-cola-red px-4 rounded-r-full text-sm font-semibold hover:bg-cola-red-dark transition-colors disabled:opacity-60"
              : "bg-espresso text-cream px-6 py-3 rounded-full font-semibold hover:bg-charcoal transition-colors disabled:opacity-60"
          }
        >
          {status === "loading" ? "…" : variant === "dark" ? "Join" : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-cola-red text-xs mt-2">Something went wrong — try again in a moment.</p>
      )}
    </div>
  );
}
