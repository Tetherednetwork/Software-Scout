import React, { useState } from 'react';
import type { Session, ForumComment } from '../../types';
import * as forumService from '../../services/forumService';
import { HeartIcon, EmojiIcon } from '../ui/Icons';
import FormattedContent from '../ui/FormattedContent';
import EmojiPicker from '../ui/EmojiPicker';

interface CommentWithRepliesProps {
    comment: ForumComment;
    postId: string;
    session: Session | null;
    onLoginClick: () => void;
    onCommentPosted: () => void; // Callback to refresh comments list
}

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};

const CommentWithReplies: React.FC<CommentWithRepliesProps> = ({ comment, postId, session, onLoginClick, onCommentPosted }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [localLikeCount, setLocalLikeCount] = useState(comment.like_count);
    const [userHasLiked, setUserHasLiked] = useState(comment.user_has_liked);

    const handleReplyClick = () => {
        if (!session) { onLoginClick(); return; }
        setIsReplying(prev => !prev);
        setReplyContent(`@${comment.author.username} `);
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) { onLoginClick(); return; }
        if (!replyContent.trim()) return;
        setIsSubmitting(true);
        try {
            await forumService.createComment({
                postId,
                userId: session.user.id,
                content: replyContent,
                parentCommentId: comment.id
            });
            setReplyContent('');
            setIsReplying(false);
            onCommentPosted(); // Trigger refresh in parent
        } catch (error) {
            console.error("Failed to post reply:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeToggle = async () => {
        if (!session) { onLoginClick(); return; }

        // Optimistic update
        setUserHasLiked(prev => !prev);
        setLocalLikeCount(prev => userHasLiked ? prev - 1 : prev + 1);

        try {
            const result = await forumService.toggleLike({ commentId: comment.id, userId: session.user.id });
            setLocalLikeCount(result.newLikeCount);
            setUserHasLiked(result.userHasLiked);
        } catch (err) {
            console.error(`Error toggling comment like:`, err);
            // Revert optimistic update on failure
            setUserHasLiked(comment.user_has_liked);
            setLocalLikeCount(comment.like_count);
        }
    };

    return (
        <div id={`comment-${comment.id}`} className="flex items-start gap-3">
            <img src={comment.author.avatar_url || '/images/logo.png'} alt="avatar" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comment.author.username}</p>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <FormattedContent content={comment.content} />
                    </div>
                </div>
                <div className="mt-1 flex items-center gap-3 pl-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                    <button onClick={handleLikeToggle} className={`flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 transition-colors ${userHasLiked ? 'text-red-500 bg-red-100 dark:bg-red-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                        <HeartIcon className="h-4 w-4" filled={userHasLiked} />
                        <span>{localLikeCount}</span>
                    </button>
                    <button onClick={handleReplyClick} className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:underline">Reply</button>
                </div>

                {isReplying && session && (
                    <form onSubmit={handleReplySubmit} className="flex items-start gap-3 mt-3">
                        <img src={session.user.user_metadata?.custom_avatar_url || session.user.user_metadata?.avatar_url || '/images/logo.png'} alt="your avatar" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                        <div className="flex-1">
                            <div className="relative">
                                <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={2} placeholder={`Replying to @${comment.author.username}...`} className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-2 pr-10 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm transition" autoFocus />
                                <div className="absolute top-1 right-1 flex items-center gap-1">
                                    <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full" aria-label="Add emoji">
                                        <EmojiIcon />
                                    </button>
                                </div>
                                {showEmojiPicker && (
                                    <EmojiPicker
                                        onEmojiSelect={(emoji) => setReplyContent(prev => prev + emoji)}
                                        onClose={() => setShowEmojiPicker(false)}
                                    />
                                )}
                            </div>
                            <div className="text-right mt-1 space-x-2">
                                <button type="button" onClick={() => setIsReplying(false)} className="text-xs font-semibold text-gray-500 hover:underline">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 disabled:bg-green-400">
                                    {isSubmitting ? 'Replying...' : 'Reply'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {comment.children && comment.children.length > 0 && (
                    <div className="mt-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                        {comment.children.map(child => (
                            <CommentWithReplies
                                key={child.id}
                                comment={child}
                                postId={postId}
                                session={session}
                                onLoginClick={onLoginClick}
                                onCommentPosted={onCommentPosted}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentWithReplies;