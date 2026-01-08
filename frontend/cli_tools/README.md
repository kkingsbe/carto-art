# CLI Tools

This directory contains various ad-hoc scripts for testing, debugging, and verification of the Carto Art frontend.

## Scripts

| Script | Purpose | Usage |
| [check_exports.ts](./check_exports.ts) | Checks exports of `maplibre-contour`. | `npx ts-node frontend/cli_tools/check_exports.ts` |
| [check_templates_diag.ts](./check_templates_diag.ts) | Inspections Printful templates for product ID 3. | `npx ts-node frontend/cli_tools/check_templates_diag.ts` (Requires `.env` with `PRINTFUL_API_KEY`) |
| [check_variant_diag.ts](./check_variant_diag.ts) | Fetches Printful variant info for ID 19296. | `npx ts-node frontend/cli_tools/check_variant_diag.ts` (Requires `.env` with `PRINTFUL_API_KEY`) |
| [debug-db.ts](./debug-db.ts) | Checks Supabase connection and `feature_flags` table. | `npx ts-node frontend/cli_tools/debug-db.ts` |
| [debug-encoding.ts](./debug-encoding.ts) | Checks `.env` file encoding and first 16 bytes. | `npx ts-node frontend/cli_tools/debug-encoding.ts` |
| [debug-env.ts](./debug-env.ts) | Verifies `.env` loading and checks for keys like `LOCATIONIQ_API_KEY`. | `npx ts-node frontend/cli_tools/debug-env.ts` |
| [debug_gen_diag.ts](./debug_gen_diag.ts) | Debugs Printful mock creation and polling. | `npx ts-node frontend/cli_tools/debug_gen_diag.ts` (Requires `.env` with `PRINTFUL_API_KEY`) |
| [debug_latency.ts](./debug_latency.ts) | Checks Supabase API latency over the last 6 hours. | `npx ts-node frontend/cli_tools/debug_latency.ts` |
| [fix-encoding.ts](./fix-encoding.ts) | Converts `.env` file from UTF-16LE to UTF-8. | `npx ts-node frontend/cli_tools/fix-encoding.ts` |
| [inspect-product-variants.ts](./inspect-product-variants.ts) | Checks `product_variants` table in Supabase. | `npx ts-node frontend/cli_tools/inspect-product-variants.ts` |
| [list_variants_diag.ts](./list_variants_diag.ts) | Lists product variants matching "12x36" in Supabase. | `npx ts-node frontend/cli_tools/list_variants_diag.ts` |
| [test-mockup.ts](./test-mockup.ts) | Tests `createMockupTask` for a fetched variant. | `npx ts-node frontend/cli_tools/test-mockup.ts` |
| [test_client_diag.ts](./test_client_diag.ts) | Tests `createMockupTask` via TS client. | `npx ts-node frontend/cli_tools/test_client_diag.ts` |
| [verify_geocoding.ts](./verify_geocoding.ts) | Verifies LocationIQ geocoding. | `npx ts-node frontend/cli_tools/verify_geocoding.ts` |
| [verify_key.ts](./verify_key.ts) | Verifies LocationIQ API key. | `npx ts-node frontend/cli_tools/verify_key.ts` |
