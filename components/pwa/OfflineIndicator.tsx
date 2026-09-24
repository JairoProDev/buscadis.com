'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { semantic } from '@/lib/bs-tokens';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [showBackOnline, setShowBackOnline] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOffline(!navigator.onLine);

            const handleOnline = () => {
                setIsOffline(false);
                setShowBackOnline(true);
                setTimeout(() => setShowBackOnline(false), 3000);
            };

            const handleOffline = () => {
                setIsOffline(true);
                setShowBackOnline(false);
            };

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    return (
        <AnimatePresence>
            {(isOffline || showBackOnline) && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '16px',
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: isOffline ? semantic.dangerFg : semantic.successFg,
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '24px',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                            backdropFilter: 'blur(10px)',
                            letterSpacing: '0.02em',
                        }}
                    >
                        {isOffline ? (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                                Sin conexión. Navegando modo offline.
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.94 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                                Conexión restablecida
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
