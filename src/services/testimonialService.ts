import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    doc,
    getDoc,
    setDoc,
    addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { Testimonial } from '../types';

/**
 * Fetches all approved testimonials with author information.
 * Publicly accessible.
 */
export async function getApprovedTestimonials(): Promise<Testimonial[]> {
    try {
        const q = query(
            collection(db, 'testimonials'),
            where('status', '==', 'approved'),
            orderBy('created_at', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const testimonials: Testimonial[] = [];
        const userIds = new Set<string>();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            testimonials.push({ id: doc.id, ...data } as any);
            if (data.user_id) userIds.add(data.user_id);
        });

        if (testimonials.length === 0) return [];

        // Fetch profiles
        // Firestore 'in' query supports up to 10 items. If more, we need to batch or fetch individually.
        // For simplicity in this migration, let's assume < 10 active testimonials or just fetch individual profiles for now.
        // Or better: fetch all pertinent user profiles in a loop or parallel.
        const profilesMap = new Map<string, any>();
        const profilePromises = Array.from(userIds).map(async (uid) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return { id: uid, ...userDoc.data() };
            }
            return null;
        });

        const profiles = await Promise.all(profilePromises);
        profiles.forEach(p => {
            if (p) profilesMap.set(p.id, p);
        });

        // Combine
        return testimonials.map(t => {
            const author = profilesMap.get(t.user_id);
            return {
                ...t,
                author: {
                    username: author?.username || 'Anonymous',
                    avatar_url: author?.custom_avatar_url || author?.avatar_url || '/images/logo.png'
                }
            };
        });

    } catch (error) {
        console.error("Error fetching approved testimonials:", error);
        return [];
    }
}


/**
 * Fetches the testimonial for a specific user.
 * Requires user to be authenticated.
 */
export async function getUserTestimonial(userId: string): Promise<Testimonial | null> {
    try {
        // Since we might not know the doc ID based on userId easily unless we used userId as doc ID.
        // Assuming we used userId as doc ID for testimonials would play nice, but if not, we query.
        // Supabase code used .eq('user_id', userId).maybeSingle().
        const q = query(collection(db, 'testimonials'), where('user_id', '==', userId), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as any;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user testimonial:", error);
        throw error;
    }
}

/**
 * Creates or updates a user's testimonial.
 * Sets status to 'pending' for moderation.
 */
export async function upsertUserTestimonial(testimonial: { userId: string, rating: number, content: string }): Promise<Testimonial> {
    try {
        // Check if existing
        const existing = await getUserTestimonial(testimonial.userId);

        const data = {
            user_id: testimonial.userId,
            rating: testimonial.rating,
            content: testimonial.content,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        let newId = existing?.id;

        if (existing) {
            const docRef = doc(db, 'testimonials', String(existing.id));
            await setDoc(docRef, data, { merge: true });
            // ID remains same
            newId = existing.id;
        } else {
            const docRef = await addDoc(collection(db, 'testimonials'), data);
            newId = docRef.id;
        }

        return { id: newId!, ...data } as Testimonial;
    } catch (error) {
        console.error("Error upserting testimonial:", error);
        throw error;
    }
}
