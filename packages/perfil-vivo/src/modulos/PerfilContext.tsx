'use client';

import { createContext, useContext } from 'react';
import type { PerfilPayload } from '../types';

export type HandoffLinks = {
  whatsappPrimary: string | null;
  llamada: string | null;
  ruta: string | null;
  /** productoId → /r/token para preguntar por producto */
  productoWhatsapp: Record<string, string>;
  /** Promo vigente → WhatsApp con código en el mensaje */
  promocionWhatsapp: string | null;
};

export type PerfilContextValue = {
  payload: PerfilPayload;
  handoffs: HandoffLinks;
};

const PerfilContext = createContext<PerfilContextValue | null>(null);

export function PerfilProvider({
  value,
  children,
}: {
  value: PerfilContextValue;
  children: React.ReactNode;
}) {
  return (
    <PerfilContext.Provider value={value}>{children}</PerfilContext.Provider>
  );
}

export function usePerfil(): PerfilContextValue {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error('usePerfil must be used within PerfilProvider');
  return ctx;
}
