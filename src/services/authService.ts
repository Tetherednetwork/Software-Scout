import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    User,
    updatePassword as firebaseUpdatePassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { FullUserProfile, Session } from '../types';

// Map Firebase User to our App's Session type
const mapUserToSession = (user: User | null): Session | null => {
    if (!user) return null;
    return {
        user: {
            id: user.uid,
            email: user.email || '',
            // Add other fields if needed by Session type
        },
        access_token: '', // Firebase doesn't expose this directly in the same way, but usually not needed for client logic if we trust the SDK
    } as Session;
};

export const authService = {
    signUp: async (email: string, password: string, data: { username: string; role: string }) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                email: email,
                username: data.username,
                role: data.role,
                created_at: new Date().toISOString(),
                avatar_url: null,
                custom_avatar_url: null
            });

            return { data: { user }, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    signIn: async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { data: { user: userCredential.user }, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    signOut: async () => {
        try {
            await firebaseSignOut(auth);
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    resetPassword: async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    updatePassword: async (password: string) => {
        const user = auth.currentUser;
        if (!user) return { error: { message: "No user logged in" } };
        try {
            await firebaseUpdatePassword(user, password);
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
        return onAuthStateChanged(auth, (user) => {
            const session = mapUserToSession(user);
            callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        });
    },

    getUserProfile: async (userId: string) => {
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { data: docSnap.data() as FullUserProfile, error: null };
            } else {
                return { data: null, error: { message: "Profile not found" } };
            }
        } catch (error: any) {
            return { data: null, error };
        }
    },

    updateUserProfile: async (userId: string, updates: Partial<FullUserProfile>) => {
        try {
            const docRef = doc(db, 'users', userId);
            await updateDoc(docRef, updates);
            // Re-fetch to return the updated object
            const docSnap = await getDoc(docRef);
            return { data: docSnap.data() as FullUserProfile, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    signInWithGoogle: async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Create new user profile
                await setDoc(docRef, {
                    id: user.uid,
                    email: user.email,
                    username: user.displayName || user.email?.split('@')[0],
                    role: 'user', // Default role
                    created_at: new Date().toISOString(),
                    avatar_url: user.photoURL,
                    custom_avatar_url: null
                });
            }

            return { data: { user }, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    }
};
