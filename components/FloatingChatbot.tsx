'use client';

import React, { useState } from 'react';
import ChatbotIANew from './ChatbotIANew';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMagic, FaTimes, FaChevronDown } from 'react-icons/fa';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/contexts/NavigationContext';

export default function FloatingChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const { isSidebarExpanded } = useNavigation();

    return (
        <>
            <style jsx global>{`
                @keyframes pulse-shadow {
                    0%, 100% {
                        box-shadow: 
                            0 4px 12px color-mix(in srgb, var(--bs-color-accent-chatStart) 40%, transparent),
                            0 0 0 0 color-mix(in srgb, var(--bs-color-accent-chatStart) 40%, transparent);
                    }
                    50% {
                        box-shadow: 
                            0 4px 12px color-mix(in srgb, var(--bs-color-accent-chatStart) 40%, transparent),
                            0 0 0 10px color-mix(in srgb, var(--bs-color-accent-chatStart) 0%, transparent);
                    }
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }

                .chatbot-fab {
                    background: linear-gradient(135deg, var(--bs-color-accent-chatStart) 0%, var(--bs-color-accent-chatEnd) 100%);
                    box-shadow: 0 4px 12px color-mix(in srgb, var(--bs-color-accent-chatStart) 40%, transparent);
                    animation: pulse-shadow 2s infinite;
                }
            `}</style>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        {!isDesktop && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-black/30 z-[9998]"
                            />
                        )}

                        <motion.div
                            initial={isDesktop ? { opacity: 0, y: 20, scale: 0.95 } : { y: '100%' }}
                            animate={isDesktop ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }}
                            exit={isDesktop ? { opacity: 0, y: 20, scale: 0.95 } : { y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={`fixed bg-white shadow-2xl z-[9999] overflow-hidden flex flex-col border border-gray-100 transition-all duration-300
                                ${isDesktop
                                    ? `bottom-24 w-[380px] h-[600px] max-h-[calc(100vh-120px)] rounded-2xl ${isSidebarExpanded ? 'right-[450px]' : 'right-[100px]'}`
                                    : 'left-0 right-0 bottom-0 h-[85vh] rounded-t-2xl'
                                }`}
                        >
                            {/* Header for Mobile Sheet */}
                            {!isDesktop && (
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                                    <div className="w-8" /> {/* Spacer */}
                                    <div className="w-12 h-1 bg-gray-300 rounded-full" /> {/* Handle */}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 text-gray-500 hover:text-gray-700 bg-gray-50 rounded-full"
                                    >
                                        <FaChevronDown size={20} />
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 overflow-hidden relative">
                                <ChatbotIANew onMinimize={() => setIsOpen(false)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`chatbot-fab fixed bottom-[80px] right-5 text-white border-none rounded-3xl py-3 pl-4 pr-5 flex items-center gap-2 font-semibold text-sm z-50 transition-all duration-300 active:scale-95 hover:scale-105 ${isDesktop ? (isSidebarExpanded ? 'right-[450px]' : 'right-[100px]') : ''}`}
                >
                    <FaMagic className="text-yellow-300 text-lg" />
                    <span>Buscar con IA</span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-[pulse-dot_1.5s_infinite]" />
                </button>
            )}
        </>
    );
}
