'use client';

import type { BusinessProfile } from '@/types/business';
import BusinessProfileChatEditor from '@/components/business/builder/BusinessProfileChatEditor';
import ChatbotGuide from '@/components/business/ChatbotGuide';

interface UnifiedAssistantProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
  onFieldUpdate?: (field: keyof BusinessProfile, value: unknown) => void;
  isFirstTime?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onComplete?: () => void;
  embedded?: boolean;
}

export default function UnifiedAssistant({
  profile,
  onUpdate,
  onFieldUpdate,
  isFirstTime = false,
  isMinimized,
  onToggleMinimize,
  onComplete,
  embedded = true,
}: UnifiedAssistantProps) {
  const hasBasics = Boolean(profile.name && profile.contact_whatsapp && profile.slug);

  if (isFirstTime || !hasBasics) {
    if (!embedded && onToggleMinimize !== undefined) {
      return (
        <ChatbotGuide
          profile={profile}
          onUpdate={(field, value) => {
            onFieldUpdate?.(field, value);
            onUpdate({ [field]: value } as Partial<BusinessProfile>);
          }}
          onComplete={onComplete ?? (() => {})}
          isMinimized={isMinimized ?? false}
          onToggleMinimize={onToggleMinimize}
          hideTriggerButton
        />
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Guía rápida: completa nombre, WhatsApp y elige una plantilla para publicar en minutos.
        </p>
        <BusinessProfileChatEditor profile={profile} onUpdate={onUpdate} />
      </div>
    );
  }

  return <BusinessProfileChatEditor profile={profile} onUpdate={onUpdate} />;
}
