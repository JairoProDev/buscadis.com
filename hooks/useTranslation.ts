'use client';

import { useState, useEffect, useCallback } from 'react';
import { Locale, defaultLocale } from '@/i18n';
import { loadMessages, t as translate, getCurrentLocale, setCurrentLocale } from '@/lib/i18n';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isLoading, setIsLoading] = useState(false);

  const changeLocale = useCallback(async (newLocale: Locale) => {
    setIsLoading(true);
    try {
      await loadMessages(newLocale);
      setCurrentLocale(newLocale);
      setLocaleState(newLocale);
      localStorage.setItem('locale', newLocale);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    } catch (error) {
      console.error('Error changing locale:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedLocale = (localStorage.getItem('locale') as Locale) || defaultLocale;
    if (savedLocale !== defaultLocale) {
      void changeLocale(savedLocale);
    } else {
      setLocaleState(getCurrentLocale());
    }
  }, [changeLocale]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(key, params);
  };

  return {
    t,
    locale,
    changeLocale,
    isLoading,
  };
}
