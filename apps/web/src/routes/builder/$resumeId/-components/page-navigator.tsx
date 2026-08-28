import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

type PageNavigatorProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PageNavigator({
  currentPage,
  totalPages,
  onPageChange,
}: PageNavigatorProps) {
  return (
    <div className="flex h-8 items-center rounded-full border border-[#e4e1e5] bg-white px-6 shadow-[0_8px_18px_rgba(31,31,50,0.14)]">
      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex size-5 items-center justify-center rounded-full text-[#242337] transition-colors hover:bg-[#f5f3f7] disabled:text-[#b8b6bf]"
      >
        <CaretLeftIcon className="size-5" weight="bold" />
      </button>

      <span className="min-w-16 text-center font-semibold text-[#242337] text-lg tabular-nums">
        {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        aria-label="Next page"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex size-5 items-center justify-center rounded-full text-[#242337] transition-colors hover:bg-[#f5f3f7] disabled:text-[#b8b6bf]"
      >
        <CaretRightIcon className="size-5" weight="bold" />
      </button>
    </div>
  );
}
