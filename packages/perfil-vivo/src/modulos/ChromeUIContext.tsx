'use client';

/**
 * Chrome UI panels — Hybrid 3.0: sin QR en perfil público (D10).
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ChromePanel = 'secciones' | 'mas' | null;

type ChromeUIValue = {
  panel: ChromePanel;
  openSecciones: () => void;
  openMas: () => void;
  close: () => void;
};

const ChromeUIContext = createContext<ChromeUIValue | null>(null);

export function ChromeUIProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<ChromePanel>(null);
  const openSecciones = useCallback(() => setPanel('secciones'), []);
  const openMas = useCallback(() => setPanel('mas'), []);
  const close = useCallback(() => setPanel(null), []);
  const value = useMemo(
    () => ({ panel, openSecciones, openMas, close }),
    [panel, openSecciones, openMas, close]
  );
  return (
    <ChromeUIContext.Provider value={value}>{children}</ChromeUIContext.Provider>
  );
}

export function useChromeUI(): ChromeUIValue {
  const ctx = useContext(ChromeUIContext);
  if (!ctx) throw new Error('useChromeUI must be used within ChromeUIProvider');
  return ctx;
}
