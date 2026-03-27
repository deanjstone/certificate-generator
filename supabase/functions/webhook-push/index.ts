import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

/**
 * webhook-push — Supabase Edge Function
 *
 * Receives database webhook events (e.g. certificate status changes) and
 * forwards them to configured downstream endpoints such as email providers
 * or external notification services.
 *
 * Expected request: Supabase Database Webhook payload (POST, JSON)
 */
serve(async (_req: Request): Promise<Response> => {
  // TODO: implement webhook forwarding logic
  return new Response(
    JSON.stringify({ error: 'Not implemented' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } },
  );
});
