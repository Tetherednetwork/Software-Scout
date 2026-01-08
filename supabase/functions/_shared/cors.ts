// supabase/functions/_shared/cors.ts
// These headers allow the function to be called from a browser client.
// For production, you should replace '*' with your specific app domain
// e.g., 'https://softmonk.co, https://*.softmonk.co'
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}