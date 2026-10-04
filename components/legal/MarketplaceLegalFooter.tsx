import Link from 'next/link';
import { BUSCADIS_LEGAL_NAME } from '@/lib/legal/operator';

/**
 * Pie discreto al final del feed (tras scroll). No compite con el time-to-value del feed.
 */
export default function MarketplaceLegalFooter() {
  return (
    <footer
      className="mt-10 border-t border-[var(--border-color)] pt-4 pb-2 text-center"
      aria-label="Información legal"
    >
      <p className="text-[11px] leading-relaxed text-[var(--text-tertiary)]">
        © {new Date().getFullYear()} Buscadis · {BUSCADIS_LEGAL_NAME}
      </p>
      <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
        <Link href="/privacidad" className="hover:text-[var(--brand-blue)]">
          Privacidad
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/terminos" className="hover:text-[var(--brand-blue)]">
          Términos
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/guia" className="hover:text-[var(--brand-blue)]">
          Ayuda
        </Link>
      </p>
    </footer>
  );
}
