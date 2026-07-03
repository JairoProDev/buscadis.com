'use client';

/**
 * @deprecated Use PublishStudio or PublishStudioShell instead.
 * Thin wrapper for backwards compatibility.
 */
import PublishStudio from './PublishStudio';

interface PublishChatWizardProps {
  compact?: boolean;
  initialText?: string;
  initialImageUrl?: string | null;
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onPublished?: () => void;
}

export default function PublishChatWizard(props: PublishChatWizardProps) {
  return <PublishStudio {...props} compact={props.compact} />;
}
