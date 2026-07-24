export type CapabilityKey = 'publish' | 'business' | 'rider' | 'influencer';
export type CapabilityStatus = 'inactive' | 'pending' | 'active' | 'suspended';

export type UserCapabilityRow = {
  user_id: string;
  capability: CapabilityKey;
  status: CapabilityStatus;
  activated_at: string | null;
  meta: Record<string, unknown>;
};
