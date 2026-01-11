import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { ForumPost, ForumComment } from '../types';

// Helper to fetch user profile
async function getUserProfile(userId: string) {
    try {
        const docRef = doc(db, 'users', userId);
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data() : null;
    } catch (e) {
        console.error("Error fetching profile:", e);
        return null;
    }
}

/**
 * Fetches all forum posts with aggregated data.
 */
export async function getPosts(userId?: string, category?: string): Promise<ForumPost[]> {
    try {
        let q = query(
            collection(db, 'forum_posts'),
            where('status', '==', 'approved'),
            orderBy('created_at', 'desc')
        );

        if (category) {
            q = query(q, where('category', '==', category));
        }

        const querySnapshot = await getDocs(q);
        const posts: ForumPost[] = [];

        const rawPosts: any[] = [];
        const userIds = new Set<string>();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            rawPosts.push({ id: doc.id, ...data });
            if (data.user_id) userIds.add(data.user_id);
        });

        // Fetch authors
        const profilesMap = new Map<string, any>();
        if (userIds.size > 0) {
            await Promise.all(Array.from(userIds).map(async (uid) => {
                const p = await getUserProfile(uid);
                if (p) profilesMap.set(uid, p);
            }));
        }

        // Check likes for current user (if logged in)
        const userLikes = new Set<string>(); // Set of post IDs
        if (userId) {
            const likesQ = query(collection(db, 'forum_likes'), where('user_id', '==', userId), where('post_id', '!=', null));
            const likesSnap = await getDocs(likesQ);
            likesSnap.forEach(doc => {
                const data = doc.data();
                if (data.post_id) userLikes.add(String(data.post_id));
            });
        }

        for (const p of rawPosts) {
            const author = profilesMap.get(p.user_id);
            posts.push({
                ...p,
                author: {
                    username: author?.username || 'Unknown',
                    avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png',
                    email: author?.email || ''
                },
                user_has_liked: userLikes.has(p.id)
            });
        }

        return posts;
    } catch (error) {
        console.error("Error fetching forum posts:", error);
        return [];
    }
}

/**
 * Fetches a single forum post by its ID.
 */
export async function getPostById(id: string | number, userId?: string): Promise<ForumPost | null> {
    try {
        const docRef = doc(db, 'forum_posts', String(id));
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        if (data.status !== 'approved') return null;

        const author = await getUserProfile(data.user_id);

        let userHasLiked = false;
        if (userId) {
            // Check directly
            const q = query(
                collection(db, 'forum_likes'),
                where('user_id', '==', userId),
                where('post_id', '==', String(id))
            );
            const snap = await getDocs(q);
            userHasLiked = !snap.empty;
        }

        return {
            id: docSnap.id,
            ...data,
            author: {
                username: author?.username || 'Unknown',
                avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png',
                email: author?.email || ''
            },
            user_has_liked: userHasLiked
        } as ForumPost;

    } catch (error) {
        console.error("Error fetching post:", error);
        return null;
    }
}

/**
 * Fetches all comments for a specific post.
 */
