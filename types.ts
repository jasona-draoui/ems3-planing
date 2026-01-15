
import { Timestamp } from 'firebase/firestore';

export type ShiftType = 'Shift' | 'DayOff' | 'PaidLeave' | 'Recup' | 'OnCall';

export interface ShiftTime {
    key: string;
    label: string;
    start: string;
    end: string;
}

export interface FirebaseScheduleEntry {
    id: string;
    employeeName: string;
    shiftDate: Timestamp;
    createdAt: Timestamp;
    userId: string;
    type: ShiftType;
    role: string;
    shiftStart?: string;
    shiftEnd?: string;
}

export interface ScheduleEntry extends Omit<FirebaseScheduleEntry, 'shiftDate' | 'createdAt'> {
    shiftDate: Date;
    createdAt: Date;
}

export interface ShiftTemplate {
    id: string;
    name: string;
    type: ShiftType;
    shiftTimeKey?: string;
    role: string;
    shiftStart?: string;
    shiftEnd?: string;
    userId: string;
    createdAt: Date;
}

export interface NewShift {
    employeeName: string;
    type: ShiftType;
    shiftDate: string; // YYYY-MM-DD from input
    shiftTimeKey: string;
    role: string;
}

export interface MappedSchedules {
    [employeeName: string]: {
        [dateKey: string]: ScheduleEntry;
    };
}
