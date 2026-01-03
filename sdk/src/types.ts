export interface PosterLocation {
    lat: number;
    lng: number;
}

export interface PosterCamera {
    pitch?: number;
    bearing?: number;
    zoom?: number;
}

export interface PosterOptions {
    buildings_3d?: boolean;
    high_res?: boolean;
    streets?: boolean;
    water?: boolean;
    parks?: boolean;
    buildings?: boolean;
    labels?: boolean;
    background?: boolean;
}

export interface CreatePosterRequest {
    location: PosterLocation;
    style?: string;
    camera?: PosterCamera;
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
