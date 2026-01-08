import React, { useState, useEffect, useCallback } from 'react';
import * as forumService from '../services/forumService';
import type { Session, ForumPost } from '../types';
import { HeartIcon, CommentIcon, PlusIcon, SearchIcon } from '../components/ui/Icons';
import CreatePostModal from '../components/forum/CreatePostModal';
import TrustpilotWidget from '../components/ui/TrustpilotWidget';

interface ForumPageProps {
    session: Session | null;
    onLoginClick: () => void;
    isAdmin: boolean;
    onSelectPost: (postId: string) => void;
}

const ForumPage: React.FC<ForumPageProps> = ({ session, onLoginClick, isAdmin, onSelectPost }) => {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
    const [postSubmittedMessage, setPostSubmittedMessage] = useState('');
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const categories: ForumPost['category'][] = ['CyberSecurity', 'New Softwares', 'Install/Deployments', 'Updates', 'Trending'];
    const allCategories = ['All', ...categories];

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const categoryToFetch = filter === 'All' ? undefined : filter;
            const fetchedPosts = await forumService.getPosts(session?.user?.id, categoryToFetch);
            setPosts(fetchedPosts);
        } catch (err: any) {
            setError(err.message || 'Failed to load forum posts.');
        } finally {
            setIsLoading(false);
        }
    }, [session, filter]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePostSuccess = () => {
        setIsPostModalOpen(false);
        setEditingPost(null);
        setPostSubmittedMessage(editingPost ? 'Your post has been updated.' : (isAdmin ? 'Your post has been published.' : 'Your post has been submitted for review.'));
        fetchPosts();
        setTimeout(() => setPostSubmittedMessage(''), 5000);
    };

    const handleCreatePostClick = () => {
        if (!session) { onLoginClick(); return; }
        setEditingPost(null);
        setIsPostModalOpen(true);
    };

    const filteredPosts = posts.filter(post =>
        (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.content || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const featuredPost = filteredPosts[0];
    const otherPosts = filteredPosts.slice(1);

    const getExcerpt = (content: string, length = 100) => {
        if (!content) return '';
        if (content.length <= length) return content;
        return content.substring(0, length) + '...';
    };

    const getCategoryColors = (category: ForumPost['category']): string => {
        const categoryColorMap: Record<string, string> = {
            'CyberSecurity': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            'New Softwares': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            'Install/Deployments': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            'Updates': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
            'Trending': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
            'Discussion': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', // Keep for old posts
        };
        return categoryColorMap[category] || 'bg-gray-100 text-gray-800';
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight mb-2">Community Forum</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">Search for topics, ask questions, or share your knowledge.</p>
            </div>

            {postSubmittedMessage && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-center font-semibold">
                    {postSubmittedMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <main className="lg:col-span-3">
                    {isLoading && <div className="text-center py-20">Loading posts...</div>}
                    {error && <div className="text-center py-20 text-red-500">{error}</div>}

                    {!isLoading && !error && filteredPosts.length > 0 && (
                        <div className="space-y-12">
                            {featuredPost && (
                                <article
                                    className="group relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                                    onClick={() => onSelectPost(String(featuredPost.id))}
                                >
                                    <div className="absolute inset-0">
                                        {featuredPost.image_url ? (
                                            <img src={featuredPost.image_url} alt={featuredPost.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700"></div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                    </div>
                                    <div className="relative p-8 text-white flex flex-col justify-end h-[400px]">
                                        <h2 className="text-3xl font-bold mb-2 leading-tight">{featuredPost.title}</h2>
                                        <p className="text-gray-200 mb-4 line-clamp-2">{getExcerpt(featuredPost.content, 150)}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <img src={featuredPost.author.avatar_url} alt={featuredPost.author.username} className="h-8 w-8 rounded-full object-cover border-2 border-white/50" />
                                                <span>{featuredPost.author.username}</span>
                                            </div>
                                            <span>&bull;</span>
                                            <span>{new Date(featuredPost.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </article>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {otherPosts.map((post) => (
                                    <article
                                        key={post.id}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700/50 transition-shadow duration-300 hover:shadow-xl cursor-pointer"
                                        onClick={() => onSelectPost(String(post.id))}
                                    >
                                        <div className="overflow-hidden h-48">
                                            {post.image_url ? (
                                                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            ) : (
                                                <div className={`h-full flex items-center justify-center ${getCategoryColors(post.category).replace('text-', 'bg-').split(' ')[0]}`}>
                                                    <p className={`text-4xl font-bold ${getCategoryColors(post.category).split(' ')[1]}`}>{post.category.charAt(0)}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <p className={`text-xs font-bold uppercase tracking-wider ${getCategoryColors(post.category).split(' ')[1]}`}>{post.category}</p>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 my-2 line-clamp-2 h-14">{post.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 h-[60px]">{getExcerpt(post.content)}</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <img src={post.author.avatar_url} alt={post.author.username} className="h-8 w-8 rounded-full object-cover" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{post.author.username}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1" title={`${post.like_count} likes`}><HeartIcon className="h-4 w-4" />{post.like_count}</span>
                                                    <span className="flex items-center gap-1" title={`${post.comment_count} comments`}><CommentIcon className="h-4 w-4" />{post.comment_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}
                    {!isLoading && !error && filteredPosts.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50">
                            <h3 className="text-xl font-bold">No posts found</h3>
                            <p>No posts match your search or filter. {filter !== 'All' && 'Try selecting another category or be the first to post!'}</p>
                        </div>
                    )}
                </main>
                <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-24 self-start">
                    <div>
                        <button onClick={handleCreatePostClick} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                            <PlusIcon /> {isAdmin ? 'Create Admin Post' : 'Create New Post'}
                        </button>
                    </div>
                    <div>
                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search forum..."
                                className="w-full p-2 pl-10 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                aria-label="Search forum posts"
                            />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-lg">Categories</h3>
                        <div className="flex flex-col space-y-2">
                            {allCategories.map(cat => (
                                <button key={cat} onClick={() => setFilter(cat)} className={`w-full text-left px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filter === cat ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-lg">Recent Posts</h3>
                        <div className="space-y-3">
                            {posts.slice(0, 4).map(post => (
                                <button key={post.id} onClick={() => onSelectPost(String(post.id))} className="text-left group">
                                    <p className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{post.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <TrustpilotWidget />
                    </div>
                </aside>
            </div>

            <CreatePostModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                session={session!}
                onSuccess={handlePostSuccess}
                isAdmin={isAdmin}
                postToEdit={editingPost}
            />
        </div>
    );
};

export default ForumPage;