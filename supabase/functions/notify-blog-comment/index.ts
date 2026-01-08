// FIX: Add Deno type definitions to resolve "Cannot find name 'Deno'" errors.
declare const Deno: any;

// supabase/functions/notify-blog-comment/index.ts
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
    const comment = payload.record; // The new comment from the blog_comments table

    if (!comment) {
      throw new Error("Invalid payload: 'record' not found.");
    }

    // 1. Fetch the original blog post to get the author's ID and the post title
    const { data: post, error: postError } = await supabaseAdmin
      .from('blog_posts')
      .select('user_id, title')
      .eq('id', comment.post_id)
      .single();

    if (postError) throw new Error(`Could not fetch blog post: ${postError.message}`);
    if (!post) throw new Error(`Blog post with ID ${comment.post_id} not found.`);

    // 2. Fetch the commenter's username for a more descriptive notification
    const { data: commenter, error: commenterError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', comment.user_id)
      .single();

    if (commenterError) throw new Error(`Could not fetch commenter's profile: ${commenterError.message}`);
    const commenterUsername = commenter?.username || 'Someone';

    // 3. Prevent self-notification (a user commenting on their own post)
    if (comment.user_id === post.user_id) {
      console.log('Self-notification prevented for blog comment.');
      return new Response('ok');
    }

    // 4. Create the notification for the post author
    const notificationContent = `${commenterUsername} commented on your blog post: "${post.title}"`;
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_user_id: post.user_id,
        actor_user_id: comment.user_id,
        type: 'blog_comment',
        content: notificationContent,
        link_url: `/blog-post/${comment.post_id}`, // Direct link for the frontend router
        related_entity_id: comment.id,
      });

    if (notificationError) throw new Error(`Failed to insert notification: ${notificationError.message}`);

    return new Response('ok');
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});