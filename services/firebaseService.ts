import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    query, 
    onSnapshot, 
    addDoc, 
    deleteDoc, 
    Timestamp, 
    doc,
    type Firestore
} from 'firebase/firestore';

import type { ScheduleEntry, NewShift, FirebaseScheduleEntry, ShiftType } from '../types';
import { PREDEFINED_SHIFTS, getRoleByEmployee } from '../constants';

// FIX: Declare build-time variables to resolve TypeScript errors.
// These variables are expected to be injected by the build environment.
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

// --- Global Firebase Configuration Variables ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-planning-app';

// FIX: Provide a mock config if the real one isn't injected to prevent app crash.
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

// Helper function for Firestore collection path
const getCollectionPath = () => `/artifacts/${appId}/public/data/schedules`;

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
        console.error("Fatal Error: Firebase initialization failed. Please check your configuration.", e);
        // In a real app, you might want to render an error screen here.
        // For now, we'll re-throw to make it clear initialization failed.
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

    if (!employeeName || !shiftDate) {
        console.error('Validation Error: Employee Name and Date are required.');
        return;
    }

    const dateObject = new Date(shiftDate + 'T00:00:00');
    
    let shiftData: Omit<FirebaseScheduleEntry, 'id'> = {
        employeeName: employeeName.trim(),
        shiftDate: Timestamp.fromDate(dateObject),
        createdAt: Timestamp.now(),
        userId: userId,
        type: type,
        role: role,
    };

    if (type === 'Shift') {
        if (!shiftTimeKey) {
            console.error('Validation Error: Shift Time is required.');
            return;
        }
        const selectedShift = PREDEFINED_SHIFTS.find(s => s.key === shiftTimeKey);
        if (selectedShift) {
             shiftData = { ...shiftData, shiftStart: selectedShift.start, shiftEnd: selectedShift.end };
        }
    }

    try {
        await addDoc(collection(db, getCollectionPath()), shiftData);
    } catch (error) {
        console.error("Error adding document: ", error);
    }
};

export const deleteScheduleEntry = async (db: Firestore, id: string) => {
    try {
        await deleteDoc(doc(db, getCollectionPath(), id));
    } catch (error) {
        console.error("Error deleting document: ", error);
    }
};

interface CreateShiftCopyParams {
    shiftDetails: Partial<ScheduleEntry>;
    targetEmployeeName: string;
    targetDateKey: string;
    existingShiftIdAtTarget: string | null;
    userId: string;
}

export const createShiftCopy = async (db: Firestore, params: CreateShiftCopyParams) => {
    const { shiftDetails, targetEmployeeName, targetDateKey, existingShiftIdAtTarget, userId } = params;

    try {
        if (existingShiftIdAtTarget) {
            await deleteDoc(doc(db, getCollectionPath(), existingShiftIdAtTarget));
        }

        const newDate = new Date(targetDateKey + 'T00:00:00');
        const type = shiftDetails.type as ShiftType;

        let assignedRole = '';
        if (type === 'Shift') assignedRole = getRoleByEmployee(targetEmployeeName);
        else if (type === 'DayOff') assignedRole = 'Day Off';
        else if (type === 'PaidLeave') assignedRole = 'Paid Leave';
        else if (type === 'Recup') assignedRole = 'Recup';

        const newShiftData: Omit<FirebaseScheduleEntry, 'id'> = {
            employeeName: targetEmployeeName,
            shiftDate: Timestamp.fromDate(newDate),
            createdAt: Timestamp.now(),
            userId: userId,
            type: type,
            role: assignedRole,
            ...(type === 'Shift' && {
                shiftStart: shiftDetails.shiftStart,
                shiftEnd: shiftDetails.shiftEnd,
            }),
        };

        await addDoc(collection(db, getCollectionPath()), newShiftData);
    } catch (error) {
        console.error("Error creating shift copy: ", error);
    }
};


export const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};