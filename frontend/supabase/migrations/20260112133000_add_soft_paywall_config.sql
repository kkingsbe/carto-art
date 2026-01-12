-- Add soft_paywall_delay_seconds to site_config
INSERT INTO site_config (key, value, description)
VALUES ('soft_paywall_delay_seconds', '60', 'Delay in seconds before showing the soft paywall modal to free tier users in the editor')
ON CONFLICT (key) DO NOTHING;
