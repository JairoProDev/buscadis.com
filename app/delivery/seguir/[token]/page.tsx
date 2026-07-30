'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { STATUS_LABELS, type MotoRequestStatus } from '@/lib/envios';

interface PublicTrip {
  status: MotoRequestStatus;
  pickup_text: string;
  dropoff_text: string;
  rider_name: string | null;
  rider_placa: string | null;
  eta_minutes: number | null;
  rider_lat: number | null;
  rider_lng: number | null;
  updated_at: string;
}

export default function DeliverySeguirPage() {
  const params = useParams();
  const token = String(params.token);
  const [trip, setTrip] = useState<PublicTrip | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/envios/share/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No encontrado');
        if (!cancelled) {
          setTrip(data.trip);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error');
      }
    };
    void load();
    const t = setInterval(() => void load(), 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-xl font-bold">Seguimiento del envío</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Link de confianza — sin números de teléfono.
        </p>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        {!trip && !error && (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Cargando…</p>
        )}

        {trip && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[var(--border-color)] p-4">
              <p className="text-xs font-semibold uppercase text-[var(--brand-blue)]">
                {STATUS_LABELS[trip.status]}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-[var(--text-secondary)]">Desde</span>
                <br />
                <strong>{trip.pickup_text}</strong>
              </p>
              <p className="mt-2 text-sm">
                <span className="text-[var(--text-secondary)]">Hasta</span>
                <br />
                <strong>{trip.dropoff_text}</strong>
              </p>
              {trip.rider_name && (
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Motorizado: {trip.rider_name}
                  {trip.rider_placa ? ` · ${trip.rider_placa}` : ''}
                  {trip.eta_minutes != null ? ` · ETA ~${trip.eta_minutes} min` : ''}
                </p>
              )}
            </div>

            {trip.rider_lat != null && trip.rider_lng != null && (
              <a
                href={`https://www.google.com/maps?q=${trip.rider_lat},${trip.rider_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-full bg-[var(--brand-blue)] py-3 text-center text-sm font-semibold text-white"
              >
                Ver ubicación en mapa
              </a>
            )}

            <Link href="/delivery" className="block text-center text-sm text-[var(--brand-blue)]">
              Pedir en Buscadis Delivery
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
