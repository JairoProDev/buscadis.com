/** Trigger a browser download for a remote image URL or data URL. */
export async function downloadCoverImage(
  sourceUrl: string,
  filename = `buscadis-adiso-${Date.now()}.jpg`,
): Promise<boolean> {
  if (typeof window === 'undefined' || !sourceUrl) return false;
  try {
    if (sourceUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = sourceUrl;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    }

    const res = await fetch(sourceUrl, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    return true;
  } catch {
    // Fallback: open in new tab so the user can save manually
    try {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
      return true;
    } catch {
      return false;
    }
  }
}
