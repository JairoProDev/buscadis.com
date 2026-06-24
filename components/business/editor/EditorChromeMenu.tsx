'use client';

import { useRouter } from 'next/navigation';
import type { BusinessWithRole } from '@/lib/business-access';
import type { BusinessProfile } from '@/types/business';
import ProfileChromeMenu, { type ProfileMenuItem } from '@/components/profile/ProfileChromeMenu';
import BusinessSwitcher from '@/components/business/BusinessSwitcher';

interface EditorChromeMenuProps {
  businesses: BusinessWithRole[];
  currentBusinessId?: string;
  profile: Partial<BusinessProfile>;
  onCloseEditor: () => void;
  onPublish: () => void;
  onToggleVacation?: () => void;
  /** En móvil el switcher va dentro del menú para evitar saturar la barra */
  mobile?: boolean;
}

export default function EditorChromeMenu({
  businesses,
  currentBusinessId,
  profile,
  onCloseEditor,
  onPublish,
  onToggleVacation,
  mobile = false,
}: EditorChromeMenuProps) {
  const router = useRouter();

  const items: ProfileMenuItem[] = [
    {
      id: 'publish',
      label: profile.is_published ? 'Despublicar página' : 'Publicar página',
      onClick: onPublish,
      hidden: true,
    },
    {
      id: 'vacation',
      label: profile.is_vacation_mode ? 'Desactivar modo vacaciones' : 'Modo vacaciones',
      onClick: onToggleVacation,
      hidden: !onToggleVacation,
    },
    {
      id: 'team',
      label: 'Equipo',
      href: currentBusinessId ? `/mi-negocio/equipo?business=${currentBusinessId}` : '/mi-negocio/equipo',
      hidden: !currentBusinessId,
    },
    {
      id: 'new',
      label: '+ Crear nuevo negocio',
      onClick: () => router.push('/mi-negocio?new=1'),
    },
    {
      id: 'help',
      label: 'Centro de ayuda',
      href: '/ayuda',
    },
    {
      id: 'close',
      label: 'Cerrar editor',
      onClick: onCloseEditor,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {!mobile && businesses.length > 0 && currentBusinessId && (
        <BusinessSwitcher
          businesses={businesses}
          currentBusinessId={currentBusinessId}
          compact
          hideActions
          combobox
        />
      )}
      <ProfileChromeMenu
        items={items}
        buttonClassName="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
        header={
          mobile && businesses.length > 0 && currentBusinessId ? (
            <div className="px-3 py-2 border-b border-slate-100">
              <BusinessSwitcher
                businesses={businesses}
                currentBusinessId={currentBusinessId}
                hideActions
                combobox
                className="w-full [&_select]:max-w-none [&_select]:w-full"
              />
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
