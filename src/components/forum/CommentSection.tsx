import React, { useState, useEffect, useCallback } from 'react';
import * as forumService from '../../services/forumService';
import type { Session, ForumComment } from '../../types';
import { EmojiIcon } from '../ui/Icons';
import EmojiPicker from '../ui/EmojiPicker';
import CommentWithReplies from './CommentWithReplies';

interface CommentSectionProps {
    postId: string;
    session: Session | null;
    onLoginClick: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, session, onLoginClick }) => {
    const [comments, setComments] = useState<ForumComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedComments = await forumService.getCommentsForPost(postId, session?.user.id);
            setComments(fetchedComments);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setIsLoading(false);
        }
    }, [postId, session]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) { onLoginClick(); return; }
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        setShowEmojiPicker(false);
        try {
            // Top-level comments have a null parentCommentId
            await forumService.createComment({ postId, userId: session.user.id, content: newComment, parentCommentId: null });
            setNewComment('');
            fetchComments(); // Re-fetch all comments to get the new one
        } catch (err) { console.error("Error posting comment:", err); }
        finally { setIsSubmitting(false); }
    };

    // Build the comment tree from the flat list
    const commentTree = comments.reduce((acc: Record<string, ForumComment & { children: ForumComment[] }>, comment: ForumComment) => {
        // All comments in the accumulator will have a `children` array.
        const newComment = { ...comment, children: [] as ForumComment[] };
        acc[String(comment.id)] = newComment;

        // If it's a reply, find the parent and add this comment to its children.
        if (comment.parent_comment_id) {
            const parent = acc[String(comment.parent_comment_id)];
            if (parent) {
                // The parent is guaranteed to have a `children` array from when it was created as a `newComment`.
                parent.children.push(newComment);
            }
        }
        return acc;
    }, {} as Record<string, ForumComment & { children: ForumComment[] }>);


    const rootComments = Object.values(commentTree).filter(c => !c.parent_comment_id);

    return (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{comments.length} Comments</h3>
            {session ? (
                <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 mb-6">
                    <img src={session.user.user_metadata?.custom_avatar_url || session.user.user_metadata?.avatar_url || '/images/logo.png'} alt="your avatar" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1">
                        <div className="relative">
                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} placeholder="Add to the discussion..." className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm transition" />
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(prev => !prev)}
                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full"
                                    aria-label="Add emoji"
                                >
                                    <EmojiIcon />
                                </button>
                            </div>
                            {showEmojiPicker && (
                                <EmojiPicker
                                    onEmojiSelect={(emoji) => setNewComment(prev => prev + emoji)}
                                    onClose={() => setShowEmojiPicker(false)}
                                />
                            )}
                        </div>
                        <div className="text-right mt-2">
                            <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400">
                                {isSubmitting ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="text-center p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                    <button onClick={onLoginClick} className="font-bold text-green-600 dark:text-green-400 hover:underline">Sign in</button>
                    <span className="text-gray-700 dark:text-gray-300"> to leave a comment.</span>
                </div>
            )}
            {isLoading && <p className="text-sm text-center text-gray-500 dark:text-gray-400">Loading comments...</p>}
            <div className="space-y-4">
                {rootComments.map((comment) => (
                    <CommentWithReplies
                        // FIX: Add a type assertion to `comment`. This resolves a TypeScript error where the compiler
                        // incorrectly infers the type of `comment` as `unknown`, preventing property access for the `key`.
                        key={(comment as ForumComment).id}
                        comment={comment}
                        postId={postId}
                        session={session}
                        onLoginClick={onLoginClick}
                        onCommentPosted={fetchComments}
                    />
                ))}
            </div>
        </div>
    );
};

export default CommentSection;
