import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfileBySlug } from '@/lib/business';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';

function escapeVcard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const profile = await getBusinessProfileBySlug(decoded);
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcard(profile.name)}`,
    profile.contact_phone ? `TEL;TYPE=CELL:${profile.contact_phone.replace(/\D/g, '')}` : '',
    profile.contact_whatsapp && profile.contact_whatsapp !== profile.contact_phone
      ? `TEL;TYPE=WORK:${profile.contact_whatsapp.replace(/\D/g, '')}`
      : '',
    profile.contact_email ? `EMAIL:${escapeVcard(profile.contact_email)}` : '',
    profile.contact_address
      ? `ADR;TYPE=WORK:;;${escapeVcard(profile.contact_address)};;;;`
      : '',
    `URL:${getBusinessCanonicalUrl(profile.slug)}`,
    profile.description ? `NOTE:${escapeVcard(profile.description.slice(0, 200))}` : '',
    'END:VCARD',
  ].filter(Boolean);

  const body = lines.join('\r\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${profile.slug}.vcf"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
