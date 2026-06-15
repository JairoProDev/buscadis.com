'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface FavoritosContextType {
    favoritosIds: Set<string>;
    isLoaded: boolean;
    isFavorite: (adisoId: string) => boolean;
    addFavorite: (adisoId: string) => Promise<void>;
    removeFavorite: (adisoId: string) => Promise<void>;
    toggleFavorite: (adisoId: string) => Promise<boolean>;
    loadFavorites: () => Promise<void>;
}

const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);

const GUEST_FAVORITES_KEY = 'guest_favorites';
const GUEST_MERGED_KEY = 'guest_favorites_merged';

function readGuestFavorites(): string[] {
    try {
        return JSON.parse(localStorage.getItem(GUEST_FAVORITES_KEY) || '[]');
    } catch {
        return [];
    }
}

function writeGuestFavorites(ids: string[]) {
    localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(ids));
}

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set());
    const [isLoaded, setIsLoaded] = useState(false);
    const mergeDoneRef = useRef(false);

    const loadFavorites = useCallback(async () => {
        if (!user?.id) return;

        try {
            if (!supabase) throw new Error('Supabase no está configurado');
            const { data, error } = await supabase
                .from('favoritos')
                .select('adiso_id')
                .eq('user_id', user.id);

            if (error) {
                if (error.message?.includes('406') || (error as { status?: number }).status === 406) {
                    setFavoritosIds(new Set());
                    setIsLoaded(true);
                    return;
                }
                throw error;
            }

            const ids = new Set((data || []).map((f: { adiso_id: string }) => f.adiso_id));
            setFavoritosIds(ids);
            setIsLoaded(true);
        } catch (error) {
            console.error('Error loading favorites:', error);
            setFavoritosIds(new Set());
            setIsLoaded(true);
        }
    }, [user?.id]);

    const mergeGuestFavorites = useCallback(async () => {
        if (!user?.id || !supabase || mergeDoneRef.current) return;
        const alreadyMerged = localStorage.getItem(GUEST_MERGED_KEY) === user.id;
        const guestIds = readGuestFavorites();
        if (alreadyMerged && guestIds.length === 0) {
            mergeDoneRef.current = true;
            return;
        }

        mergeDoneRef.current = true;

        if (guestIds.length > 0) {
            const rows = guestIds.map((adiso_id) => ({ user_id: user.id, adiso_id }));
            await supabase.from('favoritos').upsert(rows, { onConflict: 'user_id,adiso_id', ignoreDuplicates: true });
            localStorage.removeItem(GUEST_FAVORITES_KEY);
        }
        localStorage.setItem(GUEST_MERGED_KEY, user.id);
        await loadFavorites();
    }, [user?.id, loadFavorites]);

    // Guest: load from localStorage
    useEffect(() => {
        if (user?.id) return;
        setFavoritosIds(new Set(readGuestFavorites()));
        setIsLoaded(true);
        mergeDoneRef.current = false;
    }, [user?.id]);

    // Logged in: merge guest + load from Supabase
    useEffect(() => {
        if (!user?.id) return;
        setIsLoaded(false);
        mergeDoneRef.current = false;
        void mergeGuestFavorites();
    }, [user?.id, mergeGuestFavorites]);

    const isFavorite = useCallback((adisoId: string) => {
        return favoritosIds.has(adisoId);
    }, [favoritosIds]);

    const addFavorite = useCallback(async (adisoId: string) => {
        setFavoritosIds((prev) => new Set([...prev, adisoId]));

        if (user?.id) {
            try {
                if (!supabase) throw new Error('Supabase no está configurado');
                const { error } = await supabase
                    .from('favoritos')
                    .insert({ user_id: user.id, adiso_id: adisoId });

                if (error && error.code !== '23505') {
                    throw error;
                }
            } catch (error) {
                setFavoritosIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(adisoId);
                    return newSet;
                });
                throw error;
            }
        } else {
            setFavoritosIds((prev) => {
                const next = Array.from(new Set([...prev, adisoId]));
                writeGuestFavorites(next);
                return new Set(next);
            });
        }
    }, [user?.id]);

    const removeFavorite = useCallback(async (adisoId: string) => {
        setFavoritosIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(adisoId);
            return newSet;
        });

        if (user?.id) {
            try {
                if (!supabase) throw new Error('Supabase no está configurado');
                const { error } = await supabase
                    .from('favoritos')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('adiso_id', adisoId);

                if (error) throw error;
            } catch (error) {
                setFavoritosIds((prev) => new Set([...prev, adisoId]));
                throw error;
            }
        } else {
            setFavoritosIds((prev) => {
                const next = Array.from(prev).filter((id) => id !== adisoId);
                writeGuestFavorites(next);
                return new Set(next);
            });
        }
    }, [user?.id]);

    const toggleFavorite = useCallback(async (adisoId: string): Promise<boolean> => {
        const wasFavorite = favoritosIds.has(adisoId);

        if (wasFavorite) {
            await removeFavorite(adisoId);
            return false;
        } else {
            await addFavorite(adisoId);
            return true;
        }
    }, [favoritosIds, addFavorite, removeFavorite]);

    return (
        <FavoritosContext.Provider
            value={{
                favoritosIds,
                isLoaded,
                isFavorite,
                addFavorite,
                removeFavorite,
                toggleFavorite,
                loadFavorites
            }}
        >
            {children}
        </FavoritosContext.Provider>
    );
}

export function useFavoritos() {
    const context = useContext(FavoritosContext);
    if (!context) {
        throw new Error('useFavoritos must be used within FavoritosProvider');
    }
    return context;
}
