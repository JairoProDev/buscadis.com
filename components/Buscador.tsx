'use client';

import { useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { IconMicrophone, IconGoogleLens } from './Icons';
import { Categoria } from '@/types';

interface BuscadorProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  onCategoryDetected?: (categoria: Categoria) => void;
  onNotify?: (message: string, type?: 'info' | 'error' | 'success') => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

export default function Buscador({
  value,
  onChange,
  compact = false,
  onCategoryDetected,
  onNotify,
}: BuscadorProps) {
  const { t } = useTranslation();
  const { isListening, isSupported, start: startVoice, stop: stopVoice } = useSpeechRecognition('es-PE');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const notify = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    onNotify?.(message, type);
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      stopVoice();
      return;
    }

    if (!isSupported) {
      notify('Tu navegador no soporta búsqueda por voz. Usa Chrome o Edge en desktop/Android.', 'error');
      return;
    }

    startVoice(
      (transcript) => {
        onChange(transcript);
        notify(`Buscando: "${transcript}"`, 'success');
      },
      (message) => notify(message, 'error')
    );
  };

  const handleImageSelected = async (file: File | null | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Selecciona un archivo de imagen (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      notify('La imagen es muy grande. Usa una menor a 8 MB.', 'error');
      return;
    }

    setIsAnalyzingImage(true);
    notify('Analizando imagen…', 'info');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const response = await fetch('/api/ai/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 503 && data.fallback) {
          notify('IA visual no disponible aquí. Escribe en el buscador qué viste en la foto.', 'error');
          return;
        }
        throw new Error(data.error || 'Error al analizar la imagen');
      }

      if (data.query) {
        onChange(String(data.query));
        if (data.category && onCategoryDetected) {
          onCategoryDetected(data.category as Categoria);
        }
        notify(`Búsqueda visual: "${data.query}"`, 'success');
        return;
      }

      notify('No encontramos palabras clave en la imagen. Prueba con otra foto.', 'error');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo analizar la imagen';
      notify(message, 'error');
    } finally {
      setIsAnalyzingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const actionBtnClass =
    'p-2 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none';

  return (
    <div className={`-mx-4 px-4 ${compact ? 'py-1' : 'py-2'} md:mx-0 md:px-0 transition-all duration-300`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageSelected(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleImageSelected(e.target.files?.[0])}
      />

      <div className="relative group z-30">
        <div
          className={`
            brand-search-shell relative flex items-center bg-white dark:bg-slate-800/40 border rounded-full
            ${compact ? 'px-4 py-2.5' : 'px-6 py-4 rounded-2xl'}
            shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]
            backdrop-blur-md transition-all duration-300 motion-reduce:transition-none
            hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] motion-reduce:hover:translate-y-0 hover:-translate-y-0.5
            focus-within:shadow-[0_8px_24px_rgba(var(--brand-primary-rgb),0.2)] focus-within:ring-2 focus-within:ring-[var(--brand-blue)]/35 dark:focus-within:ring-[var(--brand-blue)]/55
          `}
        >
          <FaSearch className="w-5 h-5 text-[var(--brand-blue)] mr-3 flex-shrink-0 transition-transform group-focus-within:scale-110" />

          <input
            type="search"
            placeholder={t('search.placeholder') || '¿Qué estás buscando?'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-w-0 border-none outline-none text-[16px] text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent truncate h-full py-1"
          />

          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={handleVoiceSearch}
              disabled={isAnalyzingImage}
              className={`${actionBtnClass} ${
                isListening
                  ? 'text-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse'
                  : 'text-[var(--brand-blue)]/80 hover:text-[var(--brand-blue)] hover:bg-[rgba(var(--brand-primary-rgb),0.08)] dark:hover:bg-[rgba(var(--brand-primary-rgb),0.15)]'
              }`}
              title={isListening ? 'Escuchando… (tocar para detener)' : 'Búsqueda por voz'}
              aria-label={isListening ? 'Detener búsqueda por voz' : 'Búsqueda por voz'}
              aria-pressed={isListening}
            >
              <IconMicrophone size={20} />
            </button>

            <button
              type="button"
              onClick={() => {
                const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
                if (isMobile && cameraInputRef.current) {
                  cameraInputRef.current.click();
                } else if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              disabled={isAnalyzingImage || isListening}
              className={`${actionBtnClass} text-gray-500 dark:text-gray-400 hover:text-[var(--brand-yellow)] hover:bg-[rgba(var(--brand-yellow-rgb),0.12)] dark:hover:bg-[rgba(var(--brand-yellow-rgb),0.15)] ${
                isAnalyzingImage ? 'animate-pulse text-[var(--brand-yellow)]' : ''
              }`}
              title="Búsqueda visual (foto)"
              aria-label="Búsqueda visual con foto"
            >
              <IconGoogleLens size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
