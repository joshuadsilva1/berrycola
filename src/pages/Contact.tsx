import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, AtSign } from "lucide-react";
import Reveal from "../components/Reveal";
import { submitContact } from "../lib/api";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFormError(null);
    try {
      await submitContact(form);
      setSent(true);
    } catch {
      setFormError("Something went wrong sending your message — please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-40 pb-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-4">Get in Touch</p>
          <h1 className="font-display text-4xl sm:text-5xl text-espresso">We'd love to hear from you</h1>
          <p className="text-espresso/60 mt-4 max-w-lg mx-auto">
            Questions about an order, a collab idea, or just want to say hi —
            drop us a line.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-5 gap-12">
          <Reveal className="md:col-span-2 flex flex-col gap-8">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-[#f7f0ec] flex items-center justify-center shrink-0">
                <Mail size={18} className="text-cola-red" />
              </div>
              <div>
                <h3 className="font-display text-espresso">Email</h3>
                <p className="text-espresso/60 text-sm mt-1">hello@berrycola.shop</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-[#f7f0ec] flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-cola-red" />
              </div>
              <div>
                <h3 className="font-display text-espresso">Studio</h3>
                <p className="text-espresso/60 text-sm mt-1">Mumbai, India</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-full bg-[#f7f0ec] flex items-center justify-center shrink-0">
                <AtSign size={18} className="text-cola-red" />
              </div>
              <div>
                <h3 className="font-display text-espresso">Instagram</h3>
                <p className="text-espresso/60 text-sm mt-1">@berrycola.shop</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="md:col-span-3">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl bg-[#f7f0ec] p-10 text-center"
              >
                <h3 className="font-display text-2xl text-espresso mb-2">Message sent!</h3>
                <p className="text-espresso/60">We'll get back to you within 1–2 business days.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <input
                    required
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="border border-espresso/15 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-cola-red bg-cream"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="border border-espresso/15 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-cola-red bg-cream"
                  />
                </div>
                <input
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="border border-espresso/15 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-cola-red bg-cream"
                />
                <textarea
                  required
                  rows={5}
                  placeholder="Your message"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="border border-espresso/15 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-cola-red bg-cream resize-none"
                />
                {formError && <p className="text-cola-red text-sm">{formError}</p>}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={sending}
                  className="self-start bg-espresso text-cream px-8 py-3.5 rounded-full font-semibold tracking-wide hover:bg-cola-red transition-colors disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send Message"}
                </motion.button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
