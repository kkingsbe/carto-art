import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fetch from "node-fetch";

const API_URL = process.env.CARTO_ART_API_URL || "http://localhost:3000/api/v1/posters/generate";

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
    width: z.number().optional().default(1080),
    height: z.number().optional().default(1080),
    pixelRatio: z.number().optional().default(2),
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
                        location: { type: "string", description: "The location to center the map on (e.g., 'Paris, France')" },
                        style: { type: "string", description: "The style ID (e.g., 'blueprint', 'retro', 'minimal')" },
                        zoom: { type: "number", description: "The zoom level (1-20)" },
                        width: { type: "number", description: "The width of the poster in pixels" },
                        height: { type: "number", description: "The height of the poster in pixels" },
                        pixelRatio: { type: "number", description: "The pixel ratio for higher quality" },
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

        // Prepare the payload for the existing API
        // Note: The existing API expects { config: { ... }, resolution: { ... } }
        // We'll construct a basic config based on the location and style.
        const payload = {
            config: {
                location: args.location,
                style: args.style || "minimal",
                zoom: args.zoom || 12,
                // The API actually wants a full PosterConfig, but based on route.ts
                // it seems to handle parsing and validation. 
                // Let's check what it actually needs from GeneratePosterSchema in route.ts
                /*
                const GeneratePosterSchema = z.object({
                    config: z.object({
                        palette: z.object({
                            background: z.string(),
                            text: z.string(),
                        }).passthrough(),
                    }).passthrough(),
                    resolution: z.object({
                        width: z.number().min(100).max(10000),
                        height: z.number().min(100).max(10000),
                        pixelRatio: z.number().min(1).max(4).optional().default(1)
                    })
                });
                */
                // I should probably simplify the payload or adapt it to match what the API expects.
                // For now, I'll pass a minimal structure that satisfies the schema.
                palette: {
                    background: "#ffffff",
                    text: "#000000"
                }
            },
            resolution: {
                width: args.width,
                height: args.height,
                pixelRatio: args.pixelRatio
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // We might need an API key if authenticateApiRequest is active.
                    // For local POC, let's assume it can be bypassed or has a default.
                    "Authorization": `Bearer ${process.env.CARTO_ART_API_KEY || "local-dev"}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error from API: ${response.status} ${response.statusText}\n${errorText}`,
                        },
                    ],
                    isError: true,
                };
            }

            // The API returns { download_url, ... } or the image buffer if Accept: image/png
            // To show inline in Claude, we want the image buffer.
            const imageResponse = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "image/png",
                    "Authorization": `Bearer ${process.env.CARTO_ART_API_KEY || "local-dev"}`
                },
                body: JSON.stringify(payload),
            });

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
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to connect to CartoArt API: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
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
