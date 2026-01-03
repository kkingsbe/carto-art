export interface PosterLocation {
    lat: number;
    lng: number;
}

export interface PosterCamera {
    pitch?: number;
    bearing?: number;
    zoom?: number;
}

export interface PosterText {
    title?: string;
    subtitle?: string;
    show_title?: boolean;
    show_subtitle?: boolean;
    show_coordinates?: boolean;
    position?: 'top' | 'bottom' | 'center';
    color?: string;
}

export interface PosterOptions {
    // Core Layers
    buildings_3d?: boolean;
    high_res?: boolean;
    streets?: boolean;
    water?: boolean;
    parks?: boolean;
    buildings?: boolean;
    labels?: boolean;
    background?: boolean;

    // Advanced Layers
    terrain?: boolean;
    terrain_under_water?: boolean;
    contours?: boolean;
    boundaries?: boolean;
    population?: boolean;
    pois?: boolean;
    marker?: boolean;

    // Landcover
    landcover_wood?: boolean;
    landcover_grass?: boolean;
    landcover_farmland?: boolean;
    landcover_ice?: boolean;

    // Landuse
    landuse_forest?: boolean;
    landuse_orchard?: boolean;
    landuse_vineyard?: boolean;
    landuse_cemetery?: boolean;
    landuse_grass?: boolean;
}

export interface CreatePosterRequest {
    location: PosterLocation;
    style?: string;
    camera?: PosterCamera;
    text?: PosterText;
    options?: PosterOptions;
}

export interface PosterResponse {
    id: string;
    status: string;
    download_url?: string;
    metadata?: {
        render_time_ms: number;
        file_size_bytes: number;
        dimensions: string;
    };
    error?: string;
    message?: string;
}

export interface StylePalette {
    id: string;
    name: string;
    colors: {
        background: string;
        text: string;
        primary: string;
    };
}

export interface Style {
    id: string;
    name: string;
    description: string;
    palettes: StylePalette[];
}

export interface ListStylesResponse {
    styles: Style[];
}
