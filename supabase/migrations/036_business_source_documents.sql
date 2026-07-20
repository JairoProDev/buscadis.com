-- Vector engine "second brain": raw source documents the AI ingested to build a
-- business profile/catalog. Kept so the user can review/edit and the AI can
-- retrieve context on demand.

CREATE TABLE IF NOT EXISTS public.business_source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('text', 'audio', 'image', 'pdf', 'doc', 'link')),
  label TEXT,
  storage_path TEXT,
  url TEXT,
  mime_type TEXT,
  extracted_text TEXT,
  extracted_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_source_documents_profile
  ON public.business_source_documents(business_profile_id, created_at DESC);

ALTER TABLE public.business_source_documents ENABLE ROW LEVEL SECURITY;

-- Owner / active team member can read their own sources (never public).
DROP POLICY IF EXISTS "business_source_documents_owner_all" ON public.business_source_documents;
CREATE POLICY "business_source_documents_owner_all" ON public.business_source_documents
  FOR ALL
  USING (
    business_profile_id IN (
      SELECT bp.id FROM public.business_profiles bp WHERE bp.user_id = auth.uid()
    )
    OR business_profile_id IN (
      SELECT bm.business_profile_id FROM public.business_members bm
      WHERE bm.user_id = auth.uid()
        AND bm.status = 'active'
        AND bm.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    business_profile_id IN (
      SELECT bp.id FROM public.business_profiles bp WHERE bp.user_id = auth.uid()
    )
    OR business_profile_id IN (
      SELECT bm.business_profile_id FROM public.business_members bm
      WHERE bm.user_id = auth.uid()
        AND bm.status = 'active'
        AND bm.role IN ('owner', 'admin', 'editor')
    )
  );

-- Private storage bucket for the raw uploaded media (audio/pdf/docs/images).
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-sources', 'business-sources', false)
ON CONFLICT (id) DO NOTHING;

-- Only authenticated users may write to their own folder ({userId}/...).
DROP POLICY IF EXISTS "business_sources_owner_rw" ON storage.objects;
CREATE POLICY "business_sources_owner_rw" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'business-sources'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'business-sources'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
