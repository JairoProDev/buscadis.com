-- Alias del bucket de medios. El bucket real en producción es avisos-images.
-- La API de historias buscaba adisos-images y devolvía "Bucket not found".

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'adisos-images',
  'adisos-images',
  true,
  52428800
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Permitir leer imágenes de adisos" ON storage.objects;
CREATE POLICY "Permitir leer imágenes de adisos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'adisos-images');

DROP POLICY IF EXISTS "Permitir subir imágenes de adisos" ON storage.objects;
CREATE POLICY "Permitir subir imágenes de adisos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'adisos-images');
