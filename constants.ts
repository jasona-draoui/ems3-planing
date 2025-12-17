
import type { ShiftTime } from './types';

export const PREDEFINED_EMPLOYEES: string[] = [
    'yassine adraoui',
    'bilal el biyaali',
    'ayoub belabid',
    'khalid ghanem',
    'anas izmaz',
    'mostapha kbiri',
    'adnan el assam',
    'mouad lahrech',
    'aziz boulehjour',
    'ayoub benchaayeb',
].sort((a, b) => a.localeCompare(b));

export const EMPLOYEE_ROLE_MAP: { [key: string]: string } = {
    'adnan el assam': 'chef de prod',
    'mouad lahrech': 'chef de prod',
    'aziz boulehjour': 'TL',
    'ayoub benchaayeb': 'TL',
    'yassine adraoui': 'mailer',
    'bilal el biyaali': 'mailer',
    'ayoub belabid': 'mailer',
    'khalid ghanem': 'mailer',
    'anas izmaz': 'mailer',
    'mostapha kbiri': 'mailer',
};

export const getRoleByEmployee = (employeeName: string): string => EMPLOYEE_ROLE_MAP[employeeName] || 'Unassigned';

export const PREDEFINED_SHIFTS: ShiftTime[] = [
    { key: '09:00-17:00', label: '09:00 - 17:00', start: '09:00', end: '17:00' },
    { key: '11:00-19:00', label: '11:00 - 19:00', start: '11:00', end: '19:00' },
    { key: '14:00-22:00', label: '14:00 - 22:00', start: '14:00', end: '22:00' },
    { key: '16:00-00:00', label: '16:00 - 00:00 (Cross-midnight)', start: '16:00', end: '00:00' },
];
