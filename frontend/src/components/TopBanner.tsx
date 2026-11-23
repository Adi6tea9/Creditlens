import { copy } from '../content/copy';

/** Spec 3.1 — dark research banner on every page. Not sticky. */
export default function TopBanner() {
  return (
    <aside>
      <div
        role="note"
        className="bg-slate-900 px-4 py-2.5 text-center text-xs leading-snug text-white sm:text-[13px]"
      >
        {copy.topBanner}
      </div>
    </aside>
  );
}
