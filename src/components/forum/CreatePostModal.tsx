import React, { useState, useRef, useEffect } from 'react';
import * as forumService from '../../services/forumService';
import type { Session, ForumPost } from '../../types';
import { CloseIcon, PaperclipIcon } from '../ui/Icons';
import EditorToolbar from '../ui/EditorToolbar';
import { htmlToCustomMarkdown } from '../../utils/pasteHelper';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session;
    onSuccess: () => void;
    isAdmin: boolean;
    postToEdit?: ForumPost | null;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, session, onSuccess, isAdmin, postToEdit }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState<ForumPost['category']>('CyberSecurity');
    const [status, setStatus] = useState<'pending' | 'approved'>(isAdmin ? 'approved' : 'pending');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const contentRef = useRef<HTMLTextAreaElement>(null);
    
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

    const categories: ForumPost['category'][] = ['CyberSecurity', 'New Softwares', 'Install/Deployments', 'Updates', 'Trending'];

    useEffect(() => {
        if (isOpen) {
            if (postToEdit) {
                setTitle(postToEdit.title);
                setContent(postToEdit.content);
                setCategory(postToEdit.category);
                setImageUrl(postToEdit.image_url || '');
                // If editing a rejected post, default its status to pending for resubmission.
                setStatus(postToEdit.status === 'rejected' ? 'pending' : postToEdit.status);
                setFile(null); // Files cannot be edited, only added on creation.
            } else {
                // Reset for new post
                setTitle('');
                setContent('');
                setCategory('CyberSecurity');
                setImageUrl('');
                setStatus(isAdmin ? 'approved' : 'pending');
                setFile(null);
            }
            setError(''); // Clear errors when modal opens or post changes
        }
    }, [postToEdit, isOpen, isAdmin]);

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
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
            const { value, selectionStart } = textarea;
            const formats: Record<string, boolean> = {};
            
            const checkWrapper = (prefix: string, suffix: string) => {
                const textBefore = value.substring(0, selectionStart);
                const textAfter = value.substring(selectionStart);
                return textBefore.endsWith(prefix) && textAfter.startsWith(suffix);
            };

            formats.bold = checkWrapper('**', '**');
            formats.italic = checkWrapper('*', '*');
            formats.underline = checkWrapper('<u>', '</u>');
            formats.strikethrough = checkWrapper('<s>', '</s>');
            
            const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
            const currentLine = value.substring(currentLineStart, value.indexOf('\n', selectionStart) !== -1 ? value.indexOf('\n', selectionStart) : value.length);
            formats.ul = /^\s*\*\s/.test(currentLine);
            formats.ol = /^\s*\d+\.\s/.test(currentLine);

            setActiveFormats(formats);
        };
        checkActiveFormats();
    }, [selection, content]);

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
        const startLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
        const endLineIndex = value.substring(0, selectionEnd).split('\n').length - 1;
        const lines = value.split('\n');
        const isRemoving = lines.slice(startLineIndex, endLineIndex + 1).every(line => line.trim().startsWith(marker));
        const newLines = lines.map((line, i) => {
            if (i >= startLineIndex && i <= endLineIndex && line.trim()) {
                if (isRemoving) return line.replace(new RegExp(`^\\s*${marker.replace('*','\\*')}\\s?`), '');
                return `${marker} ${line.replace(/^\s*(\*|\d+\.)\s?/, '')}`;
            }
            return line;
        });
        handleContentChange(newLines.join('\n'));
        setTimeout(() => textarea.focus(), 0);
    };

    const applyBlockFormat = (type: 'quote' | 'align', value?: 'left' | 'center' | 'right') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const { value: text, selectionStart, selectionEnd } = textarea;
        
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
            
            const newBlock = `${alignTag}\n${block}\n${endAlignTag}`;
             handleContentChange(text.substring(0, startOfLine) + newBlock + text.substring(endOfLine));
        }
    };

    const handleCommand = (command: string, value?:string) => {
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
            switch(e.key.toLowerCase()) {
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
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            if (postToEdit) {
                await forumService.updatePost({
                    id: postToEdit.id,
                    title,
                    content,
                    category,
                    image_url: imageUrl,
                    status: status
                });
            } else {
                await forumService.createPost({
                    userId: session.user.id, title, content, file, category,
                    image_url: imageUrl,
                    status: status,
                });
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to submit post.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{postToEdit ? 'Edit Post' : 'Create a New Post'}</h2>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="post-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select id="post-category" value={category} onChange={(e) => setCategory(e.target.value as ForumPost['category'])} className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-3 focus:ring-2 focus:ring-green-500 focus:outline-none">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                         {isAdmin && (
                            <div>
                                <label htmlFor="post-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select id="post-status" value={status} onChange={(e) => setStatus(e.target.value as 'pending' | 'approved')} className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-3 focus:ring-2 focus:ring-green-500 focus:outline-none">
                                    <option value="approved">Approved (Published)</option>
                                    <option value="pending">Pending (Draft)</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input id="post-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post Title..." className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-3 focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    </div>
                     <div>
                        <label htmlFor="post-image-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banner Image URL (Optional)</label>
                        <input id="post-image-url" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-3 focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    </div>
                     <div>
                        <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-md focus-within:ring-2 focus-within:ring-green-500 overflow-hidden">
                           <EditorToolbar onCommand={handleCommand} activeFormats={activeFormats} />
                            <textarea
                                ref={contentRef}
                                id="post-content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onSelect={handleSelectionChange}
                                onKeyUp={handleSelectionChange}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                placeholder="What's on your mind?"
                                rows={6}
                                className="w-full bg-gray-100 dark:bg-gray-700 p-3 border-t border-gray-200 dark:border-gray-600 focus:outline-none resize-y"
                            ></textarea>
                        </div>
                    </div>
                    {!postToEdit && (
                        <div>
                            <label htmlFor="file-upload-modal" className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-2">
                                <PaperclipIcon />
                                <span>{file ? file.name : 'Attach a file (optional)'}</span>
                            </label>
                            <input id="file-upload-modal" type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="sr-only" />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                         <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400">
                            {isSubmitting ? 'Submitting...' : (postToEdit ? 'Save Changes' : (status === 'approved' ? 'Publish Post' : 'Save as Draft'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;