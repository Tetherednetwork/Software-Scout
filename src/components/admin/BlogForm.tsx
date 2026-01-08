import React, { useState, useEffect, useRef } from 'react';
import type { BlogPost, BlogCategory } from '../../types';
import { blogCategories } from '../../types';
import { CloseIcon } from '../ui/Icons';
import EditorToolbar from '../ui/EditorToolbar';
import { htmlToCustomMarkdown } from '../../utils/pasteHelper';

interface BlogFormProps {
    initialData?: Partial<BlogPost> | null;
    onSave: (post: Partial<BlogPost>) => Promise<void>;
    onCancel: () => void;
}

const BlogForm: React.FC<BlogFormProps> = ({ initialData, onSave, onCancel }) => {
    const [post, setPost] = useState<Partial<BlogPost>>(initialData || { content: '', category: 'Security' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setPost(initialData || { content: '', category: 'Security' });
    }, [initialData]);

    const handleContentChange = (newContent: string) => {
        setPost(prev => ({ ...prev, content: newContent }));
    };

    const handleSelectionChange = () => {
        const textarea = contentRef.current;
        if (textarea) {
            setSelection({ start: textarea.selectionStart, end: textarea.selectionEnd });
        }
    };

    useEffect(() => {
        const checkActiveFormats = () => {
            const textarea = contentRef.current;
            if (!textarea) return;

            const { value, selectionStart, selectionEnd } = textarea;
            const formats: Record<string, boolean> = {};

            const checkWrapper = (prefix: string, suffix: string) => {
                const textBefore = value.substring(0, selectionStart);
                const textAfter = value.substring(selectionEnd);
                return textBefore.endsWith(prefix) && textAfter.startsWith(suffix);
            };

            formats.bold = checkWrapper('**', '**');
            formats.italic = checkWrapper('*', '*');
            formats.underline = checkWrapper('<u>', '</u>');
            formats.strikethrough = checkWrapper('<s>', '</s>');

            const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
            const currentLine = value.substring(currentLineStart, value.indexOf('\n', selectionStart));
            formats.ul = /^\s*\*\s/.test(currentLine);
            formats.ol = /^\s*\d+\.\s/.test(currentLine);

            setActiveFormats(formats);
        };
        checkActiveFormats();
    }, [selection, post.content]);

    const applyFormat = (prefix: string, suffix: string) => {
        const textarea = contentRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        const textBefore = value.substring(0, start);
        const textAfter = value.substring(end);
        const selectedText = value.substring(start, end);

        if (textBefore.endsWith(prefix) && textAfter.startsWith(suffix)) {
            const newContent = textBefore.slice(0, -prefix.length) + selectedText + textAfter.slice(suffix.length);
            handleContentChange(newContent);
            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = start - prefix.length;
                textarea.selectionEnd = end - prefix.length;
                handleSelectionChange();
            }, 0);
        } else {
            const newContent = textBefore + prefix + selectedText + suffix + textAfter;
            handleContentChange(newContent);
            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = start + prefix.length;
                textarea.selectionEnd = end + prefix.length;
                handleSelectionChange();
            }, 0);
        }
    };
    
    const insertText = (textToInsert: string) => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        const newContent = value.substring(0, start) + textToInsert + value.substring(end);
        handleContentChange(newContent);
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
            handleSelectionChange();
        }, 0);
    };

    const applyListFormat = (marker: string) => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const { value, selectionStart, selectionEnd } = textarea;
        const startLine = value.substring(0, selectionStart).split('\n').length - 1;
        const endLine = value.substring(0, selectionEnd).split('\n').length - 1;

        const lines = value.split('\n');
        const isRemoving = lines.slice(startLine, endLine + 1).every(line => line.trim().startsWith(marker));
        let newSelectionStart = selectionStart;
        
        const newLines = lines.map((line, i) => {
            if (i >= startLine && i <= endLine && line.trim()) {
                if (isRemoving) {
                    const newLine = line.replace(new RegExp(`^\\s*${marker.replace('*', '\\*')}\\s?`), '');
                    if (i === startLine) newSelectionStart -= line.length - newLine.length;
                    return newLine;
                } else {
                    if (i === startLine) newSelectionStart += marker.length + 1;
                    return `${marker} ${line.replace(/^\s*(\*|\d+\.)\s?/, '')}`;
                }
            }
            return line;
        });

        handleContentChange(newLines.join('\n'));
        setTimeout(() => {
            textarea.focus();
            // This is a simplified selection update
            textarea.selectionStart = textarea.selectionEnd = newSelectionStart;
            handleSelectionChange();
        }, 0);
    };
    
    const applyBlockFormat = (type: 'quote' | 'align', value?: 'left' | 'center' | 'right') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const { value: text, selectionStart, selectionEnd } = textarea;
        
        // Find the start and end of the line(s) containing the selection
        const startOfLine = text.lastIndexOf('\n', selectionStart - 1) + 1;
        let endOfLine = text.indexOf('\n', selectionEnd);
        if (endOfLine === -1) endOfLine = text.length;

        const block = text.substring(startOfLine, endOfLine);

        if (type === 'quote') {
            const lines = block.split('\n');
            const isQuoted = lines.every(line => line.trim().startsWith('> '));
            const newLines = lines.map(line => isQuoted ? line.replace(/^> /, '') : `> ${line}`);
            const newBlock = newLines.join('\n');
            handleContentChange(text.substring(0, startOfLine) + newBlock + text.substring(endOfLine));
        } else if (type === 'align' && value) {
            const alignTag = `[${value}]`;
            const endAlignTag = `[/${value}]`;
            
            // This is a simple implementation: it wraps the entire block.
            // A more complex implementation would find and remove existing align tags.
            const newBlock = `${alignTag}\n${block}\n${endAlignTag}`;
             handleContentChange(text.substring(0, startOfLine) + newBlock + text.substring(endOfLine));
        }
    };


    const handleCommand = (command: string, value?: string) => {
        switch(command) {
            case 'bold': applyFormat('**', '**'); break;
            case 'italic': applyFormat('*', '*'); break;
            case 'underline': applyFormat('<u>', '</u>'); break;
            case 'strikethrough': applyFormat('<s>', '</s>'); break;
            case 'ul': applyListFormat('*'); break;
            case 'ol': applyListFormat('1.'); break;
            case 'quote': applyBlockFormat('quote'); break;
            case 'image':
                const url = prompt("Enter the image URL:");
                if (url) {
                    insertText(`![Image](${url})`);
                }
                break;
            case 'align': applyBlockFormat('align', value as any); break;
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.ctrlKey) {
            switch(e.key) {
                case 'b': e.preventDefault(); handleCommand('bold'); break;
                case 'i': e.preventDefault(); handleCommand('italic'); break;
                case 'u': e.preventDefault(); handleCommand('underline'); break;
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedHtml = e.clipboardData.getData('text/html');
        if (pastedHtml) {
            e.preventDefault();
            const markdown = htmlToCustomMarkdown(pastedHtml);
            const textarea = contentRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                const newContent = value.substring(0, start) + markdown + value.substring(end);
                handleContentChange(newContent);
                setTimeout(() => {
                    textarea.focus();
                    textarea.selectionStart = textarea.selectionEnd = start + markdown.length;
                    handleSelectionChange();
                }, 0);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!post.title || !post.excerpt || !post.content || !post.image || !post.category) {
            setError('All fields, including category, are required.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await onSave(post);
        } catch (err: any) {
            setError(err.message || 'Failed to save post.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{post.id ? 'Edit Blog Post' : 'Create New Blog Post'}</h2>
                    <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                        <input type="text" name="title" value={post.title || ''} onChange={(e) => setPost(p => ({...p, title: e.target.value}))} required className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                    </div>
                     <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL *</label>
                        <input type="url" name="image" value={post.image || ''} onChange={(e) => setPost(p => ({...p, image: e.target.value}))} required className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excerpt *</label>
                        <textarea name="excerpt" value={post.excerpt || ''} onChange={(e) => setPost(p => ({...p, excerpt: e.target.value}))} required rows={3} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500"></textarea>
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                        <select 
                            id="category"
                            name="category" 
                            value={post.category || ''} 
                            onChange={(e) => setPost(p => ({...p, category: e.target.value as BlogCategory}))} 
                            required 
                            className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500"
                        >
                            <option value="" disabled>Select a category</option>
                            {blogCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-md focus-within:ring-2 focus-within:ring-green-500 overflow-hidden">
                           <EditorToolbar onCommand={handleCommand} activeFormats={activeFormats} />
                            <textarea
                                ref={contentRef}
                                name="content"
                                value={post.content || ''}
                                onChange={(e) => handleContentChange(e.target.value)}
                                onSelect={handleSelectionChange}
                                onKeyUp={handleSelectionChange}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                required
                                rows={10}
                                className="w-full bg-gray-100 dark:bg-gray-700 p-2 border-t border-gray-200 dark:border-gray-600 focus:outline-none"
                            ></textarea>
                        </div>
                    </div>
                   
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300">
                            {isLoading ? 'Saving...' : 'Save Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlogForm;