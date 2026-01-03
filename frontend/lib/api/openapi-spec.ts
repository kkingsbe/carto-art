import { SITE_URL } from '@/lib/utils/env';

export const openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Carto-Art Developer API',
        version: '1.0.0',
        description: 'Programmatically generate beautiful map posters and access cartographic data.',
        contact: {
            name: 'Carto-Art Support',
            email: 'support@cartoart.net'
        }
    },
    servers: [
        {
            url: `${SITE_URL}/api/v1`,
            description: 'API Server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'API Key'
            }
        },
        schemas: {
            PosterConfig: {
                type: 'object',
                properties: {
                    location: {
                        type: 'object',
                        properties: {
                            center: {
                                type: 'array',
                                items: { type: 'number' },
                                minItems: 2,
                                maxItems: 2,
                                example: [-74.006, 40.7128]
                            },
                            zoom: { type: 'number', example: 12 },
                            name: { type: 'string', example: 'New York' },
                            city: { type: 'string', example: 'United States' }
                        }
                    },
                    style: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'minimal' }
                        }
                    },
                    palette: {
                        type: 'object',
                        properties: {
                            background: { type: 'string', example: '#000000' },
                            text: { type: 'string', example: '#ffffff' },
                            border: { type: 'string', example: '#333333' },
                            water: { type: 'string', example: '#0000ff' },
                            greenSpace: { type: 'string', example: '#00ff00' },
                            buildings: { type: 'string', example: '#555555' },
                            roads: {
                                type: 'object',
                                properties: {
                                    motorway: { type: 'string', example: '#ff0000' },
                                    trunk: { type: 'string', example: '#ff5555' },
                                    primary: { type: 'string', example: '#ffaa00' },
                                    secondary: { type: 'string', example: '#ffff00' },
                                    tertiary: { type: 'string', example: '#aaff00' },
                                    residential: { type: 'string', example: '#ffffff' },
                                    service: { type: 'string', example: '#cccccc' }
                                }
                            }
                        }
                    },
                    format: {
                        type: 'object',
                        properties: {
                            orientation: { type: 'string', enum: ['portrait', 'landscape'], example: 'portrait' },
                            aspectRatio: { type: 'string', example: '2:3' }
                        }
                    },
                    layers: {
                        type: 'object',
                        description: 'Layer visibility and configuration options',
                        properties: {
                            buildings3D: { type: 'boolean', description: 'Enable 3D building extrusions', example: true },
                            buildings3DPitch: {
                                type: 'number',
                                description: 'Camera pitch/tilt angle in degrees (0 = top-down, 60 = near-horizon)',
                                minimum: 0,
                                maximum: 60,
                                example: 45
                            },
                            buildings3DBearing: {
                                type: 'number',
                                description: 'Camera bearing/azimuth rotation in degrees (0 = north, 90 = east)',
                                minimum: 0,
                                maximum: 360,
                                example: 45
                            },
                            buildings3DHeightScale: {
                                type: 'number',
                                description: 'Height exaggeration multiplier (0.5 = half height, 3 = triple height)',
                                minimum: 0.5,
                                maximum: 3,
                                example: 1
                            }
                        }
                    },
                    rendering: {
                        type: 'object',
                        description: 'Rendering quality settings',
                        properties: {
                            overzoom: {
                                type: 'integer',
                                enum: [1, 2],
                                description: 'Overzoom factor for high-resolution tile detail (1 = standard, 2 = high detail)',
                                example: 1
                            }
                        }
                    }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                    details: { type: 'object' }
                }
            }
        }
    },
    security: [
        { bearerAuth: [] }
    ],
    paths: {
        '/posters/generate': {
            post: {
                summary: 'Generate a Map Poster',
                description: 'Synchronously renders a high-resolution map poster based on the provided configuration.',
                tags: ['Posters'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    location: {
                                        type: 'object',
                                        required: ['lat', 'lng'],
                                        properties: {
                                            lat: { type: 'number', example: 40.7128 },
                                            lng: { type: 'number', example: -74.0060 }
                                        }
                                    },
                                    style: { type: 'string', example: 'blueprint', default: 'minimal' },
                                    camera: {
                                        type: 'object',
                                        properties: {
                                            pitch: { type: 'number', minimum: 0, maximum: 60, default: 0 },
                                            bearing: { type: 'number', minimum: 0, maximum: 360, default: 0 },
                                            zoom: { type: 'number', minimum: 0, maximum: 20, default: 12 }
                                        }
                                    },
                                    text: {
                                        type: 'object',
                                        properties: {
                                            title: { type: 'string', example: 'New York' },
                                            subtitle: { type: 'string', example: 'United States' },
                                            show_title: { type: 'boolean', default: true },
                                            show_subtitle: { type: 'boolean', default: true },
                                            show_coordinates: { type: 'boolean', default: true },
                                            position: { type: 'string', enum: ['top', 'bottom', 'center'], default: 'bottom' },
                                            color: { type: 'string', example: '#000000' }
                                        }
                                    },
                                    options: {
                                        type: 'object',
                                        properties: {
                                            // Core
                                            buildings_3d: { type: 'boolean', default: false },
                                            high_res: { type: 'boolean', default: false },
                                            streets: { type: 'boolean', default: true },
                                            water: { type: 'boolean', default: true },
                                            parks: { type: 'boolean', default: true },
                                            buildings: { type: 'boolean', default: true },
                                            labels: { type: 'boolean', default: true },
                                            background: { type: 'boolean', default: true },

                                            // Advanced
                                            terrain: { type: 'boolean', default: false },
                                            terrain_under_water: { type: 'boolean', default: false },
                                            contours: { type: 'boolean', default: false },
                                            boundaries: { type: 'boolean', default: false },
                                            population: { type: 'boolean', default: false },
                                            pois: { type: 'boolean', default: false },
                                            marker: { type: 'boolean', default: false },

                                            // Landcover/Landuse
                                            landcover_wood: { type: 'boolean', default: false },
                                            landcover_grass: { type: 'boolean', default: false },
                                            landuse_forest: { type: 'boolean', default: false }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Poster generated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        status: { type: 'string', example: 'completed' },
                                        download_url: { type: 'string', example: 'https://example.com/storage/posters/poster-id.png' },
                                        metadata: { type: 'object' }
                                    }
                                }
                            },
                            'image/png': {
                                schema: {
                                    type: 'string',
                                    format: 'binary'
                                }
                            }
                        }
                    },
                    '400': { description: 'Invalid configuration', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                    '401': { description: 'Unauthorized' },
                    '500': { description: 'Rendering failed' }
                }
            }
        },
        '/styles': {
            get: {
                summary: 'List available styles',
                tags: ['Styles'],
                security: [], // Public
                responses: {
                    '200': {
                        description: 'List of styles',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        styles: { type: 'array', items: { type: 'object' } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
