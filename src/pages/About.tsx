import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PaperCharm from "../components/PaperCharm";
import Reveal from "../components/Reveal";
import StatCounter from "../components/StatCounter";

const timeline = [
  { year: "2021", title: "One charm, one idea", copy: "A single enamel bottle-cap charm, hand-poured in small batches for friends." },
  { year: "2022", title: "The first drop sells out", copy: "500 units gone in under an hour. We knew we were onto something." },
  { year: "2023", title: "In-house design studio", copy: "We brought design, plating, and quality control fully in-house." },
  { year: "2024", title: "120+ charms and counting", copy: "From bag charms to carabiners, every piece is designed to clip on and carry." },
];

export default function About() {
  return (
    <div>
      <section className="relative pt-40 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 50% 0%, #fbe9e4 0%, #fffffe 60%)" }} />
        <Reveal>
          <p className="text-xs uppercase tracking-[0.25em] text-cola-red font-semibold mb-4">Our Story</p>
          <h1 className="font-display text-5xl sm:text-6xl text-espresso max-w-3xl mx-auto text-balance">
            Charms with a little fizz in them
          </h1>
          <p className="text-espresso/60 max-w-xl mx-auto mt-6 text-lg">
            BerryCola began as a rebellion against boring, mass-produced
            jewelry. We make the charms we always wished existed.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-6">
        <Reveal>
          <div className="rounded-[2rem] overflow-hidden shadow-xl">
            <img
              src="/products/bottle-cap-charm.jpg"
              alt="BerryCola bottle cap charm on denim"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 grid sm:grid-cols-2 gap-8">
        <Reveal>
          <div className="rounded-3xl bg-[#f7f0ec] p-10 h-full">
            <h2 className="font-display text-2xl text-espresso mb-4">What we believe</h2>
            <p className="text-espresso/65 leading-relaxed">
              Jewelry should be playful, not precious. Every Berry Cola charm is
              designed to be mixed, matched, and worn without ceremony — on a
              bag, a belt loop, or a keychain if that's your thing.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-3xl bg-espresso p-10 h-full">
            <h2 className="font-display text-2xl text-cream mb-4">How we make it</h2>
            <p className="text-cream/65 leading-relaxed">
              Every charm goes through five hands before it ships: design, wax
              casting, hand enamelling, polishing, and a final quality check.
              Nothing goes out that we wouldn't wear ourselves.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="bg-espresso py-24 my-16">
        <div className="mx-auto max-w-5xl px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <StatCounter value={52} suffix="K+" label="Charms Shipped" />
          <StatCounter value={4.9} suffix="/5" label="Average Rating" decimals={1} />
          <StatCounter value={120} suffix="+" label="Charm Designs" />
          <StatCounter value={2021} label="Founded" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <Reveal className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl text-espresso">How we got here</h2>
        </Reveal>
        <div className="relative border-l-2 border-espresso/10 pl-8 flex flex-col gap-14">
          {timeline.map((t, i) => (
            <Reveal key={t.year} delay={i * 0.08} className="relative">
              <span className="absolute -left-[41px] top-1 w-4 h-4 rounded-full bg-cola-red border-4 border-cream" />
              <span className="text-xs uppercase tracking-[0.2em] text-cola-red font-semibold">{t.year}</span>
              <h3 className="font-display text-xl text-espresso mt-1.5 mb-2">{t.title}</h3>
              <p className="text-espresso/60">{t.copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <Reveal>
          <div className="flex justify-center gap-4 mb-10">
            {[
              { icon: "GlassWater", gradient: ["#d51f1f", "#af7a6e"] as [string, string], tilt: -8 },
              { icon: "Camera", gradient: ["#424240", "#3c2620"] as [string, string], tilt: 6 },
              { icon: "Star", gradient: ["#af7a6e", "#424240"] as [string, string], tilt: -5 },
            ].map((c, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              >
                <PaperCharm icon={c.icon} gradient={c.gradient} size={56} tilt={c.tilt} />
              </motion.div>
            ))}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-espresso mb-6 text-balance">
            Ready to start your collection?
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-cola-red text-cream px-8 py-4 rounded-full font-semibold tracking-wide hover:bg-cola-red-dark transition-colors"
          >
            Shop All Charms <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
