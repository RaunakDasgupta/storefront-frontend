// Utility-class strings the admin pages share, so cards, headings and dialogs look the same everywhere.
export { SCROLL_BTN } from "../shared/ui/classes";

/** A white card with a hairline border. Add the margin where it is used. */
export const CARD = "overflow-hidden rounded-xl border border-line bg-surface";
export const PAGE_HEAD = "mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3";
export const H1 = "text-[30px] leading-[1.15] font-[750] max-sm:text-[26px]";

/** An order or product card in the scrolling grid. Add a gap-* where it is used. */
export const OC = "relative flex min-w-0 snap-start flex-col overflow-hidden rounded-[14px] border border-line bg-surface px-4 py-3.5 text-ink no-underline transition duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_22px_rgba(43,138,30,.12)]";
/** The small Edit and Delete buttons on a card. */
export const PC_BTN = "inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-line bg-surface px-[11px] text-[12.5px] font-semibold text-ink transition-colors";

/** The Retail / Bulk pill switch and the status tabs share this shape. */
export const PILL_SWITCH = "mb-[18px] inline-flex gap-1 rounded-full border border-line bg-surface p-1";
export const PILL_BTN = "rounded-full border-0 bg-transparent px-[18px] py-2 font-[650] text-muted transition-colors hover:text-ink aria-pressed:bg-brand aria-pressed:text-white aria-pressed:hover:text-white";
/** Underlined tab buttons (status and stock filters). */
export const TABS = "flex max-w-full gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] max-sm:w-full max-sm:gap-5";
export const TAB_BTN = "-mb-px flex-none border-0 border-b-2 border-transparent bg-transparent py-2.5 font-[550] text-muted hover:text-ink aria-pressed:border-b-brand aria-pressed:text-ink";
/** The row holding the tabs and the search box. */
export const TOOLBAR = "mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line max-sm:gap-0";
export const SEARCH_BOX = "relative mb-2 min-w-[200px] flex-[0_1_300px] max-sm:mb-3 max-sm:flex-[1_1_100%]";

/** Edit and delete dialogs. */
export const DLG = "dlg overflow-hidden";
export const DLG_FOOT = "flex flex-wrap items-center justify-end gap-2.5 border-t border-line bg-hover px-[22px] pt-3.5 pb-[18px] max-sm:[&_.btn]:flex-1";

/** A card's header row, title and body. */
export const CARD_HEAD = "flex items-center justify-between gap-3 px-5 pt-4 pb-3";
export const CARD_TITLE = "text-base font-bold";
export const CARD_BODY = "px-5 pt-1 pb-[18px]";
export const SEARCH_ICON = "pointer-events-none absolute top-[9px] left-3 size-5 text-muted";
export const SEARCH_INPUT = "rounded-full border-edge-soft pl-[38px]";
