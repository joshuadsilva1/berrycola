import { Link } from "react-router-dom";
import logo from "../assets/berrycola-logo.jpg";
import NewsletterForm from "./NewsletterForm";

function SocialIcon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

const INSTAGRAM =
  "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.9 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16Zm0 3.78a5.06 5.06 0 1 0 0 10.12 5.06 5.06 0 0 0 0-10.12Zm0 8.34a3.28 3.28 0 1 1 0-6.56 3.28 3.28 0 0 1 0 6.56Zm5.26-8.54a1.18 1.18 0 1 1-2.36 0 1.18 1.18 0 0 1 2.36 0Z";
const TIKTOK =
  "M16.6 5.82c-.85-.9-1.32-2.08-1.32-3.32h-3.1v14.02c0 1.6-1.3 2.9-2.9 2.9a2.9 2.9 0 0 1 0-5.8c.28 0 .55.04.8.11V10.6a6.03 6.03 0 0 0-.8-.05 6.02 6.02 0 1 0 6.02 6.02V9.1a8.36 8.36 0 0 0 4.9 1.57V7.55a5.03 5.03 0 0 1-3.6-1.73Z";

export default function Footer() {
  return (
    <footer className="bg-espresso text-cream">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Berry Cola" className="w-10 h-10 rounded-full" />
            <span className="font-display text-lg">Berry Cola</span>
          </div>
          <p className="text-cream/60 text-sm leading-relaxed max-w-[220px]">
            Small charms. Big statements. Designed and stacked for the ones who
            build their own story.
          </p>
          <div className="flex gap-3 mt-5">
            <a
              href="#"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:bg-cola-red hover:border-cola-red transition-colors"
            >
              <SocialIcon path={INSTAGRAM} />
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:bg-cola-red hover:border-cola-red transition-colors"
            >
              <SocialIcon path={TIKTOK} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-cream/50 mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li><Link to="/shop" className="hover:text-cola-red transition-colors">All Charms</Link></li>
            <li><Link to="/shop?category=Bag+Charms" className="hover:text-cola-red transition-colors">Bag Charms</Link></li>
            <li><Link to="/shop?category=Carabiners" className="hover:text-cola-red transition-colors">Carabiners</Link></li>
            <li><Link to="/shop?category=Phone+Charms" className="hover:text-cola-red transition-colors">Phone Charms</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-cream/50 mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li><Link to="/about" className="hover:text-cola-red transition-colors">Our Story</Link></li>
            <li><Link to="/contact" className="hover:text-cola-red transition-colors">Contact</Link></li>
            <li><a href="#" className="hover:text-cola-red transition-colors">Shipping &amp; Returns</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-cream/50 mb-4">Stay in the loop</h4>
          <p className="text-sm text-cream/60 mb-3">Drops, restocks, first dibs.</p>
          <NewsletterForm variant="dark" />
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Berry Cola. All rights reserved.
      </div>
    </footer>
  );
}
