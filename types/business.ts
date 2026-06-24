export type LocationDisplayLevel =
    | 'address'
    | 'district'
    | 'city'
    | 'region'
    | 'country';

export interface StoryHighlight {
    id: string;
    title: string;
    cover_url?: string;
    link_url?: string;
}

export interface BannerConfig {
    mode: 'image' | 'text' | 'canvas';
    imageUrl?: string;
    text?: {
        content: string;
        font?: string;
        color?: string;
        align?: 'left' | 'center' | 'right';
        size?: 'sm' | 'md' | 'lg' | 'xl';
    };
    fadeBottom?: boolean;
    cta?: {
        label: string;
        action: 'whatsapp' | 'link' | 'cart' | 'contact';
        href?: string;
        style?: 'solid' | 'outline' | 'ghost';
    };
}

export interface ProfileLayoutSchema {
    structureTemplateId: string;
    styleSkinId: string;
    background?: { type: 'color' | 'gradient' | 'image'; value: string };
    slots: Array<{
        id: string;
        component: string;
        visible: boolean;
        order: number;
        variant?: string;
        config?: Record<string, unknown>;
    }>;
}

export interface ProfileStyleSchema {
    skinId: string;
    overrides?: Record<string, Record<string, unknown>>;
}

export interface MetricsConfig {
    keys: Array<'interactions' | 'sales' | 'clients' | 'followers' | 'content_count' | 'reviews' | 'views' | 'products'>;
}

export interface SocialLink {
    network: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'custom';
    url: string;
    label?: string;
}

export interface BusinessHours {
    [day: string]: {
        open: string;
        close: string;
        closed: boolean;
    };
}

export interface CustomBlock {
    id: string;
    type: 'link' | 'image' | 'video' | 'text' | 'hero';
    label?: string;
    content?: string; // URL or text
    sublabel?: string;
    icon?: string;
    style?: 'default' | 'outline' | 'filled';
    size?: 'small' | 'medium' | 'large' | 'full'; // For Bento grid
}

export type ProfileBlockType =
    | 'hero'
    | 'highlights'
    | 'catalog'
    | 'deals'
    | 'links'
    | 'reviews'
    | 'map'
    | 'cta'
    | 'text'
    | 'embed'
    | 'timeline'
    | 'portfolio'
    | 'case_study'
    | 'faq'
    | 'team';

export interface ProfileBlock {
    id: string;
    type: ProfileBlockType;
    visible: boolean;
    config: Record<string, unknown>;
}

export type ProfileThemePreset = 'executive' | 'minimal' | 'organic' | 'cyberpunk';

export type PageTemplateId =
    | 'modern_tabs'
    | 'bento_scroll'
    | 'minimal_scroll'
    | 'vibrant_tabs'
    | 'pack_ferreteria'
    | 'pack_restaurante'
    | 'pack_belleza'
    | 'pack_servicios';

export interface BusinessReview {
    id: string;
    business_profile_id: string;
    user_id: string;
    rating: number;
    text?: string;
    verified_purchase?: boolean;
    created_at: string;
    updated_at?: string;
}

export interface BusinessReviewAggregate {
    business_profile_id: string;
    avg_rating: number;
    review_count: number;
    updated_at?: string;
}

export interface BusinessProfile {
    id: string;
    /** Creator / legacy primary account; team access is in business_members */
    user_id: string;
    created_by?: string;
    slug: string;
    name: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    tagline?: string;

    theme_color: string;
    /** Color secundario / acento de marca (ej. amarillo Buscadis) */
    theme_accent_color?: string;
    theme_mode: 'light' | 'dark' | 'system';
    layout_style: 'standard' | 'bento' | 'minimal';

    contact_email?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
    contact_address?: string;
    contact_maps_url?: string;

    business_hours: BusinessHours;
    social_links: SocialLink[];
    custom_blocks: CustomBlock[];
    profile_blocks?: ProfileBlock[];
    template_id?: PageTemplateId | string;
    theme_preset?: ProfileThemePreset;
    template_applied_at?: string;

    // SEO
    meta_title?: string;
    meta_description?: string;
    og_image_url?: string;

    // New features fields
    announcement_text?: string;
    announcement_active?: boolean;
    is_verified?: boolean;
    /** none | basic | identity | business | premium */
    verification_tier?: 'none' | 'basic' | 'identity' | 'business' | 'premium';
    pixel_facebook?: string;
    pixel_tiktok?: string;
    is_vacation_mode?: boolean;
    custom_domain?: string;
    show_contact_form?: boolean;
    favicon_url?: string;
    font_family?: string;

    is_published: boolean;
    view_count: number;

    /** free | pro | enterprise — feature gating (billing en fase posterior) */
    subscription_tier?: 'free' | 'pro' | 'enterprise';

    /** Email reserved for automatic ownership on signup (ADIS pre-provisioned pages). */
    pending_owner_email?: string | null;

    profile_layout?: ProfileLayoutSchema | null;
    profile_style?: ProfileStyleSchema | null;
    banner_config?: BannerConfig | null;
    metrics_config?: MetricsConfig | null;
    story_highlights?: StoryHighlight[];
    profile_hashtags?: string[];
    location_display_level?: LocationDisplayLevel;

    created_at: string;
    updated_at: string;
}

export interface BusinessProfileFormData extends Omit<BusinessProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'view_count'> {
    // Form specific fields if any
}
