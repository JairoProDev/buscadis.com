import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createAdisoTitleSlug } from '@/lib/url';

interface PageProps {
  params: Promise<{ token: string }>;
}

async function findAdisoByClaimToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, private_data')
    .contains('private_data', { claim_token: token })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export default async function ReclamarPage(props: PageProps) {
  const { token } = await props.params;
  const row = await findAdisoByClaimToken(token);

  if (!row) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Enlace no válido</h1>
        <p className="mt-2 text-[var(--text-secondary)]">Este aviso ya fue reclamado o el enlace expiró.</p>
        <Link href="/" className="mt-6 inline-block text-[var(--brand-blue)] font-semibold">
          Ir al inicio
        </Link>
      </main>
    );
  }

  const adisoUrl = `/a/${row.id as string}/${createAdisoTitleSlug(row.titulo as string)}`;

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-extrabold">Reclama tu aviso</h1>
      <p className="mt-3 text-[var(--text-secondary)]">
        Verifica que eres el anunciante de <strong>{row.titulo as string}</strong>. Al reclamarlo en tu cuenta,
        republicamos tu aviso gratis para que aparezca primero otra vez.
      </p>
      <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          <Link href={`/auth/login?next=${encodeURIComponent(`/reclamar/${token}`)}`} className="text-[var(--brand-blue)] font-semibold">
            Inicia sesión
          </Link>{' '}
          con el mismo correo o WhatsApp del aviso.
        </li>
        <li>Confirma tus datos y edita el texto si hace falta.</li>
        <li>Opción de retirar el aviso al instante si no lo autorizaste.</li>
      </ol>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={`/auth/login?next=${encodeURIComponent(`/reclamar/${token}`)}`}
          className="rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-center font-bold text-white"
        >
          Entrar y reclamar
        </Link>
        <Link href={adisoUrl} className="text-center text-sm text-[var(--text-secondary)] underline">
          Ver aviso publicado
        </Link>
      </div>
    </main>
  );
}
