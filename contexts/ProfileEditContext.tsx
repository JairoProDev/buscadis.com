'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { BusinessProfile } from '@/types/business';
import type { ProfileHubId } from '@/lib/business/profile-progress';
import type { Adiso } from '@/types';

export type EditSurface = 'panel' | 'direct';

export type InlineFieldType = 'text' | 'textarea' | 'image' | 'color';

export interface InlineFieldState {
  fieldId: string;
  title: string;
  type: InlineFieldType;
  value: string;
  hub: ProfileHubId;
  onSave: (value: string) => void;
}

/** Rich inline editor for complex fields (links, hours, CTA, categories). */
export interface InlineEditorState {
  editorId: string;
  title: string;
  render: (close: () => void) => React.ReactNode;
}

interface ProfileEditContextValue {
  editSurface: EditSurface;
  setEditSurface: (surface: EditSurface) => void;
  activeHub: ProfileHubId | null;
  setActiveHub: (hub: ProfileHubId | null) => void;
  activeFieldId: string | null;
  setActiveFieldId: (fieldId: string | null) => void;
  inlineField: InlineFieldState | null;
  openInlineField: (field: InlineFieldState) => void;
  closeInlineField: () => void;
  inlineEditor: InlineEditorState | null;
  openInlineEditor: (editor: InlineEditorState) => void;
  closeInlineEditor: () => void;
  openHubForPart: (part: string) => void;
  editingProduct: unknown | null;
  openProductEditor: (product: unknown | 'new') => void;
  closeProductEditor: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  showEditOnboarding: boolean;
  dismissEditOnboarding: () => void;
}

const STORAGE_KEY = 'buscadis.editSurface';
const ONBOARDING_KEY = 'buscadis.editOnboardingSeen';

const ProfileEditContext = createContext<ProfileEditContextValue | null>(null);

function readStoredSurface(): EditSurface {
  if (typeof window === 'undefined') return 'panel';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'direct' || stored === 'panel') return stored;
  return window.matchMedia('(max-width: 1023px)').matches ? 'direct' : 'panel';
}

export function ProfileEditProvider({
  children,
  isEditing,
  initialHub = 'identity',
  onHubChange,
  onEditPart,
}: {
  children: React.ReactNode;
  isEditing: boolean;
  initialHub?: ProfileHubId;
  onHubChange?: (hub: ProfileHubId) => void;
  onEditPart?: (part: string) => void;
}) {
  const [editSurface, setEditSurfaceState] = useState<EditSurface>('panel');
  const [activeHub, setActiveHubState] = useState<ProfileHubId | null>(initialHub);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [inlineField, setInlineField] = useState<InlineFieldState | null>(null);
  const [inlineEditor, setInlineEditor] = useState<InlineEditorState | null>(null);
  const [editingProduct, setEditingProduct] = useState<unknown | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showEditOnboarding, setShowEditOnboarding] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    setEditSurfaceState(readStoredSurface());
    setSidebarCollapsed(readStoredSurface() === 'direct');
    if (typeof window !== 'undefined' && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowEditOnboarding(true);
    }
  }, [isEditing]);

  const setEditSurface = useCallback((surface: EditSurface) => {
    setEditSurfaceState(surface);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, surface);
    }
    setSidebarCollapsed(surface === 'direct');
    if (surface === 'panel') {
      setInlineField(null);
      setInlineEditor(null);
    }
  }, []);

  const setActiveHub = useCallback(
    (hub: ProfileHubId | null) => {
      setActiveHubState(hub);
      if (hub) onHubChange?.(hub);
    },
    [onHubChange]
  );

  const openInlineField = useCallback((field: InlineFieldState) => {
    setInlineEditor(null);
    setInlineField(field);
    setActiveFieldId(field.fieldId);
    setActiveHubState(field.hub);
    onHubChange?.(field.hub);
  }, [onHubChange]);

  const closeInlineField = useCallback(() => {
    setInlineField(null);
    setActiveFieldId(null);
  }, []);

  const openInlineEditor = useCallback((editor: InlineEditorState) => {
    setInlineField(null);
    setInlineEditor(editor);
  }, []);

  const closeInlineEditor = useCallback(() => {
    setInlineEditor(null);
  }, []);

  const openHubForPart = useCallback(
    (part: string) => {
      onEditPart?.(part);
    },
    [onEditPart]
  );

  const openProductEditor = useCallback((product: unknown | 'new') => {
    setEditingProduct(product);
    setInlineField(null);
  }, []);

  const closeProductEditor = useCallback(() => {
    setEditingProduct(null);
  }, []);

  const dismissEditOnboarding = useCallback(() => {
    setShowEditOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, '1');
    }
  }, []);

  const value = useMemo(
    () => ({
      editSurface,
      setEditSurface,
      activeHub,
      setActiveHub,
      activeFieldId,
      setActiveFieldId,
      inlineField,
      openInlineField,
      closeInlineField,
      inlineEditor,
      openInlineEditor,
      closeInlineEditor,
      openHubForPart,
      editingProduct,
      openProductEditor,
      closeProductEditor,
      sidebarCollapsed,
      setSidebarCollapsed,
      showEditOnboarding,
      dismissEditOnboarding,
    }),
    [
      editSurface,
      setEditSurface,
      activeHub,
      setActiveHub,
      activeFieldId,
      inlineField,
      openInlineField,
      closeInlineField,
      inlineEditor,
      openInlineEditor,
      closeInlineEditor,
      openHubForPart,
      editingProduct,
      openProductEditor,
      closeProductEditor,
      sidebarCollapsed,
      showEditOnboarding,
      dismissEditOnboarding,
    ]
  );

  return <ProfileEditContext.Provider value={value}>{children}</ProfileEditContext.Provider>;
}

export function useProfileEdit() {
  const ctx = useContext(ProfileEditContext);
  return ctx;
}

export function useProfileEditRequired() {
  const ctx = useProfileEdit();
  if (!ctx) throw new Error('useProfileEditRequired must be used within ProfileEditProvider');
  return ctx;
}

/** Patch helper for inline field saves */
export function patchProfileField(
  profile: Partial<BusinessProfile>,
  fieldId: string,
  value: string
): Partial<BusinessProfile> {
  switch (fieldId) {
    case 'name':
      return { ...profile, name: value };
    case 'tagline':
      return { ...profile, tagline: value };
    case 'description':
      return { ...profile, description: value };
    case 'logo_url':
      return { ...profile, logo_url: value };
    case 'banner_url':
      return { ...profile, banner_url: value };
    case 'theme_color':
      return { ...profile, theme_color: value };
    case 'contact_whatsapp':
      return { ...profile, contact_whatsapp: value };
    case 'contact_address':
      return { ...profile, contact_address: value };
    case 'announcement_text':
      return { ...profile, announcement_text: value };
    default:
      return profile;
  }
}

export type { Adiso };
