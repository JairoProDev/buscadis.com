'use client';

import { useEffect } from 'react';
import { captureReferralFromUrl } from '@/lib/auth/referral-capture';

/** Captures ?ref= on any page load for later attribution at signup/onboarding. */
export default function ReferralCapture() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);
  return null;
}
