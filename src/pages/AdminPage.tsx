import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from '../services/adminService';
import * as blogService from '../services/blogService';
import * as forumService from '../services/forumService';
import type { VerifiedSoftware, BlogPost, Session, FullUserProfile, BlogComment, ForumPost, ForumComment, Testimonial, UserFeedback, ContentView } from '../types';
import SoftwareForm from '../components/admin/SoftwareForm';
import BlogForm from '../components/admin/BlogForm';
import CreatePostModal from '../components/forum/CreatePostModal';
import { PencilIcon, TrashIcon, PlusIcon } from '../components/ui/Icons';

type ManagementView = 'software' | 'users' | 'content';

interface AdminPageProps {
    session: Session | null;
    onUserDataChange: () => void;
}

// FIX: Changed to a named export to resolve an import error in App.tsx.
export const AdminPage: React.FC<AdminPageProps> = ({ session, onUserDataChange }) => {
    const [managementView, setManagementView] = useState<ManagementView>('content');
    const [contentView, setContentView] = useState<ContentView>('pendingPosts');

    const [softwareList, setSoftwareList] = useState<VerifiedSoftware[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [users, setUsers] = useState<FullUserProfile[]>([]);
    const [blogComments, setBlogComments] = useState<(BlogComment & { post_title: string })[]>([]);
    const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
    const [forumComments, setForumComments] = useState<(ForumComment & { post_title: string })[]>([]);
    const [pendingPosts, setPendingPosts] = useState<ForumPost[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);


    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [editingSoftware, setEditingSoftware] = useState<Partial<VerifiedSoftware> | null>(null);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [editingForumPost, setEditingForumPost] = useState<ForumPost | null>(null);


    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            if (managementView === 'software') {
                const data = await adminService.getVerifiedSoftware();
                setSoftwareList(data);
            } else if (managementView === 'users') {
                const data = await adminService.getUsers();
                setUsers(data);
            } else if (managementView === 'content') {
                switch (contentView) {
                    case 'pendingPosts':
                        const ppData = await adminService.getPendingForumPosts();
                        setPendingPosts(ppData);
                        break;
                    case 'testimonials':
                        const tData = await adminService.getAllTestimonials();
                        setTestimonials(tData);
                        break;
                    case 'blogPosts':
                        const bpData = await blogService.getBlogPosts(session?.user.id);
                        setBlogPosts(bpData);
                        break;
                    case 'blogComments':
                        const bcData = await adminService.getAllBlogComments();
                        setBlogComments(bcData);
                        break;
                    case 'forumPosts':
                        const fpData = await forumService.getPosts(session?.user.id);
                        setForumPosts(fpData);
                        break;
                    case 'forumComments':
                        const fcData = await adminService.getAllForumComments();
                        setForumComments(fcData);
                        break;
                    case 'userFeedback':
                        const ufData = await adminService.getUserFeedback();
                        setUserFeedback(ufData);
                        break;
                }
            }
        } catch (err: any) {
            setError(err.message || `Failed to load data.`);
        } finally {
            setIsLoading(false);
        }
    }, [managementView, contentView, session]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSuccess = async () => {
        setEditingSoftware(null);
        setEditingPost(null);
        setEditingForumPost(null);
        await loadData();
    };


    const handleSoftwareSave = async (software: Partial<VerifiedSoftware>) => {
        await adminService.upsertSoftware(software);
        await handleSuccess();
    };

    const handleSoftwareDelete = async (id: string | number) => {
        if (window.confirm('Are you sure you want to delete this software entry?')) {
            try {
                await adminService.deleteSoftware(id);
                await loadData();
            } catch (err: any) {
                setError(`Failed to delete software: ${err.message}`);
                alert(`Error: Could not delete software. Reason: ${err.message}`);
            }
        }
    };

    const handlePostSave = async (post: Partial<BlogPost>) => {
        if (!session) return;
        await blogService.upsertBlogPost(post, session.user.id);
        await handleSuccess();
    };

    const handlePostDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this blog post?')) {
            try {
                await blogService.deleteBlogPost(id);
                await loadData();
            } catch (err: any) {
                setError(`Failed to delete blog post: ${err.message}`);
                alert(`Error: Could not delete blog post. Reason: ${err.message}`);
            }
        }
    };

    const handleUserRoleChange = async (userId: string, role: string) => {
        await adminService.updateUser(userId, { role });
        await loadData();
        if (userId === session?.user.id) {
            onUserDataChange();
        }
    };

    const handleUserDelete = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user? This action is irreversible.')) {
            try {
                await adminService.deleteUser(userId);
                await loadData();
            } catch (err: any) {
                setError(`Failed to delete user: ${err.message}`);
                alert(`Error: Could not delete user. Reason: ${err.message}`);
            }
        }
    };

    const handleDeleteBlogComment = async (id: number | string) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await blogService.deleteBlogComment(id);
                await loadData();
            } catch (err: any) {
                setError(`Failed to delete blog comment: ${err.message}`);
                alert(`Error: Could not delete blog comment. Reason: ${err.message}`);
            }
        }
    };

    const handleDeleteForumPost = async (id: number | string) => {
        if (window.confirm('Are you sure you want to permanently delete this forum post?')) {
            try {
                await forumService.deleteForumPost(id);
                await loadData();
            } catch (err: any) {
                setError(`Failed to delete forum post: ${err.message}`);
                alert(`Error: Could not delete forum post. Reason: ${err.message}`);
            }
        }
    };

    const handleDeleteForumComment = async (id: number | string) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await forumService.deleteForumComment(id);
                await loadData();
            } catch (err: any) {
                setError(`Failed to delete forum comment: ${err.message}`);
                alert(`Error: Could not delete forum comment. Reason: ${err.message}`);
            }
        }
    };

    const handleApprovePost = async (postId: number | string) => {
        await adminService.approveForumPost(postId);
        await loadData();
    };

    const handleRejectPost = async (postId: number | string) => {
        const reason = prompt("Please provide a reason for rejecting this post (optional):");
        await adminService.rejectForumPost(postId, reason || 'Post did not meet community guidelines.');
        await loadData();
    };

    const handleApproveTestimonial = async (id: number | string) => {
        await adminService.approveTestimonial(id);
        await loadData();
    };

    const handleRejectTestimonial = async (id: number | string) => {
        await adminService.rejectTestimonial(id);
        await loadData();
    };

    const handleDeleteTestimonial = async (id: number | string) => {
        if (window.confirm('Are you sure you want to permanently delete this testimonial?')) {
            try {
                await adminService.deleteTestimonial(id);
                await loadData();
            } catch (err: any) {
                setError(`Failed to delete testimonial: ${err.message}`);
                alert(`Error: Could not delete testimonial. Reason: ${err.message}`);
            }
        }
    };

    const handleToggleFeedbackResolved = async (id: number | string, currentStatus: boolean) => {
        await adminService.updateUserFeedback(id, { is_resolved: !currentStatus });
        await loadData();
    };

    const handleDeleteUserFeedback = async (id: number | string) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            try {
                await adminService.deleteUserFeedback(id);
                await loadData();
            } catch (err: any) {
                setError(`Failed to delete feedback: ${err.message}`);
                alert(`Error: Could not delete feedback. Reason: ${err.message}`);
            }
        }
    };

    return (
        <div className="p-6 sm:p-10">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Admin Dashboard</h1>
            </div>

            <div className="mb-6 flex border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setManagementView('software')} className={`px-4 py-2 font-semibold text-sm ${managementView === 'software' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Software</button>
                <button onClick={() => setManagementView('users')} className={`px-4 py-2 font-semibold text-sm ${managementView === 'users' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Users</button>
                <button onClick={() => setManagementView('content')} className={`px-4 py-2 font-semibold text-sm ${managementView === 'content' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Content</button>
            </div>

            {isLoading && <p className="text-center p-4">Loading data...</p>}
            {error && <p className="text-center p-4 text-red-500">{error}</p>}

            {managementView === 'software' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Software Management</h2>
                        <button onClick={() => setEditingSoftware({})} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"><PlusIcon /> Add Software</button>
                    </div>
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-white">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3 hidden md:table-cell">Homepage</th>
                                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {softwareList.map(item => (
                                    <tr key={item.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-6 py-4 hidden md:table-cell truncate max-w-xs"><a href={item.homepage_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.homepage_url}</a></td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => setEditingSoftware(item)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><PencilIcon /></button>
                                            <button onClick={() => handleSoftwareDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><TrashIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {managementView === 'users' && (
                <div>
                    <h2 className="text-xl font-bold mb-4">User Management</h2>
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-white">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => {
                                    const isSelf = user.id === session?.user.id;
                                    return (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <img src={user.custom_avatar_url || user.avatar_url || '/images/logo.png'} alt="avatar" className="h-8 w-8 rounded-full" />
                                                <div>
                                                    <div className="font-semibold text-gray-800 dark:text-white">{user.username || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                                                    disabled={isSelf}
                                                    title={isSelf ? "You cannot change your own role." : "Change user role"}
                                                    className="bg-gray-100 dark:bg-gray-700 rounded-md p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleUserDelete(user.id)}
                                                    disabled={isSelf}
                                                    title={isSelf ? "You cannot delete your own account." : "Delete user"}
                                                    className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {managementView === 'content' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Content Management</h2>
                        {contentView === 'blogPosts' && <button onClick={() => setEditingPost({})} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"><PlusIcon /> Create Post</button>}
                    </div>
                    <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <button onClick={() => setContentView('pendingPosts')} className={`px-3 py-1 text-sm whitespace-nowrap ${contentView === 'pendingPosts' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Pending Posts</button>
                        <button onClick={() => setContentView('testimonials')} className={`px-3 py-1 text-sm whitespace-nowrap ${contentView === 'testimonials' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Testimonials</button>
                        <button onClick={() => setContentView('userFeedback')} className={`px-3 py-1 text-sm whitespace-nowrap ${contentView === 'userFeedback' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>User Feedback</button>
                        <button onClick={() => setContentView('blogPosts')} className={`px-3 py-1 text-sm whitespace-nowrap ${contentView === 'blogPosts' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Blog Posts</button>
                        <button onClick={() => setContentView('blogComments')} className={`px-3 py-1 text-sm whitespace-nowrap ${contentView === 'blogComments' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Blog Comments</button>
                        <button onClick={() => setContentView('forumPosts')} className={`px-3 py-1 text-sm whitespace-nowrap ${contentView === 'forumPosts' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Forum Posts</button>
                        <button onClick={() => setContentView('forumComments')} className={`px-3 py-1 text-sm whitespace-nowrap ${contentView === 'forumComments' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Forum Comments</button>
                    </div>

                    {contentView === 'pendingPosts' && (
                        <div>
                            {pendingPosts.length > 0 ? pendingPosts.map(post => (
                                <div key={post.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 mb-4">
                                    <h4 className="font-bold">{post.title}</h4>
                                    <p className="text-xs text-gray-500">By {post.author.username} on {new Date(post.created_at).toLocaleDateString()}</p>
                                    <p className="text-sm mt-2">{post.content}</p>
                                    <div className="mt-4 flex gap-2">
                                        <button onClick={() => handleApprovePost(post.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md">Approve</button>
                                        <button onClick={() => handleRejectPost(post.id)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md">Reject</button>
                                        <button onClick={() => setEditingForumPost(post)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">Edit</button>
                                        <button onClick={() => handleDeleteForumPost(post.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md">Delete</button>
                                    </div>
                                </div>
                            )) : <p>No pending posts to review.</p>}
                        </div>
                    )}
                    {contentView === 'testimonials' && (
                        <div>
                            {['pending', 'approved', 'rejected'].map(status => {
                                const filteredTestimonials = testimonials.filter(t => t.status === status);
                                return (
                                    <div key={status} className="mb-8">
                                        <h3 className="text-xl font-bold capitalize text-gray-800 dark:text-white mb-4">{status}</h3>
                                        {filteredTestimonials.length > 0 ? (
                                            <div className="space-y-4">
                                                {filteredTestimonials.map(testimonial => (
                                                    <div key={testimonial.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold">{testimonial.author?.username || 'Anonymous'}</p>
                                                            <div className="text-sm text-yellow-500 flex">
                                                                {[...Array(5)].map((_, i) => <span key={i}>{i < testimonial.rating ? '★' : '☆'}</span>)}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Submitted on {new Date(testimonial.created_at).toLocaleDateString()}</p>
                                                        <p className="text-sm mt-2">{testimonial.content}</p>
                                                        <div className="mt-4 flex gap-2">
                                                            {testimonial.status === 'pending' && (
                                                                <>
                                                                    <button onClick={() => handleApproveTestimonial(testimonial.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Approve</button>
                                                                    <button onClick={() => handleRejectTestimonial(testimonial.id)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Reject</button>
                                                                </>
                                                            )}
                                                            {testimonial.status === 'rejected' && (
                                                                <button onClick={() => handleApproveTestimonial(testimonial.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Approve</button>
                                                            )}
                                                            {testimonial.status === 'approved' && (
                                                                <button onClick={() => handleRejectTestimonial(testimonial.id)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Un-approve</button>
                                                            )}
                                                            <button onClick={() => handleDeleteTestimonial(testimonial.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-white">No {status} testimonials.</p>
                                        )}
                                    </div>
                                );
                            })}
                            {!isLoading && testimonials.length === 0 && <p>No testimonials found.</p>}
                        </div>
                    )}
                    {contentView === 'userFeedback' && (
                        <div className="space-y-4">
                            {userFeedback.length > 0 ? userFeedback.map(feedback => (
                                <div key={feedback.id} className={`p-4 rounded-lg border ${feedback.is_resolved ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-700'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{feedback.name || feedback.author?.username || 'Anonymous'}</p>
                                            <p className="text-xs text-gray-500">{feedback.email || feedback.author?.email}</p>
                                            <p className="text-xs text-gray-500 mt-1">Submitted on {new Date(feedback.created_at).toLocaleString()}</p>
                                            <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full mt-2 inline-block">{feedback.category}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleToggleFeedbackResolved(feedback.id, feedback.is_resolved)} className={`px-3 py-1 text-sm font-semibold rounded-md ${feedback.is_resolved ? 'bg-gray-200 dark:bg-gray-600' : 'bg-green-500 text-white'}`}>
                                                {feedback.is_resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                                            </button>
                                            <button onClick={() => handleDeleteUserFeedback(feedback.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><TrashIcon /></button>
                                        </div>
                                    </div>
                                    <p className="text-sm mt-2 whitespace-pre-wrap">{feedback.message}</p>
                                </div>
                            )) : <p>No user feedback submitted yet.</p>}
                        </div>
                    )}
                    {contentView === 'blogPosts' && (
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead><tr className="text-left text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                                    <th className="px-6 py-3">Title</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr></thead>
                                <tbody>{blogPosts.map(post => <tr key={post.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{post.title}</td>
                                    <td className="px-6 py-4">{post.category}</td>
                                    <td className="px-6 py-4">{post.date}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => setEditingPost(post)} className="p-2 hover:text-blue-500 rounded-full"><PencilIcon /></button>
                                        <button onClick={() => handlePostDelete(post.id)} className="p-2 hover:text-red-500 rounded-full"><TrashIcon /></button>
                                    </td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                    )}
                    {contentView === 'blogComments' && (
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead><tr className="text-left text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                                    <th className="px-6 py-3">Comment</th><th className="px-6 py-3">Author</th><th className="px-6 py-3">Post</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                                <tbody>{blogComments.map(c => <tr key={c.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 max-w-sm truncate">{c.content}</td><td className="px-6 py-4">{c.author?.username}</td><td className="px-6 py-4 max-w-xs truncate">{c.post_title}</td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteBlogComment(c.id)} className="p-2 hover:text-red-500 rounded-full"><TrashIcon /></button></td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                    )}
                    {contentView === 'forumPosts' && (
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead><tr className="text-left text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                                    <th className="px-6 py-3">Title</th><th className="px-6 py-3">Author</th><th className="px-6 py-3">Category</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                                <tbody>{forumPosts.map(post => <tr key={post.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-sm truncate">{post.title}</td>
                                    <td className="px-6 py-4">{post.author.username}</td>
                                    <td className="px-6 py-4">{post.category}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => setEditingForumPost(post)} className="p-2 hover:text-blue-500 rounded-full"><PencilIcon /></button>
                                        <button onClick={() => handleDeleteForumPost(post.id)} className="p-2 hover:text-red-500 rounded-full"><TrashIcon /></button>
                                    </td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                    )}
                    {contentView === 'forumComments' && (
                        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead><tr className="text-left text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
                                    <th className="px-6 py-3">Comment</th><th className="px-6 py-3">Author</th><th className="px-6 py-3">Post</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                                <tbody>{forumComments.map(c => <tr key={c.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 max-w-sm truncate">{c.content}</td><td className="px-6 py-4">{c.author?.username}</td><td className="px-6 py-4 max-w-xs truncate">{c.post_title}</td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteForumComment(c.id)} className="p-2 hover:text-red-500 rounded-full"><TrashIcon /></button></td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {(editingSoftware || editingPost || editingForumPost) && (
                <div className="fixed inset-0 z-50">
                    {editingSoftware && <SoftwareForm initialData={editingSoftware} onSave={handleSoftwareSave} onCancel={() => setEditingSoftware(null)} />}
                    {editingPost && <BlogForm initialData={editingPost} onSave={handlePostSave} onCancel={() => setEditingPost(null)} />}
                    {editingForumPost && session && (
                        <CreatePostModal
                            isOpen={!!editingForumPost}
                            onClose={() => setEditingForumPost(null)}
                            session={session}
                            onSuccess={handleSuccess}
                            isAdmin={true}
                            postToEdit={editingForumPost}
                        />
                    )}
                </div>
            )}
        </div>
    );
};