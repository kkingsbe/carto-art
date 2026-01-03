# CartoArt SDK

Official TypeScript/JavaScript SDK for the CartoArt Developer API. Generate beautiful, customizable map posters programmatically.

[![npm version](https://img.shields.io/npm/v/@kkingsbe/cartoart.svg)](https://www.npmjs.com/package/@kkingsbe/cartoart)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🗺️ **Generate Custom Map Posters** - Create high-quality map artwork for any location
- 🎨 **Multiple Styles** - Choose from various artistic styles and color palettes
- 📐 **Flexible Configuration** - Control camera angles, zoom levels, and map layers
- 🔒 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- ⚡ **Simple API** - Clean, intuitive interface for quick integration
- 🌐 **Production Ready** - Built for reliability and performance

## Installation

```bash
npm install @kkingsbe/cartoart
```

Or using yarn:

```bash
yarn add @kkingsbe/cartoart
```

## Quick Start

```typescript
import { CartoArtClient } from '@kkingsbe/cartoart';

// Initialize the client with your API key
const client = new CartoArtClient({
  apiKey: 'your_api_key_here'
});

// Generate a poster
const poster = await client.posters.generate({
  location: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  style: 'minimal',
  options: { high_res: true }
});

console.log(`Poster URL: ${poster.download_url}`);
```

## Authentication

To use the CartoArt SDK, you'll need an API key. You can obtain one by:

1. Visit [cartoart.net/developer](https://cartoart.net/developer)
2. Sign up or log in to your account
3. Generate an API key from your developer dashboard

### Using the Sandbox Key

For testing and development, you can use the public sandbox key:

```typescript
const client = new CartoArtClient({
  apiKey: 'ca_live_demo_sandbox_key_2024'
});
```

> [!WARNING]
> The sandbox key is rate-limited and intended for testing only. Use your own API key for production applications.

## Usage Examples

### Basic Poster Generation

```typescript
const poster = await client.posters.generate({
  location: {
    lat: 40.7128,
    lng: -74.0060
  },
  style: 'minimal'
});

console.log(poster.id);
console.log(poster.download_url);
```

### Advanced Configuration

```typescript
const poster = await client.posters.generate({
  location: {
    lat: 51.5074,
    lng: -0.1278
  },
  style: 'vibrant',
  camera: {
    pitch: 45,      // Tilt angle (0-60)
    bearing: 90,    // Rotation (0-360)
    zoom: 14        // Zoom level (1-20)
  },
  options: {
    high_res: true,       // Generate high-resolution output
    buildings_3d: true,   // Enable 3D buildings
    streets: true,        // Show streets
    water: true,          // Show water bodies
    parks: true,          // Show parks
    buildings: true,      // Show building footprints
    labels: false,        // Hide labels
    background: true      // Include background
  }
});
```

### Listing Available Styles

```typescript
const { styles } = await client.styles.list();

styles.forEach(style => {
  console.log(`${style.name}: ${style.description}`);
  
  // List available color palettes for each style
  style.palettes.forEach(palette => {
    console.log(`  - ${palette.name}`);
    console.log(`    Background: ${palette.colors.background}`);
    console.log(`    Primary: ${palette.colors.primary}`);
    console.log(`    Text: ${palette.colors.text}`);
  });
});
```

### Custom Base URL

If you're using a self-hosted instance or testing against a different environment:

```typescript
const client = new CartoArtClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://your-custom-domain.com/api/v1'
});
```

## API Reference

### `CartoArtClient`

The main client class for interacting with the CartoArt API.

#### Constructor

```typescript
new CartoArtClient(options: CartoArtClientOptions)
```

**Parameters:**
- `options.apiKey` (string, required) - Your CartoArt API key
- `options.baseUrl` (string, optional) - Custom API base URL. Defaults to `https://cartoart.net/api/v1`

### `client.posters`

Methods for generating and managing posters.

#### `generate(params: CreatePosterRequest): Promise<PosterResponse>`

Generate a new map poster.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location` | `PosterLocation` | Yes | Geographic coordinates |
| `location.lat` | `number` | Yes | Latitude (-90 to 90) |
| `location.lng` | `number` | Yes | Longitude (-180 to 180) |
| `style` | `string` | No | Style ID (e.g., 'minimal', 'vibrant') |
| `camera` | `PosterCamera` | No | Camera configuration |
| `camera.pitch` | `number` | No | Tilt angle (0-60 degrees) |
| `camera.bearing` | `number` | No | Rotation (0-360 degrees) |
| `camera.zoom` | `number` | No | Zoom level (1-20) |
| `options` | `PosterOptions` | No | Rendering options |
| `options.high_res` | `boolean` | No | Enable high-resolution output |
| `options.buildings_3d` | `boolean` | No | Enable 3D buildings |
| `options.streets` | `boolean` | No | Show streets |
| `options.water` | `boolean` | No | Show water bodies |
| `options.parks` | `boolean` | No | Show parks |
| `options.buildings` | `boolean` | No | Show building footprints |
| `options.labels` | `boolean` | No | Show labels |
| `options.background` | `boolean` | No | Include background |

**Returns:**

```typescript
interface PosterResponse {
  id: string;                    // Unique poster ID
  status: string;                // Generation status
  download_url?: string;         // URL to download the poster
  metadata?: {
    render_time_ms: number;      // Rendering time in milliseconds
    file_size_bytes: number;     // File size in bytes
    dimensions: string;          // Image dimensions (e.g., "2048x2048")
  };
  error?: string;                // Error message if generation failed
  message?: string;              // Additional information
}
```

### `client.styles`

Methods for retrieving available styles.

#### `list(): Promise<ListStylesResponse>`

Get all available poster styles and their color palettes.

**Returns:**

```typescript
interface ListStylesResponse {
  styles: Style[];
}

interface Style {
  id: string;                    // Unique style identifier
  name: string;                  // Display name
  description: string;           // Style description
  palettes: StylePalette[];      // Available color palettes
}

interface StylePalette {
  id: string;                    // Palette identifier
  name: string;                  // Palette name
  colors: {
    background: string;          // Background color (hex)
    text: string;                // Text color (hex)
    primary: string;             // Primary accent color (hex)
  };
}
```

## Error Handling

The SDK throws errors for failed requests. Always wrap API calls in try-catch blocks:

```typescript
try {
  const poster = await client.posters.generate({
    location: { lat: 34.0522, lng: -118.2437 },
    style: 'minimal'
  });
  console.log('Success!', poster.download_url);
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to generate poster:', error.message);
  }
}
```

### Common Error Scenarios

- **401 Unauthorized** - Invalid or missing API key
- **400 Bad Request** - Invalid parameters (e.g., coordinates out of range)
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server-side error

## TypeScript Support

The SDK is written in TypeScript and includes comprehensive type definitions. All types are exported for your convenience:

```typescript
import {
  CartoArtClient,
  CreatePosterRequest,
  PosterResponse,
  Style,
  StylePalette,
  PosterLocation,
  PosterCamera,
  PosterOptions
} from '@kkingsbe/cartoart';
```

## Examples

### Complete Example with Error Handling

```typescript
import { CartoArtClient } from '@kkingsbe/cartoart';

async function generatePoster() {
  const client = new CartoArtClient({
    apiKey: process.env.CARTOART_API_KEY!
  });

  try {
    // First, get available styles
    const { styles } = await client.styles.list();
    console.log(`Available styles: ${styles.map(s => s.name).join(', ')}`);

    // Generate a poster with the first available style
    const poster = await client.posters.generate({
      location: {
        lat: 48.8566,  // Paris
        lng: 2.3522
      },
      style: styles[0].id,
      camera: {
        pitch: 30,
        bearing: 45,
        zoom: 15
      },
      options: {
        high_res: true,
        buildings_3d: true,
        streets: true,
        water: true,
        parks: true
      }
    });

    console.log('Poster generated successfully!');
    console.log(`ID: ${poster.id}`);
    console.log(`Download: ${poster.download_url}`);
    
    if (poster.metadata) {
      console.log(`Rendered in ${poster.metadata.render_time_ms}ms`);
      console.log(`Size: ${poster.metadata.dimensions}`);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

generatePoster();
```

### Batch Generation

```typescript
async function generateMultiplePosters() {
  const client = new CartoArtClient({
    apiKey: process.env.CARTOART_API_KEY!
  });

  const locations = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'London', lat: 51.5074, lng: -0.1278 }
  ];

  const results = await Promise.allSettled(
    locations.map(loc =>
      client.posters.generate({
        location: { lat: loc.lat, lng: loc.lng },
        style: 'minimal',
        options: { high_res: false }
      })
    )
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ ${locations[index].name}: ${result.value.download_url}`);
    } else {
      console.log(`❌ ${locations[index].name}: ${result.reason}`);
    }
  });
}
```

## Rate Limits

API rate limits depend on your subscription tier. The sandbox key has the following limits:

- **10 requests per minute**
- **100 requests per day**

For production use with higher limits, please visit [cartoart.net/pricing](https://cartoart.net/pricing).

## Support

- 📧 **Email**: support@cartoart.net
- 📚 **Documentation**: [cartoart.net/developer/docs](https://cartoart.net/developer/docs)
- 🐛 **Issues**: [GitHub Issues](https://github.com/kkingsbe/carto-art/issues)
- 💬 **Community**: [Discord Server](https://discord.gg/cartoart)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Kyle Kingsbury

---

Made with ❤️ by the CartoArt team
