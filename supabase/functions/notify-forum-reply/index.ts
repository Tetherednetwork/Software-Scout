// supabase/functions/notify-forum-reply/index.ts
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
    const reply = payload.record;

    if (!reply || !reply.parent_comment_id) {
      // Not a reply, so this function should ignore it.
      return new Response('ok');
    }

    // 1. Fetch the parent comment to find its author
    const { data: parentComment, error: parentError } = await supabaseAdmin
      .from('forum_comments')
      .select('user_id, post_id')
      .eq('id', reply.parent_comment_id)
      .single();
      
    if (parentError) throw new Error(`Could not fetch parent comment: ${parentError.message}`);
    if (!parentComment) return new Response('ok'); // Parent comment might have been deleted

    const recipientId = parentComment.user_id;

    // 2. Prevent self-notification (replying to your own comment)
    if (reply.user_id === recipientId) {
      console.log('Self-notification prevented for forum reply.');
      return new Response('ok');
    }

    // 3. Fetch the replier's username
    const { data: replier, error: replierError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', reply.user_id)
      .single();

    if (replierError) throw new Error(`Could not fetch replier's profile: ${replierError.message}`);
    const replierUsername = replier?.username || 'Someone';

    // 4. Fetch the post title for context
    const { data: post, error: postError } = await supabaseAdmin
        .from('forum_posts')
        .select('title')
        .eq('id', reply.post_id)
        .single();
    
    if (postError) throw new Error(`Could not fetch post for reply: ${postError.message}`);
    const postTitle = post?.title || 'a forum post';

    // 5. Create the notification
    const notificationContent = `${replierUsername} replied to your comment on "${postTitle}"`;
    const linkUrl = `/forum-post/${reply.post_id}?comment=${reply.id}`;
    
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_user_id: recipientId,
        actor_user_id: reply.user_id,
        type: 'forum_reply',
        content: notificationContent,
        link_url: linkUrl,
        related_entity_id: reply.id,
      });

    if (notificationError) throw new Error(`Failed to insert reply notification: ${notificationError.message}`);

    return new Response('ok');
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});