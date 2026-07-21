export type ClaimedBusinessSummary = {
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  justClaimed: boolean;
};
