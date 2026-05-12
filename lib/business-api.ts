/**
 * Client-side helper to call the /api/business/publish API route.
 * Uses the service role key on the server side to bypass RLS.
 */
import { supabase } from './supabase';
import { BusinessProfile } from '@/types/business';

async function getAuthToken(): Promise<string | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
}

/**
 * Publish or unpublish a business profile via the server API.
 * Bypasses Supabase RLS using the service role key.
 */
export async function publishBusinessViaAPI(
    businessId: string,
    is_published: boolean
): Promise<BusinessProfile> {
    const token = await getAuthToken();
    if (!token) throw new Error('Debes iniciar sesión');

    const res = await fetch('/api/business/publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId, is_published }),
    });

    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.error || `Error ${res.status}`);
    }
    return json.profile as BusinessProfile;
}

/**
 * Save (update) any fields of a business profile via the server API.
 * Bypasses Supabase RLS using the service role key.
 */
export async function saveBusinessViaAPI(
    businessId: string,
    updates: Partial<BusinessProfile>
): Promise<BusinessProfile> {
    const token = await getAuthToken();
    if (!token) throw new Error('Debes iniciar sesión');

    const res = await fetch('/api/business/publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId, updates }),
    });

    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.error || `Error ${res.status}`);
    }
    return json.profile as BusinessProfile;
}

/**
 * Load the business profile for the current user via the server API.
 * Returns null if not found.
 */
export async function getMyBusinessViaAPI(): Promise<BusinessProfile | null> {
    const token = await getAuthToken();
    if (!token) return null;

    const res = await fetch('/api/business/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.profile ?? null;
}
