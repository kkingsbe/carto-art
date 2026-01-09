# Testing Procedure: Full Checkout Flow & Printful Verification

This document outlines the steps to test the full checkout flow and verify that orders are correctly created in the Printful Dashboard with the appropriate print files.

## Prerequisites

1.  **Stripe CLI**: Ensure Stripe CLI is installed and forwarding webhooks to your local environment.
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    ```
2.  **Environment Variables**: Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `PRINTFUL_API_KEY` are correctly set in `.env.local`.
3.  **Active Development Server**: ensure `npm run dev` is running.

## Step-by-Step Testing Guide

### 1. Initiate Checkout
1.  Navigate to a product page or the store.
2.  Select a product and variant (size).
3.  Click "Buy" or "Checkout" to proceed to the order steps.
4.  If prompted, enter shipping details (use a valid address structure, e.g., 123 Main St, New York, NY 10001, US).

### 2. Complete Payment (Test Mode)
1.  In the Payment step, use the Stripe Test Card details:
    *   **Card Number**: `4242 4242 4242 4242`
    *   **Expiration**: Any future date (e.g., `12/34`)
    *   **CVC**: `123`
    *   **ZIP**: `10001`
2.  Click "Pay".
3.  Wait for the success confirmation or redirect to the profile page.

### 3. Verify Stripe & Webhook
1.  Check your terminal where `stripe listen` is running.
2.  Confirm you see a `200 OK` response for the `payment_intent.succeeded` event.
    *   *Note: This event triggers the Printful order creation.*

### 4. Verify Local Database
1.  Check your local Supabase `orders` table.
2.  Confirm a new order exists with status `paid`.
3.  Verify `printful_order_id` is populated in the order record.

### 5. Verify Printful Dashboard
1.  Log in to your [Printful Dashboard](https://www.printful.com/dashboard/default/orders).
2.  Navigate to **Orders**.
3.  You should see a new order with status **Draft** (since `confirm: false` is sent).
4.  **Important:** Click on the order to view details.
5.  **Verify Preview/File**:
    *   Check the item in the order.
    *   You should see the **Print File** attached.
    *   To see the "preview", click on the item or the print file thumbnail. Printful usually displays the print file overlaid on a generic product template.
    *   *Clarification on "Preview"*: The system currently sends the **Print File** (high-res image) to Printful. It does *not* send a separate "mockup" image URL for the dashboard preview. However, Printful automatically renders a preview of the print file on the product in their dashboard.

## Troubleshooting

*   **Webhook 400/500 Errors**: Check the console logs for "Webhook Error". Ensure `STRIPE_WEBHOOK_SECRET` matches the one provided by `stripe listen`.
*   **Order Missing in Printful**: Check server logs for "Failed to create Printful order". This often happens if the address is invalid or the variant ID doesn't exist in your Printful store context (though catalogue items should work).
*   **"Draft" vs "Pending"**: Orders usually start as Drafts to allow manual review before fulfillment.
