import type { ProfileEntity } from '../types/entity';
import type { ProfileLayoutSchema } from '../types/layout';
import type { ProfileStyleSchema } from '../types/style';
import type { BannerConfig } from '../types/banner';
import { mergeProfileLayout, getVisibleSlots } from './merge-layout';
import { mergeProfileStyle, skinToCssVars } from './merge-style';

export interface ProfilePresentation {
  entity: ProfileEntity;
  layout: ProfileLayoutSchema;
  style: ReturnType<typeof mergeProfileStyle>;
  banner: BannerConfig;
  cssVars: Record<string, string>;
  visibleSlots: ReturnType<typeof getVisibleSlots>;
}

export function resolveBannerConfig(
  banner?: BannerConfig | null,
  entity?: ProfileEntity
): BannerConfig {
  if (banner?.mode) {
    return {
      fadeBottom: false,
      ...banner,
      imageUrl: banner.imageUrl || entity?.bannerImageUrl,
    };
  }
  if (entity?.bannerImageUrl) {
    return { mode: 'image', imageUrl: entity.bannerImageUrl, fadeBottom: false };
  }
  if (entity?.tagline) {
    return {
      mode: 'text',
      text: { content: entity.tagline, align: 'center', size: 'lg' },
      fadeBottom: true,
    };
  }
  return { mode: 'text', text: { content: entity?.displayName || '', align: 'center', size: 'xl' }, fadeBottom: true };
}

export function resolveProfilePresentation(
  entity: ProfileEntity,
  layoutInput?: ProfileLayoutSchema | null,
  styleInput?: ProfileStyleSchema | null,
  bannerInput?: BannerConfig | null
): ProfilePresentation {
  const layout = mergeProfileLayout(layoutInput);
  const style = mergeProfileStyle(styleInput, layout.styleSkinId);
  const banner = resolveBannerConfig(bannerInput, entity);
  return {
    entity,
    layout,
    style,
    banner,
    cssVars: skinToCssVars(style.skin),
    visibleSlots: getVisibleSlots(layout),
  };
}
