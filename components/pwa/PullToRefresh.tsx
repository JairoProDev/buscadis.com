'use client';

import React, { useState, useEffect } from 'react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [startY, setStartY] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const maxPullDistance = 80;
    const threshold = 60;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
            setIsPulling(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPulling || isRefreshing) return;

        const y = e.touches[0].clientY;
        const distance = y - startY;

        if (distance > 0) {
            // Easing function for resistance
            const resistance = 0.4;
            const pullContent = Math.min(distance * resistance, maxPullDistance);
            setPullDistance(pullContent);
        } else {
            setPullDistance(0);
            setIsPulling(false);
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling) return;
        setIsPulling(false);

        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            setPullDistance(maxPullDistance / 2); // Mantener un poco de altura para el spinner

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh' }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${pullDistance}px`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    transition: isPulling ? 'none' : 'height 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}
            >
                <div
                    style={{
                        transform: `rotate(${pullDistance * 2}deg)`,
                        opacity: pullDistance / threshold,
                        color: 'var(--brand-blue)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'var(--bg-primary)',
                        borderRadius: '50%',
                        padding: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    {isRefreshing ? (
                        <div style={{
                            width: '24px',
                            height: '24px',
                            border: '3px solid rgba(56, 189, 248, 0.3)',
                            borderTopColor: 'var(--brand-blue)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 7l-5-5-5 5" /></svg>
                    )}
                </div>
            </div>
            <div
                style={{
                    // Avoid transform when idle — it breaks position:fixed descendants (sidebar, FAB, etc.)
                    transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
                    transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
            >
                {children}
            </div>
        </div>
    );
}
