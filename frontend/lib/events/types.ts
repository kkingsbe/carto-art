
export type EventType =
    | 'signup'
    | 'map_create'
    | 'map_publish'
    | 'poster_export'
    | 'key_generate'
    | 'page_view'
    | 'click'
    | 'api_call'
    | 'search_location'
    | 'style_change'
    | 'layer_toggle'
    | 'interaction'
    | 'format_change'
    | 'palette_change'
    | 'marker_add'
    // Retention & Funnel Events
    | 'editor_open'
    | 'editor_abandon'
    | 'export_start'
    | 'export_fail'
    | 'export_abandon'
    | 'paywall_shown'
    | 'paywall_cta_clicked'
    | 'login_wall_shown'
    | 'session_heartbeat'
    | 'scroll_depth'
    | 'return_visit'
    | 'notification_click'
    | 'changelog_view'
    | 'changelog_close'
    // Ecommerce Funnel Events
    | 'shop_transition_start'
    | 'shop_transition_success'
    | 'shop_transition_error'
    | 'gallery_view'
    | 'gallery_map_click'
    | 'gallery_remix_click'
    | 'store_view'
    | 'product_view'
    | 'product_view_error'
    | 'checkout_start'
    | 'checkout_variant_select'
    | 'checkout_step_complete'
    | 'checkout_abandon'
    | 'purchase_complete'
    // Export Modal Events
    | 'export_modal_view'
    | 'export_modal_dismiss'
    | 'export_modal_donate_click'
    | 'export_modal_share_click'
    | 'export_modal_save_click'
    | 'export_modal_publish_click'
    // Upgrade Nudge Events
    | 'upgrade_nudge_shown'
    | 'upgrade_nudge_clicked';

export interface TrackEventParams {
    eventType: EventType;
    eventName?: string;
    userId?: string;
    sessionId?: string;
    pageUrl?: string;
    metadata?: any;
}
