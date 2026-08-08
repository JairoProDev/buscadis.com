import type { Metadata } from 'next';
import '@buscadis/perfil-vivo/chrome.css';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Perfil Vivo (preview)',
};

export default function PerfilVivoSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
