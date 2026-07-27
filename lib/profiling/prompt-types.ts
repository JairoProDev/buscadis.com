export const PROFILE_PROMPT_IDS = [
  'whatsapp',
  'demographics',
  'dni_soft',
  'intents',
] as const;

export type ProfilePromptId = (typeof PROFILE_PROMPT_IDS)[number];

export type ProfilePromptStatus = 'pending' | 'dismissed' | 'completed';

export type ProfilePromptRow = {
  prompt_id: ProfilePromptId;
  status: ProfilePromptStatus;
  dismissed_until: string | null;
  completed_at: string | null;
};

/** Hours after X before the same prompt can show again. */
export const PROMPT_DISMISS_COOLDOWN_HOURS = 48;

export type PromptDefinition = {
  id: ProfilePromptId;
  priority: number;
  title: string;
  subtitle: string;
  cta: string;
};

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  {
    id: 'whatsapp',
    priority: 1,
    title: 'Una cosa para afinar tu Buscadis',
    subtitle:
      'Con tu WhatsApp te avisamos cuando aparezca algo que te interesa. La mayoría lo revisa más que el correo.',
    cta: 'Guardar WhatsApp',
  },
  {
    id: 'demographics',
    priority: 2,
    title: 'Personaliza tu experiencia',
    subtitle:
      'Google no comparte edad ni género. Tú los confirmas para ver oportunidades más relevantes.',
    cta: 'Continuar',
  },
  {
    id: 'dni_soft',
    priority: 3,
    title: 'Verifica tu identidad',
    subtitle:
      'Pedimos tu DNI para evitar fraudes y mejorar los matches. Es por tu seguridad y la de la comunidad.',
    cta: 'Confirmar, soy yo',
  },
  {
    id: 'intents',
    priority: 4,
    title: '¿Qué te interesa en Buscadis?',
    subtitle: 'Elige lo que quieres hacer. Puedes cambiarlo después en tu perfil.',
    cta: 'Guardar preferencias',
  },
];
