import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getActiveDealClipsServer } from '@/lib/deals/server';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { handle } = await params;

  const { data: profile } = await supabaseAdmin
    .from('creator_profiles')
    .select('*')
    .eq('handle', handle)
    .maybeSingle();

  if (!profile) notFound();

  const { data: userProf } = await supabaseAdmin
    .from('profiles')
    .select('nombre, avatar_url')
    .eq('id', profile.user_id)
    .maybeSingle();

  const { clips } = await getActiveDealClipsServer({
    authorId: profile.user_id,
    limit: 24,
  });

  return (
    <main className="min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/deals" className="text-sm text-[var(--brand-blue)]">
          ← Volver a Deals
        </Link>

        <header className="mt-4 flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5">
          {userProf?.avatar_url ? (
            <img
              src={userProf.avatar_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-blue)] text-2xl font-bold text-white">
              {(userProf?.nombre || handle).charAt(0)}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold">@{handle}</h1>
            <p className="text-[var(--text-secondary)]">{userProf?.nombre}</p>
            {profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              {profile.total_clips} clips · {profile.total_likes} likes
            </p>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {clips.map((clip) => (
            <Link
              key={clip.id}
              href={`/deals?clip=${clip.id}`}
              className="aspect-[9/16] overflow-hidden rounded-lg bg-black"
            >
              <img src={clip.poster_url || clip.media_url} alt={clip.title} className="h-full w-full object-cover" />
            </Link>
          ))}
        </div>

        {clips.length === 0 && (
          <p className="mt-8 text-center text-[var(--text-secondary)]">Sin deals publicados aún</p>
        )}
      </div>
    </main>
  );
}
