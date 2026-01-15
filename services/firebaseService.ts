
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    updateDoc,
    deleteDoc, 
    Timestamp, 
    doc,
    writeBatch,
    orderBy,
    limit,
    type Firestore
} from 'firebase/firestore';

import type { ScheduleEntry, NewShift, FirebaseScheduleEntry, ShiftType, ShiftTemplate } from '../types';
import { PREDEFINED_SHIFTS, getRoleByEmployee } from '../constants';

declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-planning-app';

const mockFirebaseConfig = {
  apiKey: "MOCK_API_KEY",
  authDomain: "MOCK_AUTH_DOMAIN.firebaseapp.com",
  projectId: "MOCK_PROJECT_ID",
  storageBucket: "MOCK_STORAGE_BUCKET.appspot.com",
  messagingSenderId: "MOCK_MESSAGING_SENDER_ID",
  appId: "MOCK_APP_ID"
};
const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : mockFirebaseConfig;

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const getCollectionPath = () => `/artifacts/${appId}/public/data/schedules`;
const getNotificationsPath = () => `/artifacts/${appId}/public/data/notifications`;
const getTemplatesPath = () => `/artifacts/${appId}/public/data/templates`;

export const initialize = (): { app: FirebaseApp; auth: Auth; db: Firestore } => {
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        const signIn = async () => {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        };
        signIn().catch(e => console.error("Firebase Sign-In Error:", e));

        return { app, auth, db };
    } catch (e) {
        console.error("Fatal Error: Firebase initialization failed.", e);
        throw e;
    }
};

export const onAuthChange = (auth: Auth, callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const onScheduleUpdate = (
    db: Firestore, 
    callback: (schedules: ScheduleEntry[]) => void, 
    onError: (error: Error) => void
) => {
    const scheduleColRef = collection(db, getCollectionPath());
    const scheduleQuery = query(scheduleColRef);

    return onSnapshot(scheduleQuery, (snapshot) => {
        const fetchedSchedules = snapshot.docs.map(doc => {
            const data = doc.data() as Omit<FirebaseScheduleEntry, 'id'>;
            return {
                id: doc.id,
                ...data,
                shiftDate: data.shiftDate ? data.shiftDate.toDate() : new Date(),
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            };
        });
        callback(fetchedSchedules);
    }, (error) => {
        onError(error);
    });
};

export const addScheduleEntry = async (db: Firestore, newShift: NewShift, userId: string) => {
    const { employeeName, type, shiftDate, shiftTimeKey, role } = newShift;
    if (!employeeName || !shiftDate) return null;

    const dateObject = new Date(shiftDate + 'T00:00:00');
    
    let shiftData: any = {
        employeeName: employeeName.trim(),
        shiftDate: Timestamp.fromDate(dateObject),
        createdAt: Timestamp.now(),
        userId: userId,
        type: type,
        role: role,
    };

    if (type === 'Shift') {
        const selectedShift = PREDEFINED_SHIFTS.find(s => s.key === shiftTimeKey);
        if (selectedShift) {
             shiftData = { ...shiftData, shiftStart: selectedShift.start, shiftEnd: selectedShift.end };
        }
    }

    try {
        const docRef = await addDoc(collection(db, getCollectionPath()), shiftData);
        return { id: docRef.id, ...shiftData, shiftDate: dateObject };
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
};

export const updateScheduleEntry = async (db: Firestore, entryId: string, updates: Partial<ScheduleEntry>) => {
    try {
        const docRef = doc(db, getCollectionPath(), entryId);
        const firestoreUpdates: any = { ...updates };
        
        if (updates.shiftDate instanceof Date) {
            firestoreUpdates.shiftDate = Timestamp.fromDate(updates.shiftDate);
        }
        
        delete firestoreUpdates.id;

        await updateDoc(docRef, firestoreUpdates);
        return true;
    } catch (error) {
        console.error("Error updating document: ", error);
        return false;
    }
};

export const batchAddScheduleEntries = async (db: Firestore, entries: any[]) => {
    try {
        const batch = writeBatch(db);
        const colRef = collection(db, getCollectionPath());

        entries.forEach(entry => {
            const newDocRef = doc(colRef);
            batch.set(newDocRef, {
                ...entry,
                createdAt: Timestamp.now()
            });
        });

        await batch.commit();
    } catch (error) {
        console.error("Error committing batch: ", error);
        throw error;
    }
};

export const deleteScheduleEntry = async (db: Firestore, id: string) => {
    try {
        await deleteDoc(doc(db, getCollectionPath(), id));
        return true;
    } catch (error) {
        console.error("Error deleting document: ", error);
        return false;
    }
};

export const createShiftCopy = async (db: Firestore, params: {
    shiftDetails: Partial<ScheduleEntry>,
    targetEmployeeName: string,
    targetDateKey: string,
    existingShiftIdAtTarget: string | null,
    userId: string
}) => {
    const { shiftDetails, targetEmployeeName, targetDateKey, existingShiftIdAtTarget, userId } = params;

    const dateObject = new Date(targetDateKey + 'T00:00:00');
    
    const newShiftData: any = {
        employeeName: targetEmployeeName,
        shiftDate: Timestamp.fromDate(dateObject),
        createdAt: Timestamp.now(),
        userId: userId,
        type: shiftDetails.type,
        role: shiftDetails.role || getRoleByEmployee(targetEmployeeName),
        shiftStart: shiftDetails.shiftStart,
        shiftEnd: shiftDetails.shiftEnd,
    };

    try {
        if (existingShiftIdAtTarget) {
            const docRef = doc(db, getCollectionPath(), existingShiftIdAtTarget);
            await updateDoc(docRef, newShiftData);
        } else {
            await addDoc(collection(db, getCollectionPath()), newShiftData);
        }
        return true;
    } catch (error) {
        console.error("Error creating/updating shift copy: ", error);
        return false;
    }
};

export const addNotification = async (db: Firestore, notification: {
    type: 'add' | 'edit' | 'delete';
    message: string;
    emailDraft: { subject: string; body: string };
}) => {
    try {
        await addDoc(collection(db, getNotificationsPath()), {
            ...notification,
            timestamp: Timestamp.now()
        });
    } catch (error) {
        console.error("Error adding notification log: ", error);
    }
};

export const onNotificationsUpdate = (
    db: Firestore,
    callback: (notifications: any[]) => void
) => {
    const colRef = collection(db, getNotificationsPath());
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(15));

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        callback(notifications);
    });
};

export const onTemplatesUpdate = (
    db: Firestore,
    callback: (templates: ShiftTemplate[]) => void
) => {
    const colRef = collection(db, getTemplatesPath());
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const templates = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as ShiftTemplate[];
        callback(templates);
    });
};

export const addTemplate = async (db: Firestore, templateData: Omit<ShiftTemplate, 'id' | 'createdAt'>) => {
    try {
        await addDoc(collection(db, getTemplatesPath()), {
            ...templateData,
            createdAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error("Error adding template: ", error);
        return false;
    }
};

export const deleteTemplate = async (db: Firestore, id: string) => {
    try {
        await deleteDoc(doc(db, getTemplatesPath(), id));
        return true;
    } catch (error) {
        console.error("Error deleting template: ", error);
        return false;
    }
};

export const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
