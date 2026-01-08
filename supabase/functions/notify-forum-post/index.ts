// FIX: Add Deno type definitions to resolve "Cannot find name 'Deno'" errors.
declare const Deno: any;

// supabase/functions/notify-forum-post/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// The admin client is required to bypass RLS and query user/post data securely.
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
    const comment = payload.record; // The new comment from the forum_comments table

    if (!comment || comment.parent_comment_id) {
      // This function only handles top-level comments. Replies are handled by notify-forum-reply.
      return new Response('ok');
    }

    // 1. Fetch the original forum post to get the author's ID and the post title
    const { data: post, error: postError } = await supabaseAdmin
      .from('forum_posts')
      .select('user_id, title')
      .eq('id', comment.post_id)
      .single();

    if (postError) throw new Error(`Could not fetch forum post: ${postError.message}`);
    if (!post) throw new Error(`Forum post with ID ${comment.post_id} not found.`);

    // 2. Fetch the commenter's username for a more descriptive notification
    const { data: commenter, error: commenterError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', comment.user_id)
      .single();

    if (commenterError) throw new Error(`Could not fetch commenter's profile: ${commenterError.message}`);
    const commenterUsername = commenter?.username || 'Someone';

    // 3. Prevent self-notification
    if (comment.user_id === post.user_id) {
      console.log('Self-notification prevented for forum comment.');
      return new Response('ok');
    }

    // 4. Create the notification for the post author
    const notificationContent = `${commenterUsername} commented on your forum post: "${post.title}"`;
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_user_id: post.user_id,
        actor_user_id: comment.user_id,
        type: 'forum_comment',
        content: notificationContent,
        link_url: `/forum-post/${comment.post_id}?comment=${comment.id}`, // Link to the post and specific comment
        related_entity_id: comment.id,
      });

    if (notificationError) throw new Error(`Failed to insert notification: ${notificationError.message}`);

    return new Response('ok');
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});