export async function getCommentsForPost(postId: string | number, userId?: string): Promise<ForumComment[]> {
    try {
        const q = query(
            collection(db, 'forum_comments'),
            where('post_id', '==', String(postId)),
            orderBy('created_at', 'asc')
        );
        const snap = await getDocs(q);

        const rawComments: any[] = [];
        const userIds = new Set<string>();

        snap.forEach(doc => {
            const d = doc.data();
            rawComments.push({ id: doc.id, ...d });
            if (d.user_id) userIds.add(d.user_id);
        });

        const profilesMap = new Map<string, any>();
        if (userIds.size > 0) {
            await Promise.all(Array.from(userIds).map(async (uid) => {
                const p = await getUserProfile(uid);
                if (p) profilesMap.set(uid, p);
            }));
        }

        // Check likes for current user (if logged in)
        const userLikes = new Set<string>(); // Set of comment IDs
        if (userId) {
            const likesQ = query(collection(db, 'forum_likes'), where('user_id', '==', userId), where('comment_id', '!=', null));
            const likesSnap = await getDocs(likesQ);
            likesSnap.forEach(doc => {
                const data = doc.data();
                if (data.comment_id) userLikes.add(String(data.comment_id));
            });
        }

        return rawComments.map(c => {
            const author = profilesMap.get(c.user_id);
            return {
                ...c,
                author: {
                    username: author?.username || 'Unknown',
                    avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png',
                    email: author?.email || ''
                },
                user_has_liked: userLikes.has(c.id),
                like_count: c.like_count || 0
            };
        });

    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
}

/**
 * Creates a new forum post.
 */
export async function createPost(postData: { userId: string; title: string; content: string; file: File | null; category: ForumPost['category']; status: 'approved' | 'pending'; image_url?: string | null }): Promise<{ success: boolean }> {
    try {
        let file_url: string | null = null;
        let file_name: string | null = null;

        if (postData.file) {
            const fileExt = postData.file.name.split('.').pop();
            const filePath = `forum_uploads/${postData.userId}/${Date.now()}.${fileExt}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, postData.file);
            file_url = await getDownloadURL(storageRef);
            file_name = postData.file.name;
        }

        await addDoc(collection(db, 'forum_posts'), {
            user_id: postData.userId,
            title: postData.title,
            content: postData.content,
            category: postData.category,
            status: postData.status,
            image_url: postData.image_url || null,
            file_url: file_url || null,
            file_name: file_name || null,
            created_at: new Date().toISOString(),
            comment_count: 0,
            like_count: 0
        });

        return { success: true };
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
}

/**
 * Updates an existing forum post.
 */
export async function updatePost(postData: { id: string | number; title: string; content: string; category: ForumPost['category']; status: 'approved' | 'pending'; image_url?: string | null }): Promise<void> {
    try {
        const docRef = doc(db, 'forum_posts', String(postData.id));
        await updateDoc(docRef, {
            title: postData.title,
            content: postData.content,
            category: postData.category,
            status: postData.status,
            image_url: postData.image_url || null
        });
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
}

/**
 * Creates a new comment.
 */
export async function createComment(commentData: { postId: string | number; userId: string; content: string; parentCommentId?: string | number | null }): Promise<ForumComment> {
    try {
        const newComment = {
            post_id: String(commentData.postId),
            user_id: commentData.userId,
            content: commentData.content,
            parent_comment_id: commentData.parentCommentId ? String(commentData.parentCommentId) : null,
            created_at: new Date().toISOString(),
            like_count: 0
        };

        const docRef = await addDoc(collection(db, 'forum_comments'), newComment);

        // Update post comment count
        const postRef = doc(db, 'forum_posts', String(commentData.postId));
        updateDoc(postRef, { comment_count: increment(1) }).catch(console.error);

        // Fetch author
        const author = await getUserProfile(commentData.userId);

        return {
            id: docRef.id,
            ...newComment,
            author: {
                username: author?.username || 'Anonymous',
                avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png',
                email: author?.email || ''
            },
            user_has_liked: false
        } as ForumComment;

    } catch (error) {
        console.error("Error creating comment:", error);
        throw error;
    }
}

/**
 * Toggles a like.
 */
export async function toggleLike({ postId, commentId, userId }: { postId?: string | number; commentId?: string | number; userId: string }) {
    try {
        // Query if exists
        const q = query(
            collection(db, 'forum_likes'),
            where('user_id', '==', userId),
            where(postId ? 'post_id' : 'comment_id', '==', String(postId || commentId))
        );
        const snap = await getDocs(q);

        let userHasLiked = false;

        if (!snap.empty) {
            // Unlike
            await deleteDoc(snap.docs[0].ref);
            if (postId) {
                await updateDoc(doc(db, 'forum_posts', String(postId)), { like_count: increment(-1) });
            } else if (commentId) {
                await updateDoc(doc(db, 'forum_comments', String(commentId)), { like_count: increment(-1) });
            }
            userHasLiked = false;
        } else {
            // Like
            await addDoc(collection(db, 'forum_likes'), {
                user_id: userId,
                post_id: postId ? String(postId) : null,
                comment_id: commentId ? String(commentId) : null,
                created_at: new Date().toISOString()
            });
            if (postId) {
                await updateDoc(doc(db, 'forum_posts', String(postId)), { like_count: increment(1) });
            } else if (commentId) {
                await updateDoc(doc(db, 'forum_comments', String(commentId)), { like_count: increment(1) });
            }
            userHasLiked = true;
        }

        return { newLikeCount: 0, userHasLiked };
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
}

export async function deleteForumPost(id: string | number): Promise<void> {
    try {
        await deleteDoc(doc(db, 'forum_posts', String(id)));
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}

export async function deleteForumComment(id: string | number): Promise<void> {
    try {
        await deleteDoc(doc(db, 'forum_comments', String(id)));
    } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
    }
}