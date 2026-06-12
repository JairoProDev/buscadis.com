'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Comprobar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsInstalled(true);
            return;
        }

        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Solo mostrar después de un rato para no ser intrusivos
            setTimeout(() => {
                const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
                if (!hasDismissed) {
                    setShowPrompt(true);
                }
            }, 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (isInstalled || !showPrompt) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    style={{
                        position: 'fixed',
                        bottom: '80px', // Por encima de la navegación móvil
                        left: '16px',
                        right: '16px',
                        maxWidth: '400px',
                        margin: '0 auto',
                        zIndex: 9998,
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '20px',
                        padding: '16px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        border: '2px solid var(--brand-blue)'
                    }}
                >
                    <div style={{ flexShrink: 0, width: '48px', height: '48px', backgroundColor: 'var(--brand-blue)', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                        <img src="/logo.png" alt="Buscadis" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Instalar App</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.3, marginTop: '2px' }}>Añadir a pantalla de inicio para una experiencia más fluida y sin conexión.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            onClick={handleInstallClick}
                            style={{
                                backgroundColor: 'var(--brand-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(56,189,248,0.3)',
                                transition: 'all 0.2s',
                            }}
                            className="hover:scale-105 active:scale-95"
                        >
                            Instalar
                        </button>
                        <button
                            onClick={handleDismiss}
                            style={{
                                background: 'none',
                                color: 'var(--text-tertiary)',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
