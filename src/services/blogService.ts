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
import { db } from './firebase';
import type { BlogPost, BlogComment, BlogCategory } from '../types';

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
 * Fetches all blog posts with aggregated data.
 */
export async function getBlogPosts(userId?: string, category?: BlogCategory): Promise<BlogPost[]> {
    try {
        let q = query(
            collection(db, 'blog_posts'),
            orderBy('created_at', 'desc')
        );

        if (category) {
            q = query(q, where('category', '==', category));
        }

        const querySnapshot = await getDocs(q);
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
            const likesQ = query(collection(db, 'blog_likes'), where('user_id', '==', userId), where('post_id', '!=', null));
            const likesSnap = await getDocs(likesQ);
            likesSnap.forEach(doc => {
                const data = doc.data();
                if (data.post_id) userLikes.add(String(data.post_id));
            });
        }

        return rawPosts.map(p => {
            const author = p.user_id ? profilesMap.get(p.user_id) : null;
            return {
                id: p.id,
                title: p.title,
                date: new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                author: author?.username || 'The SoftMonk Team',
                author_avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png',
                excerpt: p.excerpt,
                image: p.image_url,
                content: p.content || '',
                category: p.category,
                user_id: p.user_id,
                comment_count: p.comment_count || 0,
                like_count: p.like_count || 0,
                user_has_liked: userLikes.has(p.id)
            };
        });

    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return [];
    }
}

/**
 * Fetches a single blog post by its ID.
 */
export async function getBlogPostById(id: string, userId?: string): Promise<BlogPost | null> {
    try {
        const docRef = doc(db, 'blog_posts', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data();

        let author = null;
        if (data.user_id) {
            author = await getUserProfile(data.user_id);
        }

        let userHasLiked = false;
        if (userId) {
            const q = query(
                collection(db, 'blog_likes'),
                where('user_id', '==', userId),
                where('post_id', '==', id)
            );
            const snap = await getDocs(q);
            userHasLiked = !snap.empty;
        }

        return {
            id: docSnap.id,
            title: data.title,
            date: new Date(data.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            author: author?.username || 'The SoftMonk Team',
            author_avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png',
            excerpt: data.excerpt,
            image: data.image_url,
            content: data.content,
            category: data.category,
            user_id: data.user_id,
            comment_count: data.comment_count || 0,
            like_count: data.like_count || 0,
            user_has_liked: userHasLiked
        };

    } catch (error) {
        console.error("Error fetching blog post:", error);
        return null;
    }
}


/**
 * Creates or updates a blog post entry. Requires admin privileges via Rules.
 */
export async function upsertBlogPost(post: Partial<BlogPost>, userId: string): Promise<BlogPost> {
    try {
        const postData = {
            user_id: post.user_id || userId,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            image_url: post.image,
            category: post.category,
            updated_at: new Date().toISOString()
        };

        let newId = post.id;
        if (newId) {
            // Update
            await updateDoc(doc(db, 'blog_posts', newId), postData);
        } else {
            // Create
            const docRef = await addDoc(collection(db, 'blog_posts'), {
                ...postData,
                created_at: new Date().toISOString(),
                like_count: 0,
                comment_count: 0
            });
            newId = docRef.id;
        }

        const newPost = await getBlogPostById(newId as string, userId);
        if (!newPost) throw new Error("Failed to retrieve post after upserting.");
        return newPost;

    } catch (error) {
        console.error("Error upserting blog post:", error);
        throw error;
    }
}

/**
 * Deletes a blog post.
 */
export async function deleteBlogPost(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'blog_posts', id));
    } catch (error) {
        console.error("Error deleting blog post:", error);
        throw error;
    }
}

/**
 * Fetches all comments for a specific post.
 */
export async function getCommentsForPost(postId: string, userId?: string): Promise<BlogComment[]> {
    try {
        const q = query(
            collection(db, 'blog_comments'),
            where('post_id', '==', postId),
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
            const likesQ = query(collection(db, 'blog_likes'), where('user_id', '==', userId), where('comment_id', '!=', null));
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
                    username: author?.username || 'Deleted User',
                    avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png',
                    email: author?.email || ''
                },
                user_has_liked: userLikes.has(c.id),
                like_count: c.like_count || 0
            } as BlogComment;
        });

    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
}

/**
 * Creates a new comment on a post.
 */
export async function createComment(commentData: { postId: string; userId: string; content: string }): Promise<BlogComment> {
    try {
        const newComment = {
            post_id: commentData.postId,
            user_id: commentData.userId,
            content: commentData.content,
            created_at: new Date().toISOString(),
            like_count: 0
        };

        const docRef = await addDoc(collection(db, 'blog_comments'), newComment);

        // Update post comment count
        const postRef = doc(db, 'blog_posts', commentData.postId);
        updateDoc(postRef, { comment_count: increment(1) }).catch(console.error);

        // Fetch author
        const author = await getUserProfile(commentData.userId);

        return {
            id: docRef.id as unknown as number, // Cast for TS compatibility if needed, though types say number. Ideally change types to string.
            ...newComment,
            author: {
                username: author?.username || 'Anonymous',
                avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png',
                email: author?.email || ''
            },
            user_has_liked: false
        };

    } catch (error) {
        console.error("Error creating comment:", error);
        throw error;
    }
}

/**
 * Toggles a like.
 */
export async function toggleLike(likeData: { userId: string, postId?: string, commentId?: number | string }) {
    try {
        // Query if exists
        const q = query(
            collection(db, 'blog_likes'),
            where('user_id', '==', likeData.userId),
            where(likeData.postId ? 'post_id' : 'comment_id', '==', likeData.postId ? likeData.postId : String(likeData.commentId))
        );
        const snap = await getDocs(q);

        let userHasLiked = false;

        if (!snap.empty) {
            // Unlike
            await deleteDoc(snap.docs[0].ref);
            if (likeData.postId) {
                await updateDoc(doc(db, 'blog_posts', likeData.postId), { like_count: increment(-1) });
            } else if (likeData.commentId) {
                await updateDoc(doc(db, 'blog_comments', String(likeData.commentId)), { like_count: increment(-1) });
            }
            userHasLiked = false;
        } else {
            // Like
            await addDoc(collection(db, 'blog_likes'), {
                user_id: likeData.userId,
                post_id: likeData.postId || null,
                comment_id: likeData.commentId ? String(likeData.commentId) : null,
                created_at: new Date().toISOString()
            });
            if (likeData.postId) {
                await updateDoc(doc(db, 'blog_posts', likeData.postId), { like_count: increment(1) });
            } else if (likeData.commentId) {
                await updateDoc(doc(db, 'blog_comments', String(likeData.commentId)), { like_count: increment(1) });
            }
            userHasLiked = true;
        }

        return { newLikeCount: 0, userHasLiked };
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
}

export const togglePostLike = (data: { postId: string, userId: string }) => toggleLike(data);
export const toggleCommentLike = (data: { commentId: number | string, userId: string }) => toggleLike(data);

export async function deleteBlogComment(id: number | string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'blog_comments', String(id)));
    } catch (error) {
        console.error("Error deleting blog comment:", error);
        throw error;
    }
}