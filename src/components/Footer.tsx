import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import logo from "../assets/berrycola-logo.jpg";
import NewsletterForm from "./NewsletterForm";
import { fetchCategories } from "../lib/api";

function SocialIcon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

const INSTAGRAM =
  "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.9 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16Zm0 3.78a5.06 5.06 0 1 0 0 10.12 5.06 5.06 0 0 0 0-10.12Zm0 8.34a3.28 3.28 0 1 1 0-6.56 3.28 3.28 0 0 1 0 6.56Zm5.26-8.54a1.18 1.18 0 1 1-2.36 0 1.18 1.18 0 0 1 2.36 0Z";
const PINTEREST = "M12 2a10 10 0 0 0-3.64 19.31c-.02-.78 0-1.72.2-2.57l1.43-6.05s-.36-.72-.36-1.78c0-1.66.96-2.9 2.16-2.9 1.02 0 1.5.77 1.5 1.7 0 1.04-.66 2.6-1 4.05-.28 1.21.6 2.2 1.8 2.2 2.16 0 3.83-2.28 3.83-5.57 0-2.91-2.1-4.95-5.1-4.95-3.48 0-5.52 2.61-5.52 5.31 0 1.05.4 2.18.91 2.8.1.12.12.23.09.35l-.34 1.38c-.05.22-.18.27-.41.16-1.52-.71-2.47-2.94-2.47-4.73 0-3.85 2.8-7.38 8.08-7.38 4.24 0 7.54 3.02 7.54 7.06 0 4.21-2.65 7.6-6.34 7.6-1.24 0-2.4-.65-2.8-1.42l-.77 2.92c-.28 1.07-1.04 2.42-1.55 3.24A10 10 0 1 0 12 2Z";

export default function Footer() {
  const [shopCategories, setShopCategories] = useState<string[]>(["Bag Charms", "Charm Tins"]);

  useEffect(() => {
    fetchCategories()
      .then((categories) => {
        if (categories.length > 0) setShopCategories(categories);
      })
      .catch(() => {});
  }, []);

  return (
    <footer 
      className="bg-cola-red text-cream rounded-t-2xl mt-6 w-full border-2 border-[#1e1a18] shadow-[0_-4px_0_#1e1a18] sm:shadow-[2px_-4px_0_#1e1a18]"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Berry Cola" className="w-14 h-14 rounded-full" />
            <span className="font-display text-lg">Berry Cola</span>
          </div>
          <p className="text-cream/60 text-sm leading-relaxed max-w-[220px]">
            Small charms. Big statements. Designed and stacked for the ones who
            build their own story.
          </p>
          <div className="flex gap-3 mt-5">
            <a
              href="https://www.instagram.com/berrycolastore/"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all"
            >
              <SocialIcon path={INSTAGRAM} />
            </a>
            <a
              href="https://in.pinterest.com/berrycolastore/"
              aria-label="Pinterest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all"
            >
              <SocialIcon path={PINTEREST} />
            </a>
            <a
              href="mailto:berrycolastore@gmail.com"
              aria-label="Email BerryCola"
              className="w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-cream/50 mb-4">Shop</h4>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li><Link to="/shop" className="hover:text-white hover:underline transition-colors">All Products</Link></li>
            {shopCategories.map((category) => (
              <li key={category}>
                <Link to={`/shop?category=${encodeURIComponent(category)}`} className="hover:text-white hover:underline transition-colors">
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-cream/50 mb-4">Help</h4>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li><Link to="/policies" className="hover:text-white hover:underline transition-colors">Store Policies</Link></li>
            <li><Link to="/orders" className="hover:text-white hover:underline transition-colors">Track your Order</Link></li>
            <li><Link to="/policies#returns" className="hover:text-white hover:underline transition-colors">Return Policy</Link></li>
            <li><Link to="/policies#privacy" className="hover:text-white hover:underline transition-colors">Privacy Policy</Link></li>
            <li><Link to="/contact" className="hover:text-white hover:underline transition-colors">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-cream/50 mb-4">Stay in the loop</h4>
          <p className="text-sm text-cream/60 mb-3">Drops, restocks, first dibs.</p>
          <NewsletterForm variant="dark" />
        </div>
      </div>
      <div className="border-t border-cream/20 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-cream/90" aria-label="Accepted payment methods">
            <span className="text-xs font-semibold text-cream/70">We accept</span>
            <span className="font-display text-lg italic font-black tracking-tight" aria-label="Visa">VISA</span>
            <span className="inline-flex items-center gap-1" aria-label="Mastercard">
              <span className="relative inline-flex h-5 w-8 items-center">
                <span className="absolute left-0 h-4 w-4 rounded-full bg-[#eb001b]" />
                <span className="absolute left-2.5 h-4 w-4 rounded-full bg-[#f79e1b]/95" />
              </span>
            </span>
            <span className="font-semibold tracking-tight" aria-label="Google Pay">
              <span className="text-[#4285f4]">G</span><span className="text-[#ea4335]">Pay</span>
            </span>
            <span className="rounded border border-cream/50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">BHIM UPI</span>
            <span className="text-xs font-semibold">Net Banking</span>
            <span className="text-xs font-semibold">Wallet</span>
          </div>
          <p className="text-xs text-cream/60 sm:text-right">© {new Date().getFullYear()} Berry Cola. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
