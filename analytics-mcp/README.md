# Carto-Art Analytics MCP Server

This is a local Model Context Protocol (MCP) server that exposes Carto-Art analytics data to Claude.

## Features

It exposes several tools to query the admin panel data:

*   `get_admin_overview`: High-level dashboard stats (Total Users, Maps, etc.)
*   `get_growth_metrics`: Activation, Revenue, and Stickiness metrics.
*   `get_retention_metrics`: User retention rates and health status (active, at-risk, churned).
*   `get_recent_activity`: Feed of recent platform events.
*   `search_users`: Search for users by username or display name.

## Setup

1.  Navigate to this directory:
    ```bash
    cd analytics-mcp
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Ensure environment variables are set.
    The server automatically tries to load `../frontend/.env`.
    Make sure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are defined there.
    
    Alternatively, create a `.env` file in this directory with those values.

To run the server locally:

```bash
npm start
```

## Configuring Claude Desktop

To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

### Option A: Testing against Local
```json
{
  "mcpServers": {
    "carto-art-analytics-local": {
      "command": "node",
      "args": ["c:/Users/Kyle/Documents/code/carto-art/analytics-mcp/dist/index.js"],
      "cwd": "c:/Users/Kyle/Documents/code/carto-art/analytics-mcp",
      "env": {
        "SUPABASE_URL": "http://127.0.0.1:54321",
        "SUPABASE_SERVICE_ROLE_KEY": "your_local_service_role_key"
      }
    }
  }
}
```

### Option B: Testing against Production
```json
{
  "mcpServers": {
    "carto-art-analytics-prod": {
      "command": "node",
      "args": ["c:/Users/Kyle/Documents/code/carto-art/analytics-mcp/dist/index.js"],
      "cwd": "c:/Users/Kyle/Documents/code/carto-art/analytics-mcp",
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_prod_service_role_key"
      }
    }
  }
}
```

*Note: The server also attempts to load `../frontend/.env` if `SUPABASE_URL` is not provided in `env`.*
