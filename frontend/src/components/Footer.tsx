import { REPO_URL } from '../config/project';
import { copy } from '../content/copy';

/** Spec 3.4 — footer copy from 7.1; the repo link placeholder stays visible. */
export default function Footer() {
  const [before, after] = copy.footer.split('{REPO_URL}');
  return (
    <footer className="mt-12 border-t border-slate-200/90 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500 sm:px-6 lg:px-8">
        {before}
        {REPO_URL.startsWith('http') ? (
          <a href={REPO_URL} className="text-primary-text hover:underline">
            {REPO_URL}
          </a>
        ) : (
          REPO_URL
        )}
        {after}
      </div>
    </footer>
  );
}
