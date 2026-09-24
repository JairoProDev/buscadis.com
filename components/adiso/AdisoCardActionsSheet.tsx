'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconClose,
  IconHeartOutline,
  IconHeart,
  IconEyeOff,
  IconShare,
  IconDownload,
  IconCopy,
  IconExternalLink,
  IconDismiss,
  IconAlertTriangle,
} from '@/components/Icons';
import { toDisplayTitle } from '@/lib/adiso-display';
import type { Adiso } from '@/types';
import type { AdisoCardActionId } from '@/hooks/useAdisoCardActions';

const REPORT_REASONS: { id: string; label: string }[] = [
  { id: 'spam', label: 'Spam o engañoso' },
  { id: 'scam', label: 'Estafa o fraude' },
  { id: 'offensive', label: 'Contenido ofensivo' },
  { id: 'duplicate', label: 'Duplicado' },
  { id: 'wrong_category', label: 'Categoría incorrecta' },
  { id: 'other', label: 'Otro' },
];

interface AdisoCardActionsSheetProps {
  adiso: Adiso;
  open: boolean;
  onClose: () => void;
  isSaved: boolean;
  canDownloadImage: boolean;
  onAction: (id: AdisoCardActionId, extra?: { reportReason?: string }) => void;
}

export default function AdisoCardActionsSheet({
  adiso,
  open,
  onClose,
  isSaved,
  canDownloadImage,
  onAction,
}: AdisoCardActionsSheetProps) {
  const [reportStep, setReportStep] = useState(false);
  const title = toDisplayTitle(adiso.titulo);
  const thumb = adiso.imagenesUrls?.[0] || adiso.imagenUrl;

  useEffect(() => {
    if (!open) setReportStep(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const row = (
    icon: React.ReactNode,
    label: string,
    action: AdisoCardActionId,
    destructive?: boolean
  ) => (
    <button
      type="button"
      className={`flex w-full items-center gap-4 rounded-xl px-2 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-white/10 ${
        destructive ? 'text-red-300' : 'text-white'
      }`}
      onClick={() => {
        onAction(action);
        if (action !== 'report') onClose();
      }}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center opacity-90">{icon}</span>
      {label}
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Opciones del anuncio"
            className="fixed inset-x-0 bottom-0 z-[201] mx-auto max-h-[min(88vh,640px)] w-full max-w-lg overflow-hidden rounded-t-[28px] bg-[#1c1c1e] pb-[env(safe-area-inset-bottom)] shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="relative px-5 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
                aria-label="Cerrar"
              >
                <IconClose size={18} />
              </button>

              {thumb && !thumb.startsWith('data:') && (
                <div className="mx-auto mt-2 h-[72px] w-[72px] overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                  <Image src={thumb} alt="" width={72} height={72} className="h-full w-full object-cover" />
                </div>
              )}

              <p className="mt-4 text-center text-xs text-white/55">
                Personaliza tu feed con estas acciones
              </p>
              <p className="mt-1 line-clamp-2 text-center text-sm font-semibold text-white">{title}</p>
            </div>

            {!reportStep ? (
              <div className="px-4 pb-6 pt-3">
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#2c2c2e] py-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                    onClick={() => {
                      onAction('see_more');
                      onClose();
                    }}
                  >
                    <IconHeartOutline size={22} />
                    Ver más
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#2c2c2e] py-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                    onClick={() => {
                      onAction('see_less');
                      onClose();
                    }}
                  >
                    <IconEyeOff size={22} />
                    Ver menos
                  </button>
                </div>

                <div className="divide-y divide-white/8">
                  {row(
                    isSaved ? <IconHeart size={20} className="text-red-400" /> : <IconHeartOutline size={20} />,
                    isSaved ? 'Quitar de guardados' : 'Guardar',
                    'save'
                  )}
                  {row(<IconShare size={20} />, 'Compartir', 'share')}
                  {canDownloadImage && row(<IconDownload size={20} />, 'Descargar imagen', 'download')}
                  {row(<IconCopy size={20} />, 'Copiar enlace', 'copy_link')}
                  {row(<IconExternalLink size={20} />, 'Abrir página del anuncio', 'open_page')}
                  {row(<IconDismiss size={20} />, 'Ocultar este anuncio', 'hide')}
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 rounded-xl px-2 py-3.5 text-left text-[15px] font-medium text-red-300 hover:bg-white/10"
                    onClick={() => setReportStep(true)}
                  >
                    <span className="flex h-6 w-6 items-center justify-center">
                      <IconAlertTriangle size={18} />
                    </span>
                    Reportar
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 pb-6 pt-2">
                <p className="mb-3 text-sm font-semibold text-white">¿Qué problema tiene este anuncio?</p>
                <div className="flex flex-col gap-1">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="rounded-xl px-3 py-3 text-left text-[15px] text-white hover:bg-white/10"
                      onClick={() => {
                        onAction('report', { reportReason: r.id });
                        onClose();
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 w-full py-2 text-center text-sm text-white/60"
                  onClick={() => setReportStep(false)}
                >
                  Volver
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
