import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { VerifiedSoftware, FullUserProfile, BlogComment, ForumComment, ForumPost, Testimonial, UserFeedback, SoftwareCatalogItem } from '../types';

// Helper to fetch user profile
async function getUserProfile(userId: string) {
    try {
        const docRef = doc(db, 'users', userId);
        const snap = await getDoc(docRef);
        return snap.exists() ? snap.data() as FullUserProfile : null;
    } catch (e) {
        console.error("Error fetching profile:", e);
        return null;
    }
}

// Helper to batch fetch profiles
async function getProfilesMap(userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];
    const map = new Map<string, FullUserProfile>();
    if (uniqueIds.length === 0) return map;

    // Fetch in parallel (naive)
    await Promise.all(uniqueIds.map(async (uid) => {
        const p = await getUserProfile(uid);
        if (p) map.set(uid, p);
    }));
    return map;
}

/**
 * Fetches the entire list of verified software from the database.
 */
export async function getVerifiedSoftware(): Promise<VerifiedSoftware[]> {
    try {
        const q = query(collection(db, 'verified_software'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as VerifiedSoftware));
    } catch (error) {
        console.error('Error fetching verified software:', error);
        throw error;
    }
}

/**
 * Creates or updates a software entry in the database.
 */
export async function upsertSoftware(software: Partial<VerifiedSoftware>): Promise<VerifiedSoftware> {
    try {
        let id = software.id;
        let data = { ...software };
        delete data.id; // Don't save ID in doc

        if (id) {
            await updateDoc(doc(db, 'verified_software', String(id)), data);
        } else {
            const docRef = await addDoc(collection(db, 'verified_software'), data);
            id = docRef.id;
        }

        return { id, ...data } as unknown as VerifiedSoftware;
    } catch (error) {
        console.error('Error upserting software:', error);
        throw error;
    }
}

/**
 * Deletes a software entry from the database by its ID.
 */
export async function deleteSoftware(id: string | number): Promise<void> {
    try {
        await deleteDoc(doc(db, 'verified_software', String(id)));
    } catch (error) {
        console.error('Error deleting software:', error);
        throw error;
    }
}

// --- Software Catalog (Knowledge Graph) ---
export async function getSoftwareCatalog(): Promise<SoftwareCatalogItem[]> {
    try {
        const q = query(collection(db, 'software_catalog'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SoftwareCatalogItem));
    } catch (error) {
        console.error('Error fetching software catalog:', error);
        throw error;
    }
}

export async function upsertSoftwareCatalogItem(item: Partial<SoftwareCatalogItem>): Promise<SoftwareCatalogItem> {
    try {
        let id = item.id;
        let data = { ...item };
        delete data.id;

        if (id) {
            await updateDoc(doc(db, 'software_catalog', String(id)), data);
        } else {
            const docRef = await addDoc(collection(db, 'software_catalog'), data);
            id = docRef.id;
        }
        return { id, ...data } as SoftwareCatalogItem;
    } catch (error) {
        console.error('Error upserting catalog item:', error);
        throw error;
    }
}

export async function deleteSoftwareCatalogItem(id: string): Promise<void> {
    await deleteDoc(doc(db, 'software_catalog', id));
}


// --- User Management ---

export async function getUsers(): Promise<FullUserProfile[]> {
    try {
        const q = query(collection(db, 'users'), orderBy('email', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FullUserProfile));
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

export async function updateUser(userId: string, updates: Partial<FullUserProfile>): Promise<FullUserProfile> {
    try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, updates);
        const snap = await getDoc(docRef);
        return { id: snap.id, ...snap.data() } as FullUserProfile;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

export async function deleteUser(userId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// --- Content Management ---

export async function getAllBlogComments(): Promise<(BlogComment & { post_title: string })[]> {
    try {
        const q = query(collection(db, 'blog_comments'), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);

        const comments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as BlogComment));
        const userIds = comments.map(c => c.user_id);
        const postIds = [...new Set(comments.map(c => String(c.post_id)))];

        const profilesMap = await getProfilesMap(userIds);

        // Fetch posts for titles
        const postsMap = new Map<string, string>();
        await Promise.all(postIds.map(async (pid) => {
            const p = await getDoc(doc(db, 'blog_posts', pid));
            if (p.exists()) postsMap.set(pid, p.data().title);
        }));

        return comments.map(c => ({
            ...c,
            post_title: postsMap.get(String(c.post_id)) || 'Unknown Post',
            author: profilesMap.get(c.user_id) ? {
                username: profilesMap.get(c.user_id)?.username || 'Anonymous',
                avatar_url: profilesMap.get(c.user_id)?.avatar_url || '/images/logo.png',
                email: profilesMap.get(c.user_id)?.email || ''
            } : { username: 'Deleted User', email: '', avatar_url: '/images/logo.png' },
            like_count: c.like_count || 0,
            user_has_liked: false
        }));
    } catch (error) {
        console.error('Error fetching blog comments:', error);
        throw error;
    }
}

export async function getAllForumComments(): Promise<(ForumComment & { post_title: string })[]> {
    try {
        const q = query(collection(db, 'forum_comments'), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);

        const comments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ForumComment));
        const userIds = comments.map(c => c.user_id);
        const postIds = [...new Set(comments.map(c => String(c.post_id)))];

        const profilesMap = await getProfilesMap(userIds);

        const postsMap = new Map<string, string>();
        await Promise.all(postIds.map(async (pid) => {
            const p = await getDoc(doc(db, 'forum_posts', pid));
            if (p.exists()) postsMap.set(pid, p.data().title);
        }));

        return comments.map(c => ({
            ...c,
            post_title: postsMap.get(String(c.post_id)) || 'Unknown Post',
            author: profilesMap.get(c.user_id) ? {
                username: profilesMap.get(c.user_id)?.username || 'Anonymous',
                avatar_url: profilesMap.get(c.user_id)?.avatar_url || '/images/logo.png',
                email: profilesMap.get(c.user_id)?.email || ''
            } : { username: 'Deleted User', email: '', avatar_url: '/images/logo.png' },
            like_count: c.like_count || 0,
            user_has_liked: false
        }));
    } catch (error) {
        console.error('Error fetching forum comments:', error);
        throw error;
    }
}


