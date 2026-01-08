import React, { useState, useEffect } from 'react';
import { getBlogPosts } from '../services/blogService';
import type { BlogPost, Session, BlogCategory } from '../types';
import { blogCategories } from '../types';
import TrustpilotWidget from '../components/ui/TrustpilotWidget';
import { HeartIcon, CommentIcon } from '../components/ui/Icons';

interface BlogPageProps {
    onSelectPost: (postId: string) => void;
    session: Session | null;
}

const BlogPage: React.FC<BlogPageProps> = ({ onSelectPost, session }) => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            setError('');
            try {
                const categoryToFetch = filter === 'All' ? undefined : filter as BlogCategory;
                const posts = await getBlogPosts(session?.user?.id, categoryToFetch);
                setBlogPosts(posts);
            } catch (err: any) {
                setError('Failed to load blog posts. Please try again later.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, [session, filter]);

    const featuredPost = blogPosts[0];
    const otherPosts = blogPosts.slice(1);
    
    const categories = ['All', ...blogCategories];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight mb-2">The SoftMonk Blog</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">Insights on software, security, and productivity.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <main className="lg:col-span-3">
                    {isLoading && <div className="text-center py-20">Loading posts...</div>}
                    {error && <div className="text-center py-20 text-red-500">{error}</div>}

                    {!isLoading && !error && blogPosts.length > 0 && (
                        <div className="space-y-12">
                            {/* Featured Post */}
                            {featuredPost && (
                                <article 
                                    className="group relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                                    onClick={() => onSelectPost(featuredPost.id)}
                                >
                                    <div className="absolute inset-0">
                                        <img src={featuredPost.image} alt={featuredPost.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                    </div>
                                    <div className="relative p-8 text-white flex flex-col justify-end h-[400px]">
                                        <h2 className="text-3xl font-bold mb-2 leading-tight">{featuredPost.title}</h2>
                                        <p className="text-gray-200 mb-4 line-clamp-2">{featuredPost.excerpt}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <img src={featuredPost.author_avatar_url} alt={featuredPost.author} className="h-8 w-8 rounded-full object-cover border-2 border-white/50" />
                                                <span>{featuredPost.author}</span>
                                            </div>
                                            <span>&bull;</span>
                                            <span>{featuredPost.date}</span>
                                        </div>
                                    </div>
                                </article>
                            )}

                            {/* Other Posts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {otherPosts.map((post) => (
                                    <article 
                                        key={post.id} 
                                        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700/50 transition-shadow duration-300 hover:shadow-xl cursor-pointer"
                                        onClick={() => onSelectPost(post.id)}
                                    >
                                        <div className="overflow-hidden">
                                            <img src={post.image} alt={post.title} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" />
                                        </div>
                                        <div className="p-6">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{post.date}</p>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 line-clamp-2 h-14">{post.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 h-[60px]">{post.excerpt}</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <img src={post.author_avatar_url} alt={post.author} className="h-8 w-8 rounded-full object-cover" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{post.author}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1" title={`${post.like_count ?? 0} likes`}><HeartIcon className="h-4 w-4" />{post.like_count ?? 0}</span>
                                                    <span className="flex items-center gap-1" title={`${post.comment_count ?? 0} comments`}><CommentIcon className="h-4 w-4" />{post.comment_count ?? 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}
                     {!isLoading && !error && blogPosts.length === 0 && (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                            <h3 className="text-2xl font-bold">No posts found</h3>
                            <p>There are no posts in this category yet. Check back soon!</p>
                        </div>
                    )}
                </main>
                <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-24 self-start">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-lg">Categories</h3>
                        <div className="flex flex-col space-y-2">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setFilter(cat)} className={`w-full text-left px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filter === cat ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-lg">Recent Posts</h3>
                        <div className="space-y-3">
                            {blogPosts.slice(0, 4).map(post => (
                                <button key={post.id} onClick={() => onSelectPost(post.id)} className="text-left group">
                                    <p className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{post.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{post.date}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <TrustpilotWidget />
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default BlogPage;