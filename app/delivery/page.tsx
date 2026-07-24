'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { IconBox, IconMotorcycle, IconUser } from '@/components/Icons';

export default function DeliveryHubPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto flex max-w-md flex-col px-4 pb-24 pt-10">
        <h1
          className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)]"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Delivery
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
          ¿Qué quieres hacer?
        </p>

        <div className="mt-8 grid gap-4">
          <Link
            href="/delivery/pedir"
            className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-8 transition hover:border-[var(--brand-blue)] hover:bg-[rgba(var(--brand-primary-rgb),0.08)] active:scale-[0.99]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.14)]">
              <span className="relative inline-flex">
                <IconUser size={28} color="var(--brand-blue)" />
                <IconBox
                  size={16}
                  color="var(--brand-blue)"
                  className="absolute -bottom-1 -right-2"
                />
              </span>
            </span>
            <span className="text-xl font-bold text-[var(--text-primary)]">Pedir</span>
            <span className="text-center text-xs text-[var(--text-secondary)]">
              Solicita un envío o traslado
            </span>
          </Link>

          <Link
            href="/delivery/llevar"
            className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-8 transition hover:border-[var(--brand-blue)] hover:bg-[rgba(var(--brand-primary-rgb),0.08)] active:scale-[0.99]"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.14)]">
              <IconMotorcycle size={30} color="var(--brand-blue)" />
            </span>
            <span className="text-xl font-bold text-[var(--text-primary)]">Llevar</span>
            <span className="text-center text-xs text-[var(--text-secondary)]">
              Soy motorizado — ver y aceptar pedidos
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
