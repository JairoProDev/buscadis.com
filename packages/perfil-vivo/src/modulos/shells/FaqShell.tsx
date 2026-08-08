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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {faqs.map((item) => (
          <details
            key={item.id}
            style={{
              borderRadius: 'var(--rd-md)',
              border: '1px solid var(--sf-line)',
              background: 'var(--sf-elev)',
              padding: '0 14px',
            }}
          >
            <summary
              style={{
                minHeight: 52,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                font: 'var(--ts-cuerpo)',
                fontWeight: 700,
                color: 'var(--tx-strong)',
                listStyle: 'none',
              }}
            >
              {item.pregunta}
            </summary>
            {/* Respuesta siempre en el DOM (aunque details esté cerrado) */}
            <p
              style={{
                margin: '0 0 14px',
                font: 'var(--ts-cuerpo)',
                color: 'var(--tx-muted)',
                lineHeight: 1.45,
              }}
            >
              {item.respuesta}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
