import React, { useState, useEffect, useCallback } from 'react';
import * as blogService from '../../services/blogService';
import type { Session, BlogComment } from '../../types';
import { HeartIcon, EmojiIcon } from '../ui/Icons';
import EmojiPicker from '../ui/EmojiPicker';

interface CommentSectionProps {
    postId: string;
    session: Session | null;
    onLoginClick: () => void;
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

const CommentSection: React.FC<CommentSectionProps> = ({ postId, session, onLoginClick }) => {
    const [comments, setComments] = useState<BlogComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedComments = await blogService.getCommentsForPost(postId, session?.user.id);
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
            const createdComment = await blogService.createComment({ postId, userId: session.user.id, content: newComment });
            setComments(prev => [...prev, createdComment]);
            setNewComment('');
        } catch (err) { 
            console.error("Error posting comment:", err); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleLikeToggle = async (commentId: number) => {
        if (!session) { onLoginClick(); return; }
        
        const originalComments = [...comments];
        const updatedComments = comments.map(c => 
            c.id === commentId 
            ? { ...c, user_has_liked: !c.user_has_liked, like_count: c.user_has_liked ? c.like_count - 1 : c.like_count + 1 }
            : c
        );
        setComments(updatedComments);

        try {
             const result = await blogService.toggleCommentLike({ commentId, userId: session.user.id });
             setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: result.newLikeCount, user_has_liked: result.userHasLiked } : c));
        } catch (err) { 
            console.error(`Error toggling comment like:`, err); 
            setComments(originalComments);
        }
    };

    return (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{comments.length} Comments</h3>

            {session ? (
                <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 mb-6">
                    <img src={session.user.user_metadata?.custom_avatar_url || session.user.user_metadata?.avatar_url || '/images/logo.png'} alt="your avatar" className="h-10 w-10 rounded-full object-cover" />
                    <div className="flex-1">
                        <div className="relative">
                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} placeholder="Add to the discussion..." className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 pr-10 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"></textarea>
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(prev => !prev)}
                                className="absolute top-2 right-2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full"
                                aria-label="Add emoji"
                            >
                                <EmojiIcon />
                            </button>
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
                <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6">
                    <button onClick={onLoginClick} className="font-bold text-green-600 dark:text-green-400 hover:underline">Sign in</button>
                    <span className="text-gray-700 dark:text-gray-300"> to leave a comment.</span>
                </div>
            )}

            {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>}
            <div className="space-y-4">
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <img src={comment.author.avatar_url || '/images/logo.png'} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                        <div className="flex-1">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comment.author.username}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                            <div className="mt-1 flex items-center gap-3 pl-3">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                                <button onClick={() => handleLikeToggle(comment.id)} className={`flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 transition-colors ${comment.user_has_liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}>
                                    <HeartIcon className="h-4 w-4" filled={comment.user_has_liked} />
                                    <span>{comment.like_count}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommentSection;