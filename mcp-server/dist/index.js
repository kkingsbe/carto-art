#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fetch from "node-fetch";
const API_URL = process.env.CARTO_ART_API_URL || "http://localhost:3000/api/v1/posters/generate";
const server = new Server({
    name: "carto-art-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
const GeneratePosterArgumentsSchema = z.object({
    location: z.string().describe("The location to center the map on (e.g., 'Paris, France')"),
    style: z.string().optional().describe("The style ID (e.g., 'blueprint', 'retro', 'minimal')"),
    zoom: z.number().optional().describe("The zoom level (1-20)"),
    pitch: z.number().optional().describe("The pitch of the camera (0-60)"),
    bearing: z.number().optional().describe("The bearing of the camera (0-360)"),
    buildings_3d: z.boolean().optional().describe("Whether to enable 3D buildings"),
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "generate_poster",
                description: "Generate a beautiful map poster for a given location and style.",
                inputSchema: {
                    type: "object",
                    properties: {
                        location: { type: "string", description: "The location (e.g., 'Paris, France')" },
                        style: { type: "string", description: "The style ID (e.g., 'blueprint', 'retro', 'minimal')" },
                        zoom: { type: "number", description: "The zoom level (1-20)" },
                        pitch: { type: "number", description: "The pitch of the camera (0-60)" },
                        bearing: { type: "number", description: "The bearing of the camera (0-360)" },
                        buildings_3d: { type: "boolean", description: "Whether to enable 3D buildings" },
                    },
                    required: ["location"],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "generate_poster") {
        const args = GeneratePosterArgumentsSchema.parse(request.params.arguments);
        try {
            // 1. Geocode the location string
            console.error(`Geocoding: ${args.location}`);
            const geocodeBaseUrl = API_URL.replace("/posters/generate", "/geocode");
            const geocodeResponse = await fetch(`${geocodeBaseUrl}?q=${encodeURIComponent(args.location)}&limit=1`, {
                headers: { "Authorization": `Bearer ${process.env.CARTO_ART_API_KEY || "local-dev"}` }
            });
            if (!geocodeResponse.ok) {
                throw new Error(`Geocoding failed: ${geocodeResponse.statusText}`);
            }
            const geocodeData = await geocodeResponse.json();
            if (!geocodeData || geocodeData.length === 0) {
                return {
                    content: [{ type: "text", text: `Could not find location: ${args.location}` }],
                    isError: true,
                };
            }
            const { lat, lon } = geocodeData[0];
            // 2. Prepare the payload for the new SimplifiedPosterSchema
            const payload = {
                location: {
                    lat: parseFloat(lat),
                    lng: parseFloat(lon)
                },
                style: args.style || "minimal",
                camera: {
                    pitch: args.pitch || 0,
                    bearing: args.bearing || 0,
                    zoom: args.zoom || 12,
                },
                options: {
                    buildings_3d: args.buildings_3d || false,
                    high_res: true,
                }
            };
            console.error("Calling generation API with payload:", JSON.stringify(payload));
            // 3. Call the generation API with Accept: image/png
            const imageResponse = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "image/png",
                    "Authorization": `Bearer ${process.env.CARTO_ART_API_KEY || "local-dev"}`
                },
                body: JSON.stringify(payload),
            });
            if (!imageResponse.ok) {
                const errorText = await imageResponse.text();
                return {
                    content: [{ type: "text", text: `Error from API: ${imageResponse.status} ${imageResponse.statusText}\n${errorText}` }],
                    isError: true,
                };
            }
            const buffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(buffer).toString("base64");
            return {
                content: [
                    {
                        type: "text",
                        text: `Generated poster for ${args.location}.`,
                    },
                    {
                        type: "image",
                        data: base64Image,
                        mimeType: "image/png",
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Failed to connect to CartoArt API: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
            };
        }
    }
    throw new Error("Tool not found");
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("CartoArt MCP server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map