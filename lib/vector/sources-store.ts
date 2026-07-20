/**
 * Vector engine — source persistence ("second brain").
 *
 * Stores ingested artifacts (and their raw media) so the user can review/edit
 * them and the AI can retrieve them as context later. Uses a service-role
 * client (server-only) to bypass RLS after the route has verified ownership.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Artifact, IngestSource } from './types';

const BUCKET = 'business-sources';

export interface StoredSource {
  id: string;
  business_profile_id: string;
  session_id: string | null;
  kind: string;
  label: string | null;
  storage_path: string | null;
  url: string | null;
  mime_type: string | null;
  extracted_text: string | null;
  extracted_json: unknown;
  created_at: string;
}

/**
 * Upload raw media for a source to the private bucket. Returns the storage path
 * and a signed-ish public path. Best-effort: returns null on failure.
 */
export async function uploadSourceMedia(
  admin: SupabaseClient,
  userId: string,
  source: IngestSource
): Promise<{ path: string; publicUrl: string } | null> {
  if (!source.dataBase64 || !source.mimeType) return null;
  try {
    const buffer = Buffer.from(source.dataBase64, 'base64');
    const ext = source.filename?.split('.').pop() || source.mimeType.split('/')[1] || 'bin';
    const path = `${userId}/sources/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: source.mimeType,
      upsert: false,
    });
    if (error) {
      console.error('uploadSourceMedia error:', error.message);
      return null;
    }
    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  } catch (e) {
    console.error('uploadSourceMedia exception:', (e as Error).message);
    return null;
  }
}

/** Persist ingested artifacts as source documents. Best-effort. */
export async function persistArtifacts(
  admin: SupabaseClient,
  businessProfileId: string,
  sessionId: string | null,
  artifacts: Artifact[]
): Promise<void> {
  if (artifacts.length === 0) return;
  const rows = artifacts.map((a) => ({
    business_profile_id: businessProfileId,
    session_id: sessionId,
    kind: a.kind,
    label: a.label,
    url: a.mediaUrl ?? null,
    mime_type: a.mimeType ?? null,
    extracted_text: a.rawText || null,
    extracted_json: a.extractedJson ?? null,
  }));
  const { error } = await admin.from('business_source_documents').insert(rows);
  if (error) console.error('persistArtifacts error:', error.message);
}

/** Retrieve prior sources for a profile (context / user review). */
export async function listSourceDocuments(
  admin: SupabaseClient,
  businessProfileId: string,
  limit = 50
): Promise<StoredSource[]> {
  const { data, error } = await admin
    .from('business_source_documents')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('listSourceDocuments error:', error.message);
    return [];
  }
  return (data as StoredSource[]) || [];
}
