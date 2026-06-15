import { Profile } from '@/types';

export interface ProfileSocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
}

export interface ProfileTask {
  id: string;
  label: string;
  hint: string;
  points: number;
  done: boolean;
  section: 'photo' | 'personal' | 'contact' | 'bio' | 'location' | 'social' | 'verify';
}

export interface ProfileCompletionResult {
  percent: number;
  points: number;
  maxPoints: number;
  tasks: ProfileTask[];
  level: 'nuevo' | 'en_camino' | 'casi_listo' | 'completo';
  levelLabel: string;
}

const TASK_DEFS: Omit<ProfileTask, 'done'>[] = [
  { id: 'avatar', label: 'Foto de perfil', hint: 'Genera más confianza al contactar', points: 20, section: 'photo' },
  { id: 'name', label: 'Nombre completo', hint: 'Cómo te verán otros usuarios', points: 15, section: 'personal' },
  { id: 'phone', label: 'WhatsApp / teléfono', hint: 'Para que te contacten rápido', points: 20, section: 'contact' },
  { id: 'bio', label: 'Bio corta', hint: 'Cuéntales quién eres en una línea', points: 10, section: 'bio' },
  { id: 'location', label: 'Ubicación', hint: 'Ofertas cerca de ti', points: 15, section: 'location' },
  { id: 'social', label: 'Red social', hint: 'Instagram, Facebook o TikTok', points: 10, section: 'social' },
  { id: 'website', label: 'Sitio web', hint: 'Opcional: tu página o portafolio', points: 5, section: 'social' },
  { id: 'verified', label: 'Cuenta verificada', hint: 'Más visibilidad al publicar', points: 15, section: 'verify' },
];

export function parseSocialFromMetadata(
  metadata?: Record<string, unknown> | null
): ProfileSocialLinks {
  const social = (metadata?.social as ProfileSocialLinks) || {};
  return {
    instagram: social.instagram || '',
    facebook: social.facebook || '',
    tiktok: social.tiktok || '',
    whatsapp: social.whatsapp || '',
  };
}

export function computeProfileCompletion(
  profile: Profile | null | undefined,
  social: ProfileSocialLinks,
  emailConfirmed?: boolean
): ProfileCompletionResult {
  const hasSocial =
    !!(social.instagram?.trim() || social.facebook?.trim() || social.tiktok?.trim());

  const checks: Record<string, boolean> = {
    avatar: !!profile?.avatar_url,
    name: !!(profile?.nombre?.trim() && profile?.apellido?.trim()),
    phone: !!(profile?.telefono?.trim() || social.whatsapp?.trim()),
    bio: !!(profile?.bio?.trim() && profile.bio.trim().length >= 10),
    location: !!(profile?.ubicacion?.trim() || (profile?.latitud && profile?.longitud)),
    social: hasSocial,
    website: !!profile?.website?.trim(),
    verified: !!profile?.es_verificado || !!emailConfirmed,
  };

  const tasks: ProfileTask[] = TASK_DEFS.map((t) => ({
    ...t,
    done: checks[t.id] ?? false,
  }));

  const maxPoints = tasks.reduce((s, t) => s + t.points, 0);
  const points = tasks.filter((t) => t.done).reduce((s, t) => s + t.points, 0);
  const percent = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;

  let level: ProfileCompletionResult['level'] = 'nuevo';
  let levelLabel = 'Perfil nuevo';
  if (percent >= 100) {
    level = 'completo';
    levelLabel = 'Perfil completo';
  } else if (percent >= 70) {
    level = 'casi_listo';
    levelLabel = 'Casi listo';
  } else if (percent >= 35) {
    level = 'en_camino';
    levelLabel = 'En camino';
  }

  return { percent, points, maxPoints, tasks, level, levelLabel };
}
