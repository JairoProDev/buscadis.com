'use client';

import { usePerfil } from '../PerfilContext';

/** §19 — FAQ: acordeón cerrado; respuestas en el HTML para SEO/AEO. */
export function FaqShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const faqs = payload.faqs;
  if (faqs.length < 2) return null;

  return (
    <section className="pv-modulo" id="faq">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Preguntas frecuentes'}
      </h2>
      <div className="pv-faq">
        {faqs.map((item) => (
          <details key={item.id} className="pv-faq__item">
            <summary className="pv-faq__q">
              <span>{item.pregunta}</span>
              <span className="pv-faq__chev" aria-hidden>
                ▾
              </span>
            </summary>
            {/* Respuesta siempre en el DOM (aunque details esté cerrado) */}
            <p className="pv-faq__a">{item.respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
