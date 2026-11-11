import { useEffect, useState } from "react";
import { Copy, Mail, Send } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { fetchMessages, sendNewsletterCampaign, type AdminMessages as Messages } from "../../lib/api";

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "";

export default function AdminMessages() {
  const [data, setData] = useState<Messages | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState<string | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages()
      .then(setData)
      .catch(() => setError("Couldn't load messages."));
  }, []);

  const copyEmails = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.subscribers.map((s) => s.email).join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — nothing else to do.
    }
  };

  const sendCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!window.confirm(`Send this marketing email to all ${data?.subscribersTotal ?? 0} newsletter subscribers?`)) return;
    setSending(true);
    setCampaignError(null);
    setCampaignMessage(null);
    try {
      const result = await sendNewsletterCampaign({ subject, body });
      setCampaignMessage(`Campaign queued for ${result.recipients} subscribers.`);
      setSubject("");
      setBody("");
    } catch (err) {
      setCampaignError((err as Error).message || "Couldn't send the campaign.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-6xl mx-auto">
      <AdminNav />
      {error && <p className="text-cola-red text-sm">{error}</p>}
      {!data && !error && <p className="text-espresso/50 text-sm">Loading…</p>}

      {data && (
        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <h1 className="font-display text-3xl text-espresso mb-6">
              Contact messages <span className="text-espresso/40 text-xl">{data.messages.length}</span>
            </h1>
            <div className="flex flex-col gap-4">
              {data.messages.map((m) => (
                <article key={m.id} className="border border-espresso/10 rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-espresso">{m.subject || "(no subject)"}</p>
                      <p className="text-xs text-espresso/50">
                        {m.name} · {m.email}
                      </p>
                    </div>
                    <span className="text-xs text-espresso/45">{when(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-espresso/80 whitespace-pre-wrap">{m.message}</p>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message to BerryCola"}`)}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-cola-red hover:underline"
                  >
                    <Mail size={13} /> Reply
                  </a>
                </article>
              ))}
              {data.messages.length === 0 && <p className="text-sm text-espresso/45">No messages yet.</p>}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="font-display text-2xl text-espresso">
                Newsletter <span className="text-espresso/40 text-lg">{data.subscribers.length}</span>
              </h2>
              {data.subscribers.length > 0 && (
                <button
                  onClick={copyEmails}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cola-red hover:underline"
                >
                  <Copy size={13} /> {copied ? "Copied!" : "Copy all emails"}
                </button>
              )}
            </div>
            <ul className="border border-espresso/10 rounded-2xl divide-y divide-espresso/8">
              {data.subscribers.map((s) => (
                <li key={s.email} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 break-all whitespace-normal text-espresso/85">{s.email}</span>
                  <span className="text-xs text-espresso/45 shrink-0">{when(s.createdAt)}</span>
                </li>
              ))}
              {data.subscribers.length === 0 && (
                <li className="px-4 py-6 text-sm text-center text-espresso/45">No subscribers yet.</li>
              )}
            </ul>
            <form onSubmit={sendCampaign} className="mt-6 rounded-2xl border border-espresso/10 p-4">
              <h3 className="font-display text-xl text-espresso">Email a campaign</h3>
              <p className="mt-1 text-xs text-espresso/55">
                Sends to all {data.subscribersTotal} newsletter subscribers. Each email includes an unsubscribe link.
              </p>
              <label className="mt-4 block text-xs font-semibold text-espresso">
                Subject
                <input
                  required
                  maxLength={180}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-espresso">
                Message
                <textarea
                  required
                  maxLength={12000}
                  rows={6}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm font-normal"
                />
              </label>
              {campaignError && <p role="alert" className="mt-3 text-xs text-cola-red">{campaignError}</p>}
              {campaignMessage && <p role="status" className="mt-3 text-xs text-emerald-800">{campaignMessage}</p>}
              <button
                type="submit"
                disabled={sending || data.subscribersTotal === 0}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-cola-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream disabled:opacity-50"
              >
                <Send size={13} /> {sending ? "Queueing…" : "Send campaign"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
