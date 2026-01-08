import React, { useEffect, useState, useCallback } from 'react';
import { getBlogPostById, togglePostLike, getBlogPosts } from '../services/blogService';
import type { BlogPost, Session } from '../types';
import { ChevronLeftIcon, HeartIcon } from '../components/ui/Icons';
import CommentSection from '../components/blog/CommentSection';
import ShareButtons from '../components/blog/ShareButtons';
import FormattedContent from '../components/ui/FormattedContent';
import TrustpilotWidget from '../components/ui/TrustpilotWidget';

interface BlogPostPageProps {
    postId: string;
    onBack: () => void;
    session: Session | null;
    onLoginClick: () => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ postId, onBack, session, onLoginClick }) => {
    const [post, setPost] = useState<BlogPost | null>(null);
    const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPostData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [foundPost, allPosts] = await Promise.all([
                getBlogPostById(postId, session?.user.id),
                getBlogPosts(session?.user.id)
            ]);

            setPost(foundPost);
            
            const otherRecentPosts = allPosts.filter(p => p.id !== postId).slice(0, 4);
            setRecentPosts(otherRecentPosts);

        } catch (err: any) {
            setError("Could not load the blog post.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [postId, session]);

    useEffect(() => {
        fetchPostData();
    }, [fetchPostData]);
    
    const handleRecentPostClick = (newPostId: string) => {
        window.history.pushState({}, '', `/blog-post/${newPostId}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleLikeToggle = async () => {
        if (!session) { onLoginClick(); return; }
        if (!post) return;
        
        const originalPost = { ...post };
        setPost(prev => prev ? ({
            ...prev,
            user_has_liked: !prev.user_has_liked,
            like_count: prev.user_has_liked ? (prev.like_count ?? 1) - 1 : (prev.like_count ?? 0) + 1
        }) : null);

        try {
            const result = await togglePostLike({ postId: post.id, userId: session.user.id });
            setPost(prev => prev ? ({ ...prev, like_count: result.newLikeCount, user_has_liked: result.userHasLiked }) : null);
        } catch (err) {
            console.error("Failed to toggle like:", err);
            setPost(originalPost);
        }
    };

    if (isLoading) {
        return (
            <div className="p-10 space-y-8 animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
                <button onClick={onBack} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
                    <ChevronLeftIcon /> Back to Blogs
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-xl mx-auto">
                <button onClick={onBack} className="inline-flex items-center gap-2 mb-8 text-green-600 dark:text-green-400 font-semibold hover:underline">
                    <ChevronLeftIcon />
                    Back to All Blogs
                </button>

                <div className="lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
                    {/* Main Content Column */}
                    <main className="lg:col-span-2">
                        <article>
                            <img src={post.image} alt={post.title} className="w-full h-auto max-h-[500px] object-cover rounded-2xl shadow-lg mb-8" />
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight font-display">{post.title}</h1>
                            
                            <div className="max-w-prose">
                                <FormattedContent content={post.content || ''} />
                            </div>
                        </article>
                        
                        <div className="max-w-prose mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <button onClick={handleLikeToggle} className={`flex items-center gap-2 font-semibold rounded-full px-4 py-2 transition-colors ${post.user_has_liked ? 'text-red-600 bg-red-100 dark:bg-red-900/50' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <HeartIcon filled={post.user_has_liked} className="h-5 w-5" />
                                <span>{post.like_count ?? 0} Likes</span>
                            </button>
                            <ShareButtons url={window.location.href} title={post.title} />
                        </div>

                        <div className="max-w-prose mt-4">
                             <CommentSection postId={post.id} session={session} onLoginClick={onLoginClick} />
                        </div>
                    </main>
                    
                    {/* Sticky Sidebar */}
                    <aside className="lg:col-span-1 space-y-8 mt-12 lg:mt-0 lg:sticky lg:top-24 self-start">
                        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">About the Author</h3>
                             <div className="flex items-center gap-4">
                                <img src={post.author_avatar_url || '/images/logo.png'} alt="author" className="h-16 w-16 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{post.author}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{post.date}</p>
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
                                            onClick={() => handleRecentPostClick(recentPost.id)}
                                            className="text-left group block w-full"
                                        >
                                            <p className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-tight">{recentPost.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{recentPost.date}</p>
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

export default BlogPostPage;
