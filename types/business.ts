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
    | 'embed';

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
    pixel_facebook?: string;
    pixel_tiktok?: string;
    is_vacation_mode?: boolean;
    custom_domain?: string;
    show_contact_form?: boolean;
    favicon_url?: string;
    font_family?: string;

    is_published: boolean;
    view_count: number;

    /** Email reserved for automatic ownership on signup (ADIS pre-provisioned pages). */
    pending_owner_email?: string | null;

    created_at: string;
    updated_at: string;
}

export interface BusinessProfileFormData extends Omit<BusinessProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'view_count'> {
    // Form specific fields if any
}
