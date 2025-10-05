

import React, { useState, useEffect } from 'react';
import { getBlogPosts } from './services/blogService';
import type { BlogPost } from './types';
import { PlusIcon } from './components/Icons';

interface BlogPageProps {
    onSelectPost: (postId: string) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({ onSelectPost }) => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        // Fetch posts when the component mounts
        setBlogPosts(getBlogPosts());
    }, []);

    return (
        <div className="p-6 sm:p-10">
            <div className="text-center mb-10 relative">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">The SoftMonk Blog</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">Insights on software, security, and productivity.</p>
            </div>

            <div className="space-y-12">
                {blogPosts.map((post) => (
                    <article key={post.id} className="flex flex-col md:flex-row items-center gap-8">
                        <div className="md:w-1/3">
                            <img src={post.image} alt={post.title} className="w-full h-auto rounded-xl shadow-lg object-cover aspect-video" />
                        </div>
                        <div className="md:w-2/3">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{post.date}</p>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">{post.title}</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{post.excerpt}</p>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{post.author}</p>
                                <button
                                    onClick={() => onSelectPost(post.id)}
                                    className="font-semibold text-green-600 dark:text-green-400 hover:underline"
                                >
                                    Read More →
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default BlogPage;
