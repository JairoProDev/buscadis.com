'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import IconEnvios from '@/components/envios/IconEnvios';
import Header from '@/components/Header';
import { FaMotorcycle, FaBoxOpen, FaShieldAlt } from 'react-icons/fa';

export default function EnviosHubPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-24 pt-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.12)]">
            <IconEnvios size={36} color="var(--brand-blue)" />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Envíos
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Mandados y encomiendas en moto por Cusco. Motorizados verificados.
            Pagas en efectivo o Yape al entregar.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/envios/nueva"
            className="flex w-full items-center gap-3 rounded-2xl bg-[var(--brand-blue)] px-5 py-4 text-left text-white shadow-sm transition hover:opacity-95"
          >
            <FaBoxOpen size={22} />
            <div>
              <div className="font-semibold">Pedir un envío</div>
              <div className="text-xs text-white/80">Recojo → destino en minutos</div>
            </div>
          </Link>

          <Link
            href="/envios/conductor"
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-5 py-4 text-left transition hover:bg-[var(--hover-bg)]"
          >
            <FaMotorcycle size={22} color="var(--brand-blue)" />
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                Soy motorizado
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Ver solicitudes o registrarte
              </div>
            </div>
          </Link>
        </div>

        <ul className="mt-8 space-y-3 text-sm text-[var(--text-secondary)]">
          <li className="flex gap-2">
            <FaShieldAlt className="mt-0.5 shrink-0 text-[var(--brand-blue)]" />
            Conductores con DNI, licencia, SOAT y antecedentes revisados.
          </li>
          <li className="flex gap-2">
            <FaBoxOpen className="mt-0.5 shrink-0 text-[var(--brand-blue)]" />
            Paquetes, documentos, mandados, olvidados… o describe lo que necesitas.
          </li>
        </ul>

        {user && (
          <Link
            href="/envios/nueva"
            className="mt-6 block text-center text-sm font-medium text-[var(--brand-blue)]"
          >
            Mis envíos recientes → pide uno nuevo
          </Link>
        )}
      </main>
    </div>
  );
}
