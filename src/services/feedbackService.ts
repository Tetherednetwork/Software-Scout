import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserFeedback } from '../types';

type FeedbackSubmission = Omit<UserFeedback, 'id' | 'created_at' | 'is_resolved' | 'author'>;

/**
 * Submits user feedback to the database.
 */
export async function submitFeedback(feedback: FeedbackSubmission): Promise<UserFeedback> {
    try {
        const docData = {
            ...feedback,
            is_resolved: false,
            created_at: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'user_feedback'), docData);

        return {
            id: docRef.id,
            ...docData
        } as UserFeedback;

    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
    }
}
