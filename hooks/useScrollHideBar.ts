'use client';

import { useEffect, useRef, useState } from 'react';

/** Oculta la barra al bajar; la muestra al subir. Siempre visible cerca del top. */
export function useScrollHideBar(threshold = 64) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= threshold) {
        setVisible(true);
      } else {
        setVisible(y < lastY.current);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return visible;
}
