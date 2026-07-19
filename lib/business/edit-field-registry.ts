import type { ProfileHubId } from '@/lib/business/profile-progress';
import type { InlineFieldType } from '@/contexts/ProfileEditContext';
import type { BusinessProfile } from '@/types/business';

export interface EditFieldDefinition {
  fieldId: string;
  part: string;
  hub: ProfileHubId;
  label: string;
  type: InlineFieldType;
  placeholder?: string;
  getValue: (profile: Partial<BusinessProfile>) => string;
  patch: (profile: Partial<BusinessProfile>, value: string) => Partial<BusinessProfile>;
}

export const EDIT_FIELD_REGISTRY: Record<string, EditFieldDefinition> = {
  name: {
    fieldId: 'name',
    part: 'identity',
    hub: 'identity',
    label: 'Nombre del negocio',
    type: 'text',
    placeholder: 'Ej. Villa Chaco',
    getValue: (p) => p.name || '',
    patch: (p, v) => ({ ...p, name: v }),
  },
  username: {
    fieldId: 'username',
    part: 'identity',
    hub: 'identity',
    label: 'Nombre de usuario',
    type: 'text',
    placeholder: 'mi-negocio',
    getValue: (p) => p.slug || '',
    patch: (p, v) => ({ ...p, slug: v }),
  },
  location: {
    fieldId: 'location',
    part: 'contact',
    hub: 'trust',
    label: 'Ubicación / Dirección',
    type: 'text',
    placeholder: 'Ej. Echarate, La Convención, Cusco',
    getValue: (p) => p.contact_address || '',
    patch: (p, v) => ({ ...p, contact_address: v }),
  },
  tagline: {
    fieldId: 'tagline',
    part: 'identity',
    hub: 'identity',
    label: 'Eslogan',
    type: 'text',
    getValue: (p) => p.tagline || '',
    patch: (p, v) => ({ ...p, tagline: v }),
  },
  description: {
    fieldId: 'description',
    part: 'identity',
    hub: 'identity',
    label: 'Descripción',
    type: 'textarea',
    getValue: (p) => p.description || '',
    patch: (p, v) => ({ ...p, description: v }),
  },
  logo: {
    fieldId: 'logo_url',
    part: 'logo',
    hub: 'appearance',
    label: 'Logo',
    type: 'image',
    getValue: (p) => p.logo_url || '',
    patch: (p, v) => ({ ...p, logo_url: v }),
  },
  banner: {
    fieldId: 'banner_url',
    part: 'visual',
    hub: 'appearance',
    label: 'Banner',
    type: 'image',
    getValue: (p) => p.banner_url || '',
    patch: (p, v) => ({ ...p, banner_url: v }),
  },
  theme_color: {
    fieldId: 'theme_color',
    part: 'appearance',
    hub: 'appearance',
    label: 'Color de marca',
    type: 'color',
    getValue: (p) => p.theme_color || '#53acc5',
    patch: (p, v) => ({ ...p, theme_color: v }),
  },
  contact_whatsapp: {
    fieldId: 'contact_whatsapp',
    part: 'contact',
    hub: 'trust',
    label: 'WhatsApp',
    type: 'text',
    placeholder: '51999999999',
    getValue: (p) => p.contact_whatsapp || '',
    patch: (p, v) => ({ ...p, contact_whatsapp: v }),
  },
  contact_address: {
    fieldId: 'contact_address',
    part: 'contact',
    hub: 'trust',
    label: 'Dirección',
    type: 'text',
    getValue: (p) => p.contact_address || '',
    patch: (p, v) => ({ ...p, contact_address: v }),
  },
  contact_phone: {
    fieldId: 'contact_phone',
    part: 'contact',
    hub: 'trust',
    label: 'Teléfono',
    type: 'text',
    placeholder: '999999999',
    getValue: (p) => p.contact_phone || '',
    patch: (p, v) => ({ ...p, contact_phone: v }),
  },
  contact_email: {
    fieldId: 'contact_email',
    part: 'contact',
    hub: 'trust',
    label: 'Correo electrónico',
    type: 'text',
    placeholder: 'contacto@negocio.com',
    getValue: (p) => p.contact_email || '',
    patch: (p, v) => ({ ...p, contact_email: v }),
  },
  announcement_text: {
    fieldId: 'announcement_text',
    part: 'content',
    hub: 'content',
    label: 'Anuncio destacado',
    type: 'text',
    getValue: (p) => p.announcement_text || '',
    patch: (p, v) => ({ ...p, announcement_text: v }),
  },
};

export function getEditFieldByPart(part: string): EditFieldDefinition | undefined {
  return Object.values(EDIT_FIELD_REGISTRY).find((f) => f.part === part);
}

export function getEditFieldById(fieldId: string): EditFieldDefinition | undefined {
  return EDIT_FIELD_REGISTRY[fieldId] || Object.values(EDIT_FIELD_REGISTRY).find((f) => f.fieldId === fieldId);
}
