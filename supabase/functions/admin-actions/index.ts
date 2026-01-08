// FIX: Add Deno type definitions to resolve "Cannot find name 'Deno'" errors.
declare const Deno: any;
// supabase/functions/admin-actions/index.ts
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Admin client with service role key to bypass RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Function to verify if the user is an admin
async function isAdmin(authHeader: string, userClient: SupabaseClient): Promise<boolean> {
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    console.error('Admin check failed: Could not get user from token.', userError);
    return false;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Admin check failed: Could not get user profile.', profileError);
    return false;
  }

  return profile?.role === 'admin';
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create a client with the user's token to verify identity
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Security check: Ensure the user is an admin
    const userIsAdmin = await isAdmin(authHeader, userClient);
    if (!userIsAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin privileges required.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, id } = await req.json();
    if (!action || !id) {
      throw new Error('Action and ID are required.');
    }

    let tableName: string;
    switch (action) {
      case 'deleteTestimonial':
        tableName = 'testimonials';
        break;
      case 'deleteUserFeedback':
        tableName = 'user_feedback';
        break;
      case 'deleteForumPost':
        tableName = 'forum_posts';
        break;
      case 'deleteForumComment':
        tableName = 'forum_comments';
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    const { error: deleteError } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Failed to delete from ${tableName}: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: `Successfully deleted item ${id} from ${tableName}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Admin Actions Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});