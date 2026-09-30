'use client';

import FeedbackButton from '@/components/FeedbackButton';
import BuscadisSocialFloat from '@/components/BuscadisSocialFloat';

/** Ayuda (izquierda) + redes Buscadis (derecha), alineados al mismo offset del nav móvil. */
export default function SiteFloatingActions() {
  return (
    <>
      <FeedbackButton />
      <BuscadisSocialFloat />
    </>
  );
}
