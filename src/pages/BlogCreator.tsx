import React, { useState } from 'react';
import { saveBlogPost } from '../services/blogService';
import { CloseIcon } from '../components/ui/Icons';

interface BlogCreatorProps {
    onPostCreated: () => void;
    onCancel: () => void;
}

const BlogCreator: React.FC<BlogCreatorProps> = ({ onPostCreated, onCancel }) => {
    const [title, setTitle] = useState('');
    const [image, setImage] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !image || !excerpt || !content) {
            setError('All fields are required.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            saveBlogPost({ title, image, excerpt, content });
            // Let parent handle navigation
            onPostCreated(); 
        } catch (err) {
            console.error("Failed to save post", err);
            setError('Failed to save the post. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 sm:p-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create a New Blog Post</h1>
                <button onClick={onCancel} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Cancel">
                    <CloseIcon />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Post Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
                        placeholder="e.g., Top 5 Free Utilities"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Header Image URL</label>
                    <input
                        id="image"
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
                        placeholder="https://example.com/image.png"
                        disabled={isLoading}
                    />
                </div>
                
                 <div>
                    <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excerpt</label>
                    <textarea
                        id="excerpt"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:outline-none resize-y"
                        rows={3}
                        placeholder="A short summary of the blog post..."
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Content</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:outline-none resize-y"
                        rows={12}
                        placeholder="Write your blog post here. Use **text** for bold."
                        disabled={isLoading}
                    />
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <div className="flex justify-end gap-4">
                     <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Publishing...' : 'Publish Post'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BlogCreator;