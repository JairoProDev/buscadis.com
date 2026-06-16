import type { BusinessProfile } from '@/types/business';

export interface ProfileChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export function getProfileChecklist(
  profile: Partial<BusinessProfile>,
  productCount: number,
  dealCount = 0
): { items: ProfileChecklistItem[]; complete: boolean; score: number } {
  const items: ProfileChecklistItem[] = [
    { id: 'logo', label: 'Logo', done: Boolean(profile.logo_url) },
    { id: 'products', label: '5+ productos', done: productCount >= 5 },
    { id: 'hours', label: 'Horarios', done: Boolean(profile.business_hours && Object.keys(profile.business_hours).length > 0) },
    { id: 'whatsapp', label: 'WhatsApp', done: Boolean(profile.contact_whatsapp) },
    { id: 'deal', label: '1 deal publicado', done: dealCount >= 1 },
    { id: 'description', label: 'Descripción', done: Boolean(profile.description && profile.description.length > 20) },
  ];
  const doneCount = items.filter((i) => i.done).length;
  return {
    items,
    complete: doneCount === items.length,
    score: Math.round((doneCount / items.length) * 100),
  };
}
