import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { unsubscribeNewsletter } from "../lib/api";

export default function NewsletterUnsubscribe() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Unsubscribing…");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage("This unsubscribe link is invalid.");
      return;
    }
    unsubscribeNewsletter(token)
      .then((result) => setMessage(result.message))
      .catch((error) => setMessage(error.message || "Couldn't unsubscribe. Please try again."));
  }, [searchParams]);

  return (
    <main className="min-h-[65vh] flex items-center justify-center px-5 pt-28 pb-16">
      <div className="max-w-lg rounded-3xl border-2 border-[#1e1a18] bg-[#fbf5e9] p-8 text-center shadow-[0_5px_0_#1e1a18]">
        <h1 className="font-display text-3xl text-espresso">Email preferences</h1>
        <p className="mt-3 text-sm text-espresso/70">{message}</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-cola-red px-5 py-2.5 text-sm font-semibold text-cream">Back to BerryCola</Link>
      </div>
    </main>
  );
}
