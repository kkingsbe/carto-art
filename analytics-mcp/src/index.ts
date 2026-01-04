
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { supabase } from "./db.js";

const server = new Server(
    {
        name: "carto-art-analytics",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_admin_overview",
                description: "Get high-level statistics for the admin dashboard (Total Users, Maps, API Usage, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_growth_metrics",
                description: "Get growth metrics including activation, revenue, and stickiness stats.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_retention_metrics",
                description: "Get user retention rates and health status (active, at-risk, churned).",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_recent_activity",
                description: "Get the most recent platform activity events.",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: {
                            type: "number",
                            description: "Number of events to return (default 20)",
                        },
                    },
                },
            },
            {
                name: "search_users",
                description: "Search for users by email or username.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query string",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_feedback",
                description: "Get user feedback with optional filtering.",
                inputSchema: {
                    type: "object",
                    properties: {
                        search: { type: "string", description: "Search query in open feedback" },
                        rating: { type: "string", enum: ["all", "high", "low"], description: "Filter by rating (high >= 4, low <= 2)" },
                        limit: { type: "number", description: "Number of items to return (default 50)" },
                    },
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        if (name === "get_admin_overview") {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const [
                { count: totalUsers },
                { count: totalMaps },
                { count: totalApiUsage },
                { count: totalFeedback },
                { count: totalExports },
                { count: publishedMaps },
                { count: activeApiKeys },
                { count: views24h },
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('maps').select('*', { count: 'exact', head: true }),
                supabase.from('api_usage').select('*', { count: 'exact', head: true }),
                supabase.from('feedback').select('*', { count: 'exact', head: true }),
                supabase.from('page_events').select('*', { count: 'exact', head: true }).eq('event_type', 'poster_export'),
                supabase.from('maps').select('*', { count: 'exact', head: true }).eq('is_published', true),
                supabase.from('api_keys').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('page_events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view').gte('created_at', twentyFourHoursAgo),
            ]);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            totalUsers: totalUsers || 0,
                            totalMaps: totalMaps || 0,
                            totalApiUsage: totalApiUsage || 0,
                            totalFeedback: totalFeedback || 0,
                            totalExports: totalExports || 0,
                            publishedMaps: publishedMaps || 0,
                            activeApiKeys: activeApiKeys || 0,
                            views24h: views24h || 0,
                        }, null, 2),
                    },
                ],
            };
        }

        if (name === "get_growth_metrics") {
            const [activationRes, revenueRes, stickinessRes] = await Promise.all([
                supabase.rpc('get_activation_metrics'),
                supabase.rpc('get_revenue_metrics'),
                supabase.rpc('get_stickiness_metrics')
            ]);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            activation: activationRes.data,
                            revenue: revenueRes.data,
                            stickiness: stickinessRes.data,
                            errors: {
                                activation: activationRes.error,
                                revenue: revenueRes.error,
                                stickiness: stickinessRes.error
                            }
                        }, null, 2),
                    },
                ],
            };
        }

        if (name === "get_retention_metrics") {
            const [day1Res, day7Res, day30Res] = await Promise.all([
                supabase.rpc('get_retention_rate', { days_since_signup: 1 }),
                supabase.rpc('get_retention_rate', { days_since_signup: 7 }),
                supabase.rpc('get_retention_rate', { days_since_signup: 30 })
            ]);

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            const [{ count: activeCount }, { count: atRiskCount }, { count: churnedCount }, { count: totalUsers }] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', sevenDaysAgo),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).lt('last_active_at', sevenDaysAgo).gte('last_active_at', thirtyDaysAgo),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).lt('last_active_at', thirtyDaysAgo),
                supabase.from('profiles').select('*', { count: 'exact', head: true })
            ]);

            const safeTotal = totalUsers || 1;

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            retentionRates: {
                                day1: day1Res.data || 0,
                                day7: day7Res.data || 0,
                                day30: day30Res.data || 0
                            },
                            userHealth: {
                                active: { count: activeCount || 0, percentage: ((activeCount || 0) / safeTotal) * 100 },
                                atRisk: { count: atRiskCount || 0, percentage: ((atRiskCount || 0) / safeTotal) * 100 },
                                churned: { count: churnedCount || 0, percentage: ((churnedCount || 0) / safeTotal) * 100 }
                            }
                        }, null, 2)
                    }
                ]
            };
        }

        if (name === "get_recent_activity") {
            const limit = (args as { limit?: number }).limit || 20;

            const { data: events, error } = await supabase
                .from('page_events')
                .select(`
            *,
            profiles:user_id (
                username,
                display_name,
                avatar_url
            )
        `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return {
                content: [{ type: "text", text: JSON.stringify(events, null, 2) }],
            };
        }

        if (name === "search_users") {
            const query = (args as { query: string }).query;

            const { data: users, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .limit(20);

            if (error) throw error;

            return {
                content: [{ type: "text", text: JSON.stringify(users, null, 2) }],
            };
        }

        if (name === "get_feedback") {
            const { search, rating, limit = 50 } = args as { search?: string; rating?: string; limit?: number };

            let query = supabase
                .from('feedback')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    )
                `, { count: 'exact' });

            if (rating) {
                if (rating === "high") query = query.gte("overall_rating", 4);
                else if (rating === "low") query = query.lte("overall_rating", 2);
            }

            if (search) {
                query = query.ilike("open_feedback", `%${search}%`);
            }

            query = query.order("created_at", { ascending: false }).limit(limit);

            const { data: feedback, count, error } = await query;

            if (error) throw error;

            const stats = {
                count: feedback?.length || 0,
                avgRating: feedback?.length ? feedback.reduce((sum, item) => sum + (item.overall_rating || 0), 0) / feedback.length : 0
            };

            return {
                content: [{ type: "text", text: JSON.stringify({ feedback, stats, totalCount: count }, null, 2) }],
            };
        }

        throw new Error(`Unknown tool: ${name}`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
