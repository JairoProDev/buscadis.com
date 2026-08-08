/** Server-safe JSON-LD script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
