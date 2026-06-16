import {
  IconFacebook,
  IconGlobe,
  IconInstagram,
  IconLinkedin,
  IconTiktok,
  IconYoutube,
} from '@/components/Icons';

export function getSocialIcon(url: string) {
  if (url.includes('facebook')) return <IconFacebook size={20} />;
  if (url.includes('instagram')) return <IconInstagram size={20} />;
  if (url.includes('tiktok')) return <IconTiktok size={20} />;
  if (url.includes('linkedin')) return <IconLinkedin size={20} />;
  if (url.includes('youtube')) return <IconYoutube size={20} />;
  return <IconGlobe size={20} />;
}
