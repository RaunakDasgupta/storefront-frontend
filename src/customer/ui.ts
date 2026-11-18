// Utility-class strings the storefront's pages share, so the page width, padding and headings stay the same everywhere.
/** The page's content column. */
export const WRAP = "mx-auto max-w-[1240px] px-7 max-sm:px-4";
export const PAGE = `${WRAP} pt-7 pb-[72px] max-sm:pt-5 max-sm:pb-12`;
/** A narrower column, for the orders and account pages. */
export const PAGE_NARROW = "mx-auto max-w-[860px] px-7 pt-7 pb-[72px] max-sm:px-4 max-sm:pt-5 max-sm:pb-12";
export const H1 = "mb-2 text-[34px] leading-[1.15] font-[750] max-sm:text-[27px]";
export const LEDE = "mb-5 text-muted";

// The storefront's popups (login, sign up, checkout). `dlg` is in index.css.
export const DLG = "dlg w-[min(420px,calc(100vw-32px))]";
export const DLG_WIDE = "dlg w-[min(480px,calc(100vw-32px))]";
export const DLG_HEAD = "flex items-start justify-between gap-3 px-[22px] pt-[22px]";
export const DLG_TITLE = "text-[21px] font-[750] tracking-[-0.01em]";
export const DLG_BODY = "px-[22px] pt-[18px] pb-2";
export const DLG_DEMO = "mt-3.5 text-[12.5px] text-muted [&_code]:text-xs";

/** The product grid: as many 168px columns as fit, two on a phone. */
export const PRODUCT_GRID = "grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-x-[18px] gap-y-6 max-sm:grid-cols-2 max-sm:gap-x-2.5 max-sm:gap-y-3.5";
/** A section heading with a link at its right end. */
export const ROW_HEAD = "mb-2 flex items-baseline justify-between gap-3";
export const ROW_TITLE = "text-xl font-[750]";
/** The empty state of a list. */
export const EMPTY = "py-10 text-center";

export { SCROLL_BTN as ROW_BTN } from "../shared/ui/classes";
/** "Retail / Categories" above a page title. */
export const CRUMBS = "mb-5 text-muted [&_a]:no-underline [&_a:hover]:underline";
