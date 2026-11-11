import { useEffect, useState } from "react";
import AdminNav from "../../components/AdminNav";
import Pagination from "../../components/Pagination";
import { inr } from "../../components/admin/charts";
import { fetchCustomers, type AdminCustomer } from "../../lib/api";

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : ", ";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchCustomers(page, perPage, search)
      .then((result) => {
        if (!active) return;
        setCustomers(result.items);
        setTotalCustomers(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => { if (active) setError("Couldn't load customers."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search]);

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-6xl mx-auto">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-espresso">
          Customers <span className="text-espresso/40 text-xl">{totalCustomers}</span>
        </h1>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, email or phone"
          className="w-full sm:w-72 border border-espresso/15 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-cola-red bg-cream"
        />
      </div>

      {loading && <p className="text-espresso/50 text-sm">Loading…</p>}
      {error && <p className="text-cola-red text-sm">{error}</p>}

      {!loading && !error && (
        <div className="border border-espresso/10 rounded-3xl">
          <div className="overflow-x-auto rounded-t-3xl">
            <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-espresso/50 border-b border-espresso/10">
                <th className="font-semibold px-4 py-3">Customer</th>
                <th className="font-semibold px-4 py-3">Phone</th>
                <th className="font-semibold px-4 py-3">Joined</th>
                <th className="font-semibold px-4 py-3 text-right">Orders</th>
                <th className="font-semibold px-4 py-3 text-right">Spent</th>
                <th className="font-semibold px-4 py-3">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/8">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-espresso/3">
                  <td className="px-4 py-3">
                    <span className="block break-words whitespace-normal text-espresso">
                      {c.name ?? ", "}
                      {c.isAdmin && (
                        <span className="ml-2 text-[10px] font-semibold uppercase text-cola-red bg-cola-red/10 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </span>
                    <span className="block break-all whitespace-normal text-xs text-espresso/50">{c.email ?? ""}</span>
                  </td>
                  <td className="px-4 py-3 text-espresso/70">{c.phone ?? ", "}</td>
                  <td className="px-4 py-3 text-espresso/70">{date(c.joinedAt)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.orders}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{inr(c.spend)}</td>
                  <td className="px-4 py-3 text-espresso/70">{date(c.lastOrderAt)}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-espresso/45">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
          <div className="px-4 pb-3">
            <Pagination currentPage={page} totalPages={totalPages} totalItems={totalCustomers} perPage={perPage} onPageChange={setPage} itemLabel="customers" />
          </div>
        </div>
      )}
    </div>
  );
}
