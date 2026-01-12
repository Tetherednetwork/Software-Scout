import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserDevice, DownloadHistoryItem, SoftwareCatalogItem } from '../types';

export const dbService = {
    // --- Devices ---
    getUserDevices: async (userId: string) => {
        try {
            const q = query(collection(db, 'users', userId, 'devices'), orderBy('created_at', 'desc'));
            const querySnapshot = await getDocs(q);
            const devices: SavedDevice[] = [];
            querySnapshot.forEach((doc) => {
                devices.push({ id: doc.id, ...doc.data() } as any);
            });
            return { data: devices, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    addDevice: async (userId: string, device: Omit<SavedDevice, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const timestamp = Date.now();
            const docRef = await addDoc(collection(db, 'users', userId, 'devices'), {
                ...device,
                created_at: timestamp,
                updated_at: timestamp
            });
            const newDevice = { id: docRef.id, ...device, created_at: timestamp, updated_at: timestamp };
            return { data: newDevice, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    updateDevice: async (userId: string, device: Partial<SavedDevice> & { id: string }) => {
        try {
            const deviceId = String(device.id);
            const docRef = doc(db, 'users', userId, 'devices', deviceId);
            const { id, ...updates } = device;
            await updateDoc(docRef, { ...updates, updated_at: Date.now() });
            return { data: { ...device, updated_at: Date.now() }, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    deleteDevice: async (userId: string, deviceId: string) => {
        try {
            await deleteDoc(doc(db, 'users', userId, 'devices', String(deviceId)));
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    // --- Download History ---
    getDownloadHistory: async (userId: string) => {
        try {
            const q = query(
                collection(db, 'users', userId, 'downloads'),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
            const querySnapshot = await getDocs(q);
            const history: DownloadHistoryItem[] = [];
            querySnapshot.forEach((doc) => {
                history.push({ id: doc.id, ...doc.data() } as any);
            });
            return { data: history, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    addDownloadHistory: async (userId: string, item: Omit<DownloadHistoryItem, 'id' | 'timestamp'>) => {
        try {
            await addDoc(collection(db, 'users', userId, 'downloads'), {
                ...item,
                timestamp: new Date().toISOString()
            });
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    deleteDownloadHistoryItem: async (userId: string, itemId: string) => {
        try {
            await deleteDoc(doc(db, 'users', userId, 'downloads', itemId));
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    updateDownloadStatus: async (userId: string, itemId: string, status: 'verified' | 'failed') => {
        try {
            const docRef = doc(db, 'users', userId, 'downloads', itemId);
            await updateDoc(docRef, { status });
            return { data: { status }, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    // --- Chat History ---
    getChatHistory: async (userId: string) => {
        try {
            const q = query(
                collection(db, 'users', userId, 'chat_history'),
                orderBy('created_at', 'asc')
            );
            const querySnapshot = await getDocs(q);
            const messages: any[] = [];
            querySnapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            return { data: messages, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    addChatMessage: async (userId: string, message: any) => {
        try {
            await addDoc(collection(db, 'users', userId, 'chat_history'), {
                ...message,
                created_at: new Date().toISOString()
            });
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    clearChatHistory: async (userId: string) => {
        try {
            const q = query(collection(db, 'users', userId, 'chat_history'));
            const querySnapshot = await getDocs(q);
            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    // --- Software Catalog (Knowledge Graph) ---
    getSoftwareCatalog: async () => {
        try {
            const q = query(collection(db, 'software_catalog'));
            const querySnapshot = await getDocs(q);
            const items: SoftwareCatalogItem[] = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as SoftwareCatalogItem);
            });
            return { data: items, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    },

    addSoftwareCatalogItem: async (item: Omit<SoftwareCatalogItem, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, 'software_catalog'), item);
            return { data: { id: docRef.id, ...item }, error: null };
        } catch (error: any) {
            return { data: null, error };
        }
    }
};
