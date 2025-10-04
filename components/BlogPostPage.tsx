
import React, { useEffect, useState } from 'react';
import { getBlogPostById } from '../services/blogService';
import type { BlogPost } from '../types';
import { ChevronLeftIcon } from './Icons';

interface BlogPostPageProps {
    postId: string;
    onBack: () => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ postId, onBack }) => {
    const [post, setPost] = useState<BlogPost | null>(null);

    useEffect(() => {
        const foundPost = getBlogPostById(postId);
        if (foundPost) {
            setPost(foundPost);
        }
    }, [postId]);

    // Simple markdown parser for bold text and newlines
    const formatContent = (content: string) => {
        const html = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\n/g, '<br />'); // Newlines
        return { __html: html };
    };

    if (!post) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Post not found</h2>
                <button
                    onClick={onBack}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                    <ChevronLeftIcon />
                    Back to Blogs
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8">
            <button
                onClick={onBack}
                className="inline-flex items-center gap-2 mb-6 text-green-600 dark:text-green-400 font-semibold hover:underline"
            >
                <ChevronLeftIcon />
                Back to All Blogs
            </button>

            <article>
                <img src={post.image} alt={post.title} className="w-full h-auto max-h-96 object-cover rounded-xl shadow-lg mb-6" />
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">{post.title}</h1>
                <div className="flex items-center gap-4 mb-8 text-sm text-gray-500 dark:text-gray-400">
                    <span>{post.author}</span>
                    <span>&bull;</span>
                    <span>{post.date}</span>
                </div>
                <div 
                    className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                    dangerouslySetInnerHTML={formatContent(post.content)}
                />
            </article>
        </div>
    );
};

export default BlogPostPage;