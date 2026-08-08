'use client';

import { useMemo, useState } from 'react';
import { isDemoPerfilVivoSlug } from '../../demos-slugs';
import { usePerfil } from '../PerfilContext';
import {
  responderPreguntaIa,
  sugerenciasDesdePerfil,
} from '../../ia/sugerencias';

export const PV_IA_UNANSWERED_EVENT = 'pv:ia-unanswered';

function waMeFromPhone(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * §23 — Pregúntale al negocio (ADIS AI).
 * Respuestas solo con datos del perfil; si no sabe → WhatsApp + evento corpus.
 */
export function IaShell({ titulo }: { titulo: string }) {
  const { payload, handoffs } = usePerfil();
  const sugerencias = useMemo(() => sugerenciasDesdePerfil(payload), [payload]);
  const [activa, setActiva] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [respuestaCustom, setRespuestaCustom] = useState<string | null | undefined>(
    undefined
  );

  if (sugerencias.length < 1 && !payload.negocio.contacto.whatsapp) return null;

  const sug = sugerencias.find((s) => s.id === activa) ?? null;
  const phone = payload.negocio.contacto.whatsapp;
  const businessId = payload.negocio.id;
  const isDemo = isDemoPerfilVivoSlug(payload.negocio.slug);

  const logUnanswered = (pregunta: string) => {
    if (isDemo || !businessId || typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent(PV_IA_UNANSWERED_EVENT, {
        detail: { businessProfileId: businessId, pregunta: pregunta.trim().slice(0, 280) },
      })
    );
  };

  const preguntarPorWa = (pregunta: string, sugId?: string, unanswered = false) => {
    if (unanswered) logUnanswered(pregunta);
    const href =
      (sugId && handoffs.iaSugerencias?.[sugId]) ||
      (phone
        ? waMeFromPhone(
            phone,
            `Hola, vi el perfil de ${payload.negocio.nombre} en Buscadis. ${pregunta}`
          )
        : handoffs.whatsappPrimary);
    if (href) window.location.href = href;
  };

  return (
    <section className="pv-modulo" id="ia" aria-label={titulo || 'Pregúntale al negocio'}>
      <h2 style={{ margin: '0 0 6px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Pregúntale al negocio'}
      </h2>
      <p style={{ margin: '0 0 12px', font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
        Asistente de Buscadis · solo usa datos de este perfil
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sugerencias.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiva(s.id);
              setRespuestaCustom(undefined);
            }}
            style={{
              textAlign: 'left',
              minHeight: 44,
              padding: '12px 14px',
              borderRadius: 'var(--rd-md)',
              border: '1px solid var(--sf-line)',
              background: activa === s.id ? 'var(--mk-suave)' : 'var(--sf-elev)',
              color: 'var(--tx-strong)',
              font: 'var(--ts-cuerpo)',
              cursor: 'pointer',
            }}
          >
            {s.pregunta}
          </button>
        ))}
      </div>

      {sug ? (
        <div
          style={{
            marginTop: 12,
            padding: '14px 16px',
            borderRadius: 'var(--rd-md)',
            border: '1px solid var(--sf-line)',
            background: 'var(--sf-base)',
          }}
        >
          {sug.respuesta ? (
            <p style={{ margin: 0, font: 'var(--ts-cuerpo)', color: 'var(--tx-base)' }}>
              {sug.respuesta}
            </p>
          ) : (
            <p style={{ margin: 0, font: 'var(--ts-cuerpo)', color: 'var(--tx-muted)' }}>
              No tengo ese dato en el perfil. Te paso la pregunta por WhatsApp.
            </p>
          )}
          <button
            type="button"
            onClick={() => preguntarPorWa(sug.pregunta, sug.id, !sug.respuesta)}
            style={{
              marginTop: 12,
              width: '100%',
              minHeight: 48,
              border: 0,
              borderRadius: 'var(--rd-md)',
              background: 'var(--mk-accion)',
              color: 'var(--mk-sobre)',
              font: 'var(--ts-cuerpo)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {sug.respuesta ? 'Confirmar por WhatsApp' : 'Preguntar por WhatsApp'}
          </button>
        </div>
      ) : null}

      <form
        style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          const q = custom.trim();
          if (!q) return;
          const r = responderPreguntaIa(payload, q);
          setActiva(null);
          setRespuestaCustom(r);
          if (r === null) preguntarPorWa(q, undefined, true);
        }}
      >
        <label style={{ font: 'var(--ts-meta)', color: 'var(--tx-muted)' }} htmlFor="pv-ia-q">
          O escribe tu pregunta
        </label>
        <input
          id="pv-ia-q"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Ej. ¿Aceptan Yape?"
          style={{
            minHeight: 48,
            padding: '12px 14px',
            borderRadius: 'var(--rd-md)',
            border: '1px solid var(--sf-line)',
            background: 'var(--sf-elev)',
            font: 'var(--ts-cuerpo)',
            color: 'var(--tx-strong)',
          }}
        />
        <button
          type="submit"
          style={{
            minHeight: 48,
            border: '1px solid var(--sf-line)',
            borderRadius: 'var(--rd-md)',
            background: 'var(--sf-elev)',
            color: 'var(--tx-strong)',
            font: 'var(--ts-cuerpo)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Preguntar
        </button>
      </form>

      {respuestaCustom !== undefined && activa === null ? (
        <div
          style={{
            marginTop: 12,
            padding: '14px 16px',
            borderRadius: 'var(--rd-md)',
            border: '1px solid var(--sf-line)',
            background: 'var(--sf-base)',
          }}
        >
          {respuestaCustom ? (
            <>
              <p style={{ margin: 0, font: 'var(--ts-cuerpo)', color: 'var(--tx-base)' }}>
                {respuestaCustom}
              </p>
              <button
                type="button"
                onClick={() => preguntarPorWa(custom.trim())}
                style={{
                  marginTop: 12,
                  width: '100%',
                  minHeight: 48,
                  border: 0,
                  borderRadius: 'var(--rd-md)',
                  background: 'var(--mk-accion)',
                  color: 'var(--mk-sobre)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirmar por WhatsApp
              </button>
            </>
          ) : (
            <p style={{ margin: 0, font: 'var(--ts-cuerpo)', color: 'var(--tx-muted)' }}>
              No encontré esa respuesta en el perfil. Abriendo WhatsApp…
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
