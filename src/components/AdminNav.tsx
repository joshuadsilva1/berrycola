import { NavLink } from "react-router-dom";

const TABS = [
  { label: "Analytics", to: "/admin/analytics" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Products", to: "/admin/products" },
  { label: "Customers", to: "/admin/customers" },
  { label: "Messages", to: "/admin/messages" },
  { label: "Storefront", to: "/admin/storefront" }, 
  {label: "Promos", to: "/admin/promos"}
];

export default function AdminNav() {
  return (
    <nav className="flex gap-2 mb-8 overflow-x-auto -mx-1 px-1 pb-1">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              isActive ? "bg-espresso text-cream" : "text-espresso/60 hover:text-espresso hover:bg-espresso/5"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}