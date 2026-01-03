# CartoArt MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that enables AI assistants (like Claude) to generate beautiful map posters using [CartoArt](https://cartoart.net).

## Features

- **Generate Posters**: Create high-quality, stylized map posters for any location.
- **Customizable Styles**: Choose from various styles like 'minimal', 'blueprint', 'retro', 'dark', etc.
- **Camera Control**: Adjust pitch, bearing, and zoom for 3D perspectives.
- **Preview Integration**: Returns a markdown-friendly image URL for immediate preview in chat.

## Installation

You can use this server directly with `npx` without installing it globally.

## API Key

You need a CartoArt API key to use this server.
**[Get your API Key here](https://cartoart.net/developer/settings)**

## Usage with Claude Desktop

Add the following configuration to your `claude_desktop_config.json`:

### On Windows
Path: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "carto-art": {
      "command": "npx.cmd",
      "args": [
        "-y",
        "@kkingsbe/carto-art-mcp"
      ],
      "env": {
        "CARTO_ART_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### On macOS
Path: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "carto-art": {
      "command": "npx",
      "args": [
        "-y",
        "@kkingsbe/carto-art-mcp"
      ],
      "env": {
        "CARTO_ART_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

## Tools

### `generate_poster`

Generates a map poster image.

**Arguments:**
- `location` (string, required): The location to map (e.g., "San Francisco, CA", "Eiffel Tower").
- `style` (string, optional): The visual style. Options: `minimal` (default), `blueprint`, `retro`, `dark`, `satellite`.
- `zoom` (number, optional): Zoom level (1-20). Default: 12.
- `pitch` (number, optional): Camera pitch (0-60 degrees) for 3D effect.
- `bearing` (number, optional): Camera rotation (0-360 degrees).
- `buildings_3d` (boolean, optional): Enable 3D building extrusion.

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run locally: `node dist/index.js`

### Testing the Package Locally

Before publishing to NPM, you can simulate the user experience by packing and running the tarball:

1. `npm pack` (creates `kkingsbe-carto-art-mcp-1.0.2.tgz`)
2. Run with npx:
   ```bash
   npx ./kkingsbe-carto-art-mcp-1.0.2.tgz
   ```

## License

ISC
