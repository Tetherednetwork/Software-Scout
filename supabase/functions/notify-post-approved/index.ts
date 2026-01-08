// FIX: Add Deno type definitions to resolve "Cannot find name 'Deno'" errors.
declare const Deno: any;
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const payload = await req.json();
    const oldRecord = payload.old_record;
    const newRecord = payload.record;

    if (!oldRecord || !newRecord) {
      throw new Error("Invalid payload: 'old_record' or 'record' not found.");
    }

    // Check if the status was changed from 'pending' to 'approved'
    if (oldRecord.status === 'pending' && newRecord.status === 'approved') {
      const authorId = newRecord.user_id;

      // --- 1. Notify the author that their post was approved ---
      const authorNotificationContent = `Your forum post has been approved: "${newRecord.title}"`;
      const authorLinkUrl = `/forum-post/${newRecord.id}`;
      
      const { error: authorNotifyError } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_user_id: authorId,
          type: 'post_approved',
          content: authorNotificationContent,
          link_url: authorLinkUrl,
          related_entity_id: newRecord.id,
        });

      if (authorNotifyError) {
        console.error(`Failed to insert approval notification for author: ${authorNotifyError.message}`);
        // We don't throw here, so we can still attempt the broadcast
      }

      // --- 2. Create a broadcast notification for all users ---
      const { data: authorProfile, error: authorProfileError } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', authorId)
        .single();
      
      if (authorProfileError) throw new Error(`Could not fetch author profile for broadcast: ${authorProfileError.message}`);
      const authorUsername = authorProfile?.username || 'A user';

      const broadcastContent = `${authorUsername} published a new post in the ${newRecord.category} category: "${newRecord.title}"`;
      const broadcastLinkUrl = `/forum-post/${newRecord.id}`;
      
      const { error: broadcastError } = await supabaseAdmin
        .from('notifications')
        .insert({
          is_broadcast: true,
          actor_user_id: authorId,
          type: 'new_forum_post',
          content: broadcastContent,
          link_url: broadcastLinkUrl,
          related_entity_id: newRecord.id,
        });

      if (broadcastError) {
        throw new Error(`Failed to insert broadcast notification: ${broadcastError.message}`);
      }
    }

    return new Response('ok');
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});