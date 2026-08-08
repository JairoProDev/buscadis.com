'use client';

import { Button } from '@buscadis/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface BotonPublicarProps {
  onClick: () => void;
}

export default function BotonPublicar({ onClick }: BotonPublicarProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <Button
      variant="publish"
      size="lg"
      onClick={onClick}
      className={
        isDesktop
          ? 'fixed bottom-8 right-8 z-[var(--bs-z-raised)] shadow-[var(--bs-elevation-2)]'
          : 'fixed bottom-4 left-1/2 z-[var(--bs-z-raised)] w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 shadow-[var(--bs-elevation-2)]'
      }
    >
      Publicar
    </Button>
  );
}
