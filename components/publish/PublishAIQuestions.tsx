'use client';

import { useEffect, useState } from 'react';
import { PublishDraft } from '@/lib/publish/publish-draft-types';

interface Question {
  fieldId: string;
  question: string;
}

interface PublishAIQuestionsProps {
  draft: PublishDraft;
  onAnswer: (fieldId: string, value: string | number | boolean) => void;
}

export default function PublishAIQuestions({ draft, onAnswer }: PublishAIQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answer, setAnswer] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (draft.missingFields.length === 0) {
      setQuestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/publish/ai-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missingFields: draft.missingFields.slice(0, 3),
            categoria: draft.categoria,
            context: [draft.titulo, draft.descripcion].filter(Boolean).join('. '),
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        setQuestions(data.questions || []);
        if (data.questions?.[0]) setActiveField(data.questions[0].fieldId);
      } catch {
        if (!controller.signal.aborted) setQuestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draft.missingFields, draft.categoria, draft.titulo, draft.descripcion]);

  if (draft.missingFields.length === 0 || questions.length === 0) return null;

  const currentQ = questions.find((q) => q.fieldId === activeField) || questions[0];

  const submitAnswer = async () => {
    if (!answer.trim() || !currentQ) return;
    const res = await fetch('/api/publish/ai-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missingFields: draft.missingFields,
        fieldId: currentQ.fieldId,
        answer: answer.trim(),
        categoria: draft.categoria,
      }),
    });
    const data = await res.json();
    onAnswer(data.fieldId, data.value);
    setAnswer('');
    if (data.nextQuestions?.[0]) {
      setActiveField(data.nextQuestions[0].fieldId);
      setQuestions(data.nextQuestions);
    } else {
      setQuestions([]);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-200/50 p-3 space-y-2" style={{ background: 'rgba(99,102,241,0.05)' }}>
      <p className="text-xs font-bold text-purple-700 m-0">ADIS pregunta</p>
      {loading ? (
        <p className="text-sm text-[var(--text-secondary)] m-0">Preparando preguntas…</p>
      ) : (
        <>
          <p className="text-sm text-[var(--text-primary)] m-0">{currentQ?.question}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
              placeholder="Tu respuesta…"
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-[var(--border-color)] text-sm"
            />
            <button
              type="button"
              onClick={submitAnswer}
              className="px-3 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'var(--brand-blue)' }}
            >
              OK
            </button>
          </div>
        </>
      )}
    </div>
  );
}
