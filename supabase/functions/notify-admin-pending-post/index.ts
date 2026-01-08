// supabase/functions/notify-admin-pending-post/index.ts
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
    const post = payload.record;

    if (!post || post.status !== 'pending') {
      return new Response('ok'); // Not a new pending post, ignore.
    }

    // 1. Fetch the post author's username
    const { data: author, error: authorError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', post.user_id)
      .single();
      
    if (authorError) throw new Error(`Could not fetch post author: ${authorError.message}`);
    const authorUsername = author?.username || 'A user';

    // 2. Fetch all admin user IDs using the database function
    const { data: admins, error: adminsError } = await supabaseAdmin
      .rpc('get_admin_user_ids');
    
    if (adminsError) throw new Error(`Could not fetch admin user IDs: ${adminsError.message}`);
    if (!admins || admins.length === 0) {
        console.log("No admin users found to notify.");
        return new Response('ok');
    }

    // 3. Create a notification for each admin
    const notificationContent = `${authorUsername} submitted a new post for review: "${post.title}"`;
    const notifications = admins.map((adminId: string) => ({
      recipient_user_id: adminId,
      actor_user_id: post.user_id,
      type: 'admin_approval',
      content: notificationContent,
      link_url: `/admin`,
      related_entity_id: post.id,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (insertError) throw new Error(`Failed to insert admin notifications: ${insertError.message}`);

    return new Response('ok');
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});