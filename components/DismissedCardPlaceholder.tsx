'use client';

import { useState } from 'react';
import { IconRefresh } from '@/components/Icons';
import { DISMISS_REASONS, DismissReason } from '@/lib/interactions';

interface DismissedCardPlaceholderProps {
    gridColumn: string;
    gridRow: string;
    minHeight?: string;
    onUndo: () => void;
    onFeedback: (reason: DismissReason) => void;
}

export default function DismissedCardPlaceholder({
    gridColumn,
    gridRow,
    minHeight,
    onUndo,
    onFeedback,
}: DismissedCardPlaceholderProps) {
    const [reasonGiven, setReasonGiven] = useState(false);

    const handleReasonClick = (reason: DismissReason) => {
        setReasonGiven(true);
        onFeedback(reason);
    };

    return (
        <div
            className="flex flex-col items-center justify-center text-center gap-3 p-4 rounded-[var(--card-radius)] border border-[var(--border-color)] bg-[var(--bg-tertiary)]"
            style={{ gridColumn, gridRow, height: '100%', minHeight }}
        >
            {reasonGiven ? (
                <p className="text-sm text-[var(--text-secondary)]">
                    Gracias, ajustaremos tus recomendaciones.
                </p>
            ) : (
                <>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                        Adiso ocultado. ¿Por qué?
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {DISMISS_REASONS.map((reason) => (
                            <button
                                key={reason.id}
                                type="button"
                                onClick={() => handleReasonClick(reason.id)}
                                className="px-3 py-1.5 text-xs font-medium rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--hover-bg)] hover:text-[var(--brand-blue)] transition-colors"
                            >
                                {reason.label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <button
                type="button"
                onClick={onUndo}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand-blue)] hover:underline mt-1"
            >
                <IconRefresh size={12} />
                Deshacer
            </button>
        </div>
    );
}
