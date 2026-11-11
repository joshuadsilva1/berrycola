import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { fetchStorefront, type StorefrontSettings } from "../lib/api";

export default function Policies() {
  const [storefront, setStorefront] = useState<StorefrontSettings | null>(null);

  useEffect(() => {
    fetchStorefront().then(setStorefront).catch(() => setStorefront(null));
  }, []);

  const details = storefront?.productPageDetails;
  const shippingOptions = storefront?.shippingOptions;
  const deliveryRange = [details?.defaultDeliveryMinDays, details?.defaultDeliveryMaxDays]
    .filter((days): days is number => typeof days === "number")
    .join("–");

  return (
    <main className="px-5 pb-24 pt-36 sm:px-8 sm:pt-40">
      <div className="mx-auto max-w-4xl">
        <Reveal className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-cola-red">Help &amp; information</p>
          <h1 className="font-display text-4xl text-espresso sm:text-5xl">Store Policies</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-espresso/65">
            Find BerryCola shipping, returns, and privacy information. Need help with an order? <Link to="/contact" className="font-semibold text-cola-red underline">Contact us</Link>.
          </p>
        </Reveal>

        <div className="space-y-5">
          <section id="shipping" className="scroll-mt-32 rounded-3xl border-2 border-[#1e1a18] bg-[#fbf5e9] p-6 shadow-[0_4px_0_#1e1a18] sm:p-8">
            <h2 className="font-display text-2xl text-espresso">Shipping &amp; delivery</h2>
            {details?.shippingNote ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-espresso/75">{details.shippingNote}</p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-espresso/75">Available shipping methods and the final shipping charge are shown at checkout before you pay.</p>
            )}
            {deliveryRange && <p className="mt-3 text-sm text-espresso/75">Estimated delivery window: {deliveryRange} days.</p>}
            {shippingOptions && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-espresso/75">
                <span className="rounded-full border border-espresso/20 bg-white px-3 py-1.5">Standard: ₹{shippingOptions.standard}</span>
                <span className="rounded-full border border-espresso/20 bg-white px-3 py-1.5">Express: ₹{shippingOptions.express}</span>
                {shippingOptions.freeShippingThreshold > 0 && <span className="rounded-full border border-espresso/20 bg-white px-3 py-1.5">Free standard shipping from ₹{shippingOptions.freeShippingThreshold}</span>}
              </div>
            )}
          </section>

          <section id="returns" className="scroll-mt-32 rounded-3xl border-2 border-[#1e1a18] bg-[#fbf5e9] p-6 shadow-[0_4px_0_#1e1a18] sm:p-8">
            <h2 className="font-display text-2xl text-espresso">Returns</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-espresso/75">
              {details?.returnPolicy?.trim() || "For return questions, please contact BerryCola before sending an item back. We will confirm the applicable policy and next steps for your order."}
            </p>
            {details?.warrantyNote && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-espresso/75">{details.warrantyNote}</p>}
          </section>

          <section id="privacy" className="scroll-mt-32 rounded-3xl border-2 border-[#1e1a18] bg-[#fbf5e9] p-6 shadow-[0_4px_0_#1e1a18] sm:p-8">
            <h2 className="font-display text-2xl text-espresso">Privacy</h2>
            <p className="mt-3 text-sm leading-relaxed text-espresso/75">
              BerryCola uses the contact, account, and order details you provide to manage your account, process and deliver orders, and respond to support requests. For questions about your information or a privacy request, email <a className="font-semibold text-cola-red underline" href="mailto:berrycolastore@gmail.com">berrycolastore@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