// --- Forum Post Moderation ---

export async function getPendingForumPosts(): Promise<ForumPost[]> {
    try {
        const q = query(
            collection(db, 'forum_posts'),
            where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        const posts = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as unknown as ForumPost))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const userIds = posts.map(p => p.user_id);
        const profilesMap = await getProfilesMap(userIds);

        return posts.map(post => ({
            ...post,
            author: profilesMap.get(post.user_id) ? {
                username: profilesMap.get(post.user_id)?.username || 'Anonymous',
                avatar_url: profilesMap.get(post.user_id)?.avatar_url || '/images/logo.png',
                email: profilesMap.get(post.user_id)?.email || ''
            } : { username: 'Anonymous', avatar_url: '/images/logo.png', email: '' },
        }));

    } catch (error) {
        console.error('Error fetching pending forum posts:', error);
        throw error;
    }
}

export async function approveForumPost(postId: string | number): Promise<void> {
    try {
        await updateDoc(doc(db, 'forum_posts', String(postId)), { status: 'approved' });
    } catch (error) {
        console.error("Error approving post:", error);
        throw error;
    }
}

export async function rejectForumPost(postId: string | number, reason: string): Promise<void> {
    try {
        await updateDoc(doc(db, 'forum_posts', String(postId)), { status: 'rejected', rejection_reason: reason });
    } catch (error) {
        console.error("Error rejecting post:", error);
        throw error;
    }
}

// --- Testimonial Moderation ---

export async function getAllTestimonials(): Promise<Testimonial[]> {
    try {
        const q = query(collection(db, 'testimonials'), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        const testimonials = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Testimonial));

        const userIds = testimonials.map(t => t.user_id);
        const profilesMap = await getProfilesMap(userIds);

        return testimonials.map(t => ({
            ...t,
            author: profilesMap.get(t.user_id) ? {
                username: profilesMap.get(t.user_id)?.username || 'Anonymous',
                avatar_url: profilesMap.get(t.user_id)?.avatar_url || '/images/logo.png'
            } : { username: 'User Not Found', avatar_url: '/images/logo.png' }
        }));
    } catch (error) {
        console.error('Error fetching all testimonials:', error);
        throw error;
    }
}

export async function approveTestimonial(id: string | number): Promise<void> {
    await updateDoc(doc(db, 'testimonials', String(id)), { status: 'approved' });
}

export async function rejectTestimonial(id: string | number): Promise<void> {
    await updateDoc(doc(db, 'testimonials', String(id)), { status: 'rejected' });
}

export async function deleteTestimonial(id: string | number): Promise<void> {
    await deleteDoc(doc(db, 'testimonials', String(id)));
}

// --- User Feedback Management ---
export async function getUserFeedback(): Promise<UserFeedback[]> {
    try {
        const q = query(collection(db, 'user_feedback'), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        const feedback = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserFeedback));

        const userIds = feedback.map(f => f.user_id).filter(id => id) as string[];
        const profilesMap = await getProfilesMap(userIds);

        return feedback.map(f => ({
            ...f,
            author: (f.user_id && profilesMap.get(f.user_id)) ? {
                username: profilesMap.get(f.user_id!)!.username || 'N/A',
                email: profilesMap.get(f.user_id!)!.email || 'N/A'
            } : null
        }));
    } catch (error) {
        console.error('Error fetching user feedback:', error);
        throw error;
    }
}

export async function updateUserFeedback(id: string | number, updates: Partial<UserFeedback>): Promise<UserFeedback> {
    try {
        const docRef = doc(db, 'user_feedback', String(id));
        await updateDoc(docRef, updates);
        const snap = await getDoc(docRef);
        return { id: snap.id, ...snap.data() } as unknown as UserFeedback;
    } catch (error) {
        throw error;
    }
}

export async function deleteUserFeedback(id: string | number): Promise<void> {
    await deleteDoc(doc(db, 'user_feedback', String(id)));
}
