import React, { useEffect, useState, useCallback } from 'react';
import { getPostById, getPosts, toggleLike } from '../services/forumService';
import type { ForumPost, Session } from '../types';
import { ChevronLeftIcon, HeartIcon } from '../components/ui/Icons';
import CommentSection from '../components/forum/CommentSection';
import ShareButtons from '../components/blog/ShareButtons';
import FormattedContent from '../components/ui/FormattedContent';
import TrustpilotWidget from '../components/ui/TrustpilotWidget';

interface ForumPostPageProps {
    postId: number;
    onBack: () => void;
    session: Session | null;
    onLoginClick: () => void;
}

const ForumPostPage: React.FC<ForumPostPageProps> = ({ postId, onBack, session, onLoginClick }) => {
    const [post, setPost] = useState<ForumPost | null>(null);
    const [recentPosts, setRecentPosts] = useState<ForumPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPostData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [foundPost, allPosts] = await Promise.all([
                getPostById(postId, session?.user.id),
                getPosts(session?.user.id)
            ]);

            setPost(foundPost);

            const otherRecentPosts = allPosts.filter(p => p.id !== postId).slice(0, 4);
            setRecentPosts(otherRecentPosts);

        } catch (err: any) {
            setError("Could not load the forum post.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [postId, session]);

    useEffect(() => {
        fetchPostData();
    }, [fetchPostData]);

    const handleRecentPostClick = (newPostId: string) => {
        window.history.pushState({}, '', `/forum-post/${newPostId}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleLikeToggle = async () => {
        if (!session) { onLoginClick(); return; }
        if (!post) return;

        const originalPost = { ...post };
        setPost(prev => prev ? ({
            ...prev,
            user_has_liked: !prev.user_has_liked,
            like_count: prev.user_has_liked ? prev.like_count - 1 : prev.like_count + 1
        }) : null);

        try {
            const result = await toggleLike({ postId: post.id, userId: session.user.id });
            setPost(prev => prev ? ({ ...prev, like_count: result.newLikeCount, user_has_liked: result.userHasLiked }) : null);
        } catch (err) {
            console.error("Failed to toggle like:", err);
            setPost(originalPost);
        }
    };

    const categoryColors: Record<string, string> = {
        'CyberSecurity': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'New Softwares': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Install/Deployments': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Updates': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        'Trending': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'Discussion': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    if (isLoading) {
        return (
            <div className="p-10 space-y-8 animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="space-y-4 max-w-prose mx-auto">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-2xl font-bold text-red-500">{error || "Post not found"}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">This post may have been removed or is awaiting approval.</p>
                <button onClick={onBack} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
                    <ChevronLeftIcon /> Back to Forum
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-xl mx-auto">
                <button onClick={onBack} className="inline-flex items-center gap-2 mb-8 text-green-600 dark:text-green-400 font-semibold hover:underline">
                    <ChevronLeftIcon />
                    Back to Forum
                </button>

                <div className="lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
                    <main className="lg:col-span-2">
                        <article>
                            {post.image_url && (
                                <img src={post.image_url} alt={post.title} className="w-full h-auto max-h-[500px] object-cover rounded-2xl shadow-lg mb-8" />
                            )}
                            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mb-4 ${categoryColors[post.category] || 'bg-gray-100 text-gray-800'}`}>
                                {post.category}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight font-display">{post.title}</h1>

                            <div className="max-w-prose">
                                <FormattedContent content={post.content || ''} />
                            </div>
                        </article>

                        <div className="max-w-prose mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <button onClick={handleLikeToggle} className={`flex items-center gap-2 font-semibold rounded-full px-4 py-2 transition-colors ${post.user_has_liked ? 'text-red-600 bg-red-100 dark:bg-red-900/50' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <HeartIcon filled={post.user_has_liked} className="h-5 w-5" />
                                <span>{post.like_count} Likes</span>
                            </button>
                            <ShareButtons url={window.location.href} title={post.title} />
                        </div>

                        <div className="max-w-prose mt-4">
                            <CommentSection postId={String(post.id)} session={session} onLoginClick={onLoginClick} />
                        </div>
                    </main>

                    <aside className="lg:col-span-1 space-y-8 mt-12 lg:mt-0 lg:sticky lg:top-24 self-start">
                        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Posted By</h3>
                            <div className="flex items-center gap-4">
                                <img src={post.author.avatar_url} alt="author" className="h-16 w-16 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{post.author.username}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {recentPosts.length > 0 && (
                            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Recent Posts</h3>
                                <div className="space-y-4">
                                    {recentPosts.map(recentPost => (
                                        <button
                                            key={recentPost.id}
                                            onClick={() => handleRecentPostClick(String(recentPost.id))}
                                            className="text-left group block w-full"
                                        >
                                            <p className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-tight">{recentPost.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(recentPost.created_at).toLocaleDateString()}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <TrustpilotWidget />
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ForumPostPage;