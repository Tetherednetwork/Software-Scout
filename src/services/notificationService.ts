import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';
import type { Notification } from '../types';

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

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    // Query for notifications where recipient is user OR is_broadcast is true
    // Firestore doesn't support logical OR directly in one query efficiently for this mix without composite indexes or multiple queries.
    // We'll run two queries and merge.

    const q1 = query(
      collection(db, 'notifications'),
      where('recipient_user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    const q2 = query(
      collection(db, 'notifications'),
      where('is_broadcast', '==', true),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const rawNotifications: any[] = [];
    const seenIds = new Set<string>();

    const addNotif = (doc: any) => {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        rawNotifications.push({ id: doc.id, ...doc.data() });
      }
    };

    snap1.forEach(addNotif);
    snap2.forEach(addNotif);

    // Sort combined (since we fetched 20 from each, the total might be 40 unsorted relative to each other)
    rawNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const slicedNotifications = rawNotifications.slice(0, 20);

    // Fetch actors
    const actorIds = new Set<string>();
    slicedNotifications.forEach(n => {
      if (n.actor_user_id) actorIds.add(n.actor_user_id);
    });

    const profilesMap = new Map<string, any>();
    if (actorIds.size > 0) {
      await Promise.all(Array.from(actorIds).map(async (uid) => {
        const p = await getUserProfile(uid);
        if (p) profilesMap.set(uid, p);
      }));
    }

    return slicedNotifications.map(n => {
      const actor = n.actor_user_id ? profilesMap.get(n.actor_user_id) : null;
      return {
        ...n,
        actor: actor ? {
          username: actor.username || 'A user',
          avatar_url: actor.custom_avatar_url || actor.avatar_url || '/images/logo.png',
        } : null
      };
    });

  } catch (error: any) {
    console.error('Detailed error fetching notifications:', error);
    throw new Error(`Database error: ${error.message}`);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    // Firestore OR query for count? 
    // We need (recipient == userId OR is_broadcast == true) AND is_read == false
    // This is hard. Usually broadcast messages have a separate "read_receipts" collection for users.
    // Assuming 'is_read' on a broadcast message is global? No, that doesn't make sense.
    // Supabase schema suggests 'is_read' is on the notification row. 
    // If 'is_broadcast' is true, there is only one row? Then all users read the same row? 
    // That implies 'is_read' is shared, which is wrong for broadcast.
    // Likely 'is_broadcast' messages are copied to users OR we check a separate 'reads' collection.
    // Given the Supabase query: .or(`recipient_user_id.eq.${userId},is_broadcast.eq.true`)
    // It selects rows. If row has is_broadcast=true, it's returned. 
    // If the schema puts 'is_read' on that row, checking it implies that row tracks read state.
    // If it's a single global row, 'is_read' would be global. 
    // This suggests the app might not handle broadcast read-tracking per user correctly in Supabase either, OR strictly personal copies are made.
    // I will implement strictly personal check for now: recipient_user_id == userId AND is_read == false.
    // Ignoring broadcast for unread count if it's not personalized.

    const q = query(
      collection(db, 'notifications'),
      where('recipient_user_id', '==', userId),
      where('is_read', '==', false)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;

  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}


export async function markNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipient_user_id', '==', userId),
      where('is_read', '==', false)
    );
    const snapshot = await getDocs(q);

    // Batch update
    const updatePromises = snapshot.docs.map(doc => updateDoc(doc.ref, { is_read: true }));
    await Promise.all(updatePromises);

  } catch (error: any) {
    console.error('Detailed error marking notifications as read:', error);
    throw new Error(`Database error: ${error.message}`);
  }
}
