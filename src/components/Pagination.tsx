import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  perPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage = 10,
  onPageChange,
  className = "",
  itemLabel = "items",
}: PaginationProps) {
  if (totalPages <= 1 && (totalItems === undefined || totalItems <= perPage)) {
    return null;
  }

  // Calculate start and end item index for "Showing 1-10 of 42"
  const startIdx = totalItems ? (currentPage - 1) * perPage + 1 : undefined;
  const endIdx = totalItems ? Math.min(currentPage * perPage, totalItems) : undefined;

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push("…");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 pt-4 mt-2 border-t-2 border-dashed border-[#1e1a18]/20 select-none ${className}`}
    >
      {/* Information text */}
      <div className="text-xs font-semibold text-espresso/70">
        {totalItems !== undefined && startIdx !== undefined && endIdx !== undefined ? (
          <span>
            Showing <strong className="text-espresso font-bold">{startIdx}</strong>–
            <strong className="text-espresso font-bold">{endIdx}</strong> of{" "}
            <strong className="text-espresso font-bold">{totalItems}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Page <strong className="text-espresso font-bold">{currentPage}</strong> of{" "}
            <strong className="text-espresso font-bold">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((p, idx) => {
          if (p === "…") {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs font-bold text-espresso/40">
                …
              </span>
            );
          }
          const pageNum = Number(p);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-full text-xs font-bold border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-cola-red text-[#fbf5e9]"
                  : "bg-white text-espresso hover:text-cola-red hover:bg-[#fbf5e9]"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          title="Next page"
        >
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

