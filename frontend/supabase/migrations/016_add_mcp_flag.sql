-- Migration 016: Add MCP Server Page Feature Flag

INSERT INTO feature_flags (key, name, description, enabled, enabled_percentage)
VALUES (
  'mcp_server_page', 
  'MCP Server Page', 
  'Enables the MCP server configuration page and developer documentation.', 
  false, 
  0
) ON CONFLICT (key) DO NOTHING;
