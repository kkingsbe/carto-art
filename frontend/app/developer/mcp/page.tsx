'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Terminal, Zap, ImageIcon, Copy, Check, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MCPPage() {
    const [copied, setCopied] = useState(false);

    const mcpConfig = `{
  "mcpServers": {
    "carto-art": {
      "command": "npx",
      "args": [
        "-y",
        "@kkingsbe/carto-art-mcp"
      ],
      "env": {
        "CARTO_ART_API_KEY": "YOUR_API_KEY_HERE",
        "CARTO_ART_API_URL": "https://cartoart.net/api/v1/posters/generate"
      }
    }
  }
}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(mcpConfig);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
            {/* Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                        <Cpu className="w-4 h-4" />
                        <span>MCP Protocol</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                        Connect AI Agents to <br />
                        <span className="text-blue-500">CartoArt</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Generate high-resolution map posters directly from your AI conversations
                        using the Model Context Protocol (MCP).
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    {[
                        {
                            icon: <ImageIcon className="w-6 h-6 text-blue-400" />,
                            title: "Inline Rendering",
                            description: "Posters appear directly in your agent's response as high-quality images."
                        },
                        {
                            icon: <Zap className="w-6 h-6 text-yellow-400" />,
                            title: "Instant Creation",
                            description: "Ask your agent for a location and style, and watch it come to life."
                        },
                        {
                            icon: <Terminal className="w-6 h-6 text-purple-400" />,
                            title: "Open Standard",
                            description: "Standardized MCP tools that work with any compatible LLM client."
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm"
                        >
                            <div className="mb-4">{feature.icon}</div>
                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className="text-zinc-500 leading-relaxed text-sm">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Setup Guide */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl overflow-hidden mb-12">
                    <CardHeader className="border-b border-zinc-800 pb-8">
                        <CardTitle className="text-2xl text-white">Setup Guide</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Configure your AI Agent (like Claude Desktop) to use the CartoArt MCP server.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="space-y-12">
                            {/* Step 1 */}
                            <section>
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-white">Locate Config</h3>
                                        <p className="text-zinc-400 text-sm">
                                            Open your LLM client's configuration file. For Claude Desktop, it's:
                                        </p>
                                        <code className="block mt-4 p-3 bg-black/50 rounded-lg text-zinc-300 font-mono text-xs border border-zinc-800">
                                            %APPDATA%\\Claude\\claude_desktop_config.json
                                        </code>
                                    </div>
                                </div>
                            </section>

                            {/* Step 2 */}
                            <section>
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                                        2
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold mb-2 text-white">Add Server Configuration</h3>
                                        <p className="text-zinc-400 text-sm mb-6">
                                            Copy and paste the following snippet into your configuration file.
                                        </p>

                                        <div className="relative group">
                                            <div className="absolute right-4 top-4 z-20">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700 h-8"
                                                    onClick={copyToClipboard}
                                                >
                                                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                                    {copied ? 'Copied' : 'Copy JSON'}
                                                </Button>
                                            </div>
                                            <pre className="p-8 bg-black/80 rounded-2xl font-mono text-sm overflow-x-auto border border-zinc-800 text-blue-400/90 leading-relaxed">
                                                {mcpConfig}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Step 3 */}
                            <section>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-white">Restart & Test</h3>
                                        <p className="text-zinc-400 text-sm">
                                            Restart your LLM client. You can now use tools like <span className="text-zinc-200">generate_poster</span>.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>

                {/* External Resources */}
                <div className="mb-12">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-white">Need help?</CardTitle>
                            <CardDescription className="text-zinc-500">Check out the official Model Context Protocol guide for connecting local servers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <a
                                href="https://modelcontextprotocol.io/docs/develop/connect-local-servers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-zinc-800 hover:bg-black/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <ExternalLink className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                                        MCP: Connecting Local Servers
                                    </span>
                                </div>
                                <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                            </a>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Link */}
                <div className="text-center">
                    <p className="text-zinc-500 text-sm mb-4">
                        Building your own apps? Check out our developer portal.
                    </p>
                    <Button variant="link" asChild className="text-blue-400 hover:text-blue-300 gap-2 p-0 h-auto">
                        <a href="/developer">
                            View Developer Portal <ExternalLink className="w-4 h-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
