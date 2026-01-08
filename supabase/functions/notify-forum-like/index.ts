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
    const like = payload.record;

    if (!like) throw new Error("Invalid payload: 'record' not found.");

    const likerId = like.user_id;

    const { data: liker, error: likerError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', likerId)
      .single();

    if (likerError) throw new Error(`Could not fetch liker's profile: ${likerError.message}`);
    const likerUsername = liker?.username || 'Someone';
    
    let recipientId: string | null = null;
    let notificationContent: string = '';
    let linkUrl: string = '';
    let relatedEntityId: string | number | null = null;

    if (like.post_id) {
      // It's a post like
      const { data: post, error: postError } = await supabaseAdmin
        .from('forum_posts')
        .select('user_id, title')
        .eq('id', like.post_id)
        .single();
      
      if (postError) throw new Error(`Could not fetch forum post: ${postError.message}`);
      if (!post) return new Response('ok');

      recipientId = post.user_id;
      notificationContent = `${likerUsername} liked your forum post: "${post.title}"`;
      linkUrl = `/forum-post/${like.post_id}`;
      relatedEntityId = like.post_id;

    } else if (like.comment_id) {
      // It's a comment like
      const { data: comment, error: commentError } = await supabaseAdmin
        .from('forum_comments')
        .select('user_id, post_id, content')
        .eq('id', like.comment_id)
        .single();
        
      if (commentError) throw new Error(`Could not fetch forum comment: ${commentError.message}`);
      if (!comment) return new Response('ok');

      const { data: post, error: postError } = await supabaseAdmin
        .from('forum_posts')
        .select('title')
        .eq('id', comment.post_id)
        .single();

      if (postError) throw new Error(`Could not fetch forum post for comment: ${postError.message}`);

      recipientId = comment.user_id;
      notificationContent = `${likerUsername} liked your comment on "${post?.title || 'a forum post'}"`;
      linkUrl = `/forum-post/${comment.post_id}?comment=${like.comment_id}`;
      relatedEntityId = like.comment_id;
    }

    if (!recipientId || likerId === recipientId) {
      return new Response('ok');
    }
    
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_user_id: recipientId,
        actor_user_id: likerId,
        type: 'forum_like',
        content: notificationContent,
        link_url: linkUrl,
        related_entity_id: relatedEntityId,
      });

    if (notificationError) throw new Error(`Failed to insert notification: ${notificationError.message}`);

    return new Response('ok');
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});