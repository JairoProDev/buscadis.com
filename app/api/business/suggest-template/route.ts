import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  description: z.string().optional(),
  logo_url: z.string().optional(),
  dominantCategory: z.string().optional(),
  productCount: z.number().optional(),
  productsWithPhotoRatio: z.number().optional(),
  city: z.string().optional(),
});

function suggestTemplate(input: z.infer<typeof bodySchema>) {
  const reasons: string[] = [];
  let templateId = 'modern_tabs';
  let themePreset: 'executive' | 'minimal' | 'organic' | 'nocturno' = 'executive';

  const cat = (input.dominantCategory || '').toLowerCase();
  const photoRatio = input.productsWithPhotoRatio ?? 0;
  const count = input.productCount ?? 0;

  if (cat.includes('restaur') || cat.includes('comida') || cat.includes('gastronom')) {
    templateId = 'pack_restaurante';
    themePreset = 'organic';
    reasons.push('Categoría gastronómica detectada');
  } else if (cat.includes('belleza') || cat.includes('salon') || cat.includes('spa')) {
    templateId = 'pack_belleza';
    themePreset = 'nocturno';
    reasons.push('Sector belleza / bienestar');
  } else if (cat.includes('ferret') || cat.includes('construc') || cat.includes('herramient')) {
    templateId = 'pack_ferreteria';
    themePreset = 'executive';
    reasons.push('Retail de materiales / ferretería');
  } else if (cat.includes('servic') || cat.includes('consult')) {
    templateId = 'pack_servicios';
    themePreset = 'minimal';
    reasons.push('Perfil de servicios profesionales');
  } else if (count > 30 && photoRatio > 0.6) {
    templateId = 'bento_scroll';
    themePreset = 'organic';
    reasons.push(`Tienes ${count}+ productos con buenas fotos — ideal para layout Bento`);
  } else if (count > 15) {
    templateId = 'vibrant_tabs';
    themePreset = 'executive';
    reasons.push('Catálogo mediano con tabs vibrantes');
  } else if (count <= 5) {
    templateId = 'minimal_scroll';
    themePreset = 'minimal';
    reasons.push('Pocos productos — layout minimal enfocado en contacto');
  } else {
    reasons.push('Plantilla equilibrada por defecto');
  }

  if (input.logo_url && !input.description) {
    reasons.push('Tienes logo — completa la descripción para mejor SEO');
  }

  return { templateId, themePreset, reasons };
}

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const result = suggestTemplate(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST con description, dominantCategory, productCount, productsWithPhotoRatio' });
}
