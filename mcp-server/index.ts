#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fetch from "node-fetch";

const API_URL = process.env.CARTO_ART_API_URL || "https://cartoart.net/api/v1/posters/generate";

if (!process.env.CARTO_ART_API_KEY) {
    console.error("[WARNING] CARTO_ART_API_KEY environment variable is not set. Requests to the authenticated API will likely fail.");
}

const server = new Server(
    {
        name: "carto-art-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

const GeneratePosterArgumentsSchema = z.object({
    location: z.string().describe("The location to center the map on (e.g., 'Paris, France')"),
    style: z.string().optional().describe("The style ID (e.g., 'blueprint', 'retro', 'minimal')"),
    zoom: z.number().optional().describe("The zoom level (1-20)"),
    pitch: z.number().optional().describe("The pitch of the camera (0-60)"),
    bearing: z.number().optional().describe("The bearing of the camera (0-360)"),
    title: z.string().optional().describe("Custom title for the map"),
    subtitle: z.string().optional().describe("Custom subtitle for the map"),
    buildings_3d: z.boolean().optional().describe("Whether to enable 3D buildings"),
    terrain: z.boolean().optional().describe("Whether to show terrain"),
    water: z.boolean().optional().describe("Whether to show water"),
    parks: z.boolean().optional().describe("Whether to show parks"),
    streets: z.boolean().optional().describe("Whether to show streets"),
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
                        title: { type: "string", description: "Custom title for the map" },
                        subtitle: { type: "string", description: "Custom subtitle for the map" },
                        buildings_3d: { type: "boolean", description: "Whether to enable 3D buildings" },
                        terrain: { type: "boolean", description: "Whether to show terrain" },
                        water: { type: "boolean", description: "Whether to show water" },
                        parks: { type: "boolean", description: "Whether to show parks" },
                        streets: { type: "boolean", description: "Whether to show streets" },
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
            console.error(`[DEBUG] Starting generation for location: ${args.location}`);
            console.error(`[DEBUG] Args: ${JSON.stringify(args)}`);

            const geocodeBaseUrl = API_URL.replace("/api/v1/posters/generate", "/api/geocode");
            const geocodeUrl = `${geocodeBaseUrl}?q=${encodeURIComponent(args.location)}&limit=1`;
            console.error(`[DEBUG] Fetching geocode: ${geocodeUrl}`);

            const geocodeResponse = await fetch(geocodeUrl, {
                headers: { "Authorization": `Bearer ${process.env.CARTO_ART_API_KEY || "local-dev"}` }
            });

            console.error(`[DEBUG] Geocode status: ${geocodeResponse.status} ${geocodeResponse.statusText}`);

            if (!geocodeResponse.ok) {
                const errorText = await geocodeResponse.text();
                console.error(`[DEBUG] Geocode error body: ${errorText}`);
                throw new Error(`Geocoding failed: ${geocodeResponse.statusText} (${errorText})`);
            }

            let geocodeData;
            try {
                const text = await geocodeResponse.text();
                console.error(`[DEBUG] Geocode response body: ${text}`);
                geocodeData = JSON.parse(text);
            } catch (e) {
                throw new Error(`Failed to parse geocode response: ${e instanceof Error ? e.message : String(e)}`);
            }

            if (!Array.isArray(geocodeData) || geocodeData.length === 0) {
                console.error(`[DEBUG] No location found for: ${args.location}`);
                return {
                    content: [{ type: "text", text: `Could not find location: ${args.location}` }],
                    isError: true,
                };
            }

            const { lat, lon } = geocodeData[0];
            console.error(`[DEBUG] Found coordinates: ${lat}, ${lon}`);

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
                text: {
                    title: args.title,
                    subtitle: args.subtitle,
                },
                options: {
                    high_res: true,
                    buildings_3d: args.buildings_3d,
                    terrain: args.terrain,
                    water: args.water,
                    parks: args.parks,
                    streets: args.streets,
                }
            };

            console.error("[DEBUG] Calling generation API with payload:", JSON.stringify(payload));

            // 3. Call the generation API with Accept: application/json
            const apiResponse = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${process.env.CARTO_ART_API_KEY || "local-dev"}`
                },
                body: JSON.stringify(payload),
            });

            console.error(`[DEBUG] API Status: ${apiResponse.status} ${apiResponse.statusText}`);

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                console.error(`[DEBUG] API Error Body: ${errorText}`);
                return {
                    content: [{ type: "text", text: `Error from API: ${apiResponse.status} ${apiResponse.statusText}\n${errorText}` }],
                    isError: true,
                };
            }

            let data;
            try {
                const text = await apiResponse.text();
                console.error(`[DEBUG] API Response Body (first 100 chars): ${text.substring(0, 100)}...`);
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Failed to parse API response: ${e instanceof Error ? e.message : String(e)}`);
            }

            if (!data.download_url) {
                console.error(`[DEBUG] Response missing download_url: ${JSON.stringify(data)}`);
                return {
                    content: [{ type: "text", text: `API response missing download_url. Got: ${JSON.stringify(data)}` }],
                    isError: true,
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: `Generated poster for ${args.location}.\n\n![Map Poster](${data.download_url})`,
                    }
                ],
            };
        } catch (error) {
            console.error("[DEBUG] Unhandled exception:", error);
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
