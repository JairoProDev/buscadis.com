'use client';

import { useEffect, useState, useRef } from 'react';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { withThemeTransition } from '@/lib/theme-meta';

const themeOptions = [
  { value: 'light' as const, label: 'Claro', icon: FaSun },
  { value: 'auto' as const, label: 'Automático', icon: FaDesktop },
  { value: 'dark' as const, label: 'Oscuro', icon: FaMoon },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Leer preferencia guardada
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme('auto');
      applyTheme('auto');
    }

    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null || 'auto';
      if (currentTheme === 'auto') {
        applyTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const applyTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    root.classList.remove('light-mode', 'dark-mode', 'dark');

    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-mode', 'dark');
      } else {
        root.classList.add('light-mode');
      }
    } else if (newTheme === 'dark') {
      root.classList.add('dark-mode', 'dark');
    } else {
      root.classList.add('light-mode');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    withThemeTransition(() => applyTheme(newTheme));
    setIsOpen(false);
  };

  if (!mounted) {
    return null; // Evitar flash de contenido incorrecto
  }

  const currentOption = themeOptions.find(opt => opt.value === theme) || themeOptions[1];
  const CurrentIcon = currentOption.icon;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Cambiar tema"
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.6rem 0.8rem',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          justifyContent: 'space-between',
          boxShadow: isOpen ? '0 0 0 2px var(--brand-blue-alpha)' : 'none',
        }}
        className="hover:border-blue-400 group"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--brand-blue)'
          }}>
            <CurrentIcon size={14} aria-hidden="true" />
          </div>
          <span style={{ fontWeight: 600 }}>{currentOption.label}</span>
        </div>
        <span style={{
          fontSize: '0.7rem',
          opacity: 0.5,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '110%', // Position above button
            left: 0,
            right: 0,
            marginBottom: '0.5rem',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: 'var(--popover-shadow)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease-out'
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}} />
          {themeOptions.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--brand-blue)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 600 : 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSelected ? 1 : 0.7
                }}>
                  <OptionIcon size={14} aria-hidden="true" />
                </div>
                <span>{option.label}</span>
                {isSelected && <span style={{ marginLeft: 'auto', fontSize: '10px' }}>●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

