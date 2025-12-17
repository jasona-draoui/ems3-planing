import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { BrainCircuit, Loader2, FileDown } from 'lucide-react';

import { PREDEFINED_EMPLOYEES } from './constants';
import type { ScheduleEntry, NewShift, MappedSchedules } from './types';
import * as firebaseService from './services/firebaseService';
import { analyzeSchedule } from './services/geminiService';

import Header from './components/Header';
import Footer from './components/Footer';
import ScheduleForm from './components/ScheduleForm';
import ScheduleGrid from './components/ScheduleGrid';
import WeekNavigator from './components/WeekNavigator';
import AnalysisModal from './components/AnalysisModal';
import ConfirmationModal from './components/ConfirmationModal';

// --- Main Application Component ---
const App: React.FC = () => {
    // Firebase State
    const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
    const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);

    // Application State
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // AI Analysis State
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Confirmation Modal State
    const [confirmationState, setConfirmationState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: (() => void) | null;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
    });

    // --- UTILITY FUNCTIONS ---
    const getStartOfWeek = useCallback((date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const dateRange = useMemo(() => {
        const start = getStartOfWeek(currentDate);
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    }, [currentDate, getStartOfWeek]);

    // --- FIREBASE INITIALIZATION & DATA SUBSCRIPTION ---
    useEffect(() => {
        const { auth: authInstance, db: dbInstance } = firebaseService.initialize();
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribeAuth = firebaseService.onAuthChange(authInstance, (user) => {
            setUserId(user ? user.uid : crypto.randomUUID());
            setIsFirebaseReady(true);
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!isFirebaseReady || !db) return;

        setLoading(true);
        const unsubscribeSchedules = firebaseService.onScheduleUpdate(db, (newSchedules) => {
            setSchedules(newSchedules);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching schedules:", error);
            setLoading(false);
        });

        return () => unsubscribeSchedules();
    }, [isFirebaseReady, db]);

    // --- DATA MAPPING FOR GRID ---
    const mappedSchedules: MappedSchedules = useMemo(() => {
        const mapping: MappedSchedules = {};
        schedules.forEach(shift => {
            if (!shift.shiftDate || !shift.employeeName) return;
            const dateKey = firebaseService.formatDateKey(shift.shiftDate);
            if (!mapping[shift.employeeName]) {
                mapping[shift.employeeName] = {};
            }
            mapping[shift.employeeName][dateKey] = shift;
        });
        return mapping;
    }, [schedules]);

    const allEmployeeNames = useMemo(() => {
        const existingNames = Object.keys(mappedSchedules);
        const combined = new Set([...PREDEFINED_EMPLOYEES, ...existingNames]);
        return Array.from(combined).sort((a, b) => a.localeCompare(b));
    }, [mappedSchedules]);


    // --- EVENT HANDLERS ---
    const handleAddShift = async (newShiftData: NewShift) => {
        if (!db || !userId) return;
        await firebaseService.addScheduleEntry(db, newShiftData, userId);
    };

    const handleDeleteShift = async (id: string) => {
        if (!db) return;
        await firebaseService.deleteScheduleEntry(db, id);
    };

    const handleCreateShiftCopy = (
        shiftDetails: Partial<ScheduleEntry>,
        targetEmployeeName: string,
        targetDateKey: string,
        existingShiftAtTarget: ScheduleEntry | null
    ) => {
        if (!db || !userId) return;

        const performCopy = () => {
             firebaseService.createShiftCopy(db, { 
                shiftDetails, 
                targetEmployeeName, 
                targetDateKey, 
                existingShiftIdAtTarget: existingShiftAtTarget ? existingShiftAtTarget.id : null,
                userId 
            });
            closeConfirmation();
        };

        if (existingShiftAtTarget) {
            setConfirmationState({
                isOpen: true,
                title: 'Replace Schedule Entry?',
                message: `This will replace the existing entry for ${targetEmployeeName}. Are you sure?`,
                onConfirm: performCopy,
            });
        } else {
            performCopy();
        }
    };
    
    const closeConfirmation = () => {
        setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: null });
    };

    const handlePrevWeek = () => {
        setCurrentDate(prev => new Date(prev.setDate(prev.getDate() - 7)));
    };

    const handleNextWeek = () => {
        setCurrentDate(prev => new Date(prev.setDate(prev.getDate() + 7)));
    };

    const handleAnalyzeSchedule = async () => {
        setIsModalOpen(true);
        setIsAnalysisLoading(true);
        setAnalysisResult(null);

        const weekScheduleData = allEmployeeNames.reduce((acc, employee) => {
            acc[employee] = dateRange.map(date => {
                const dateKey = firebaseService.formatDateKey(date);
                return mappedSchedules[employee]?.[dateKey] || null;
            });
            return acc;
        }, {} as Record<string, (ScheduleEntry | null)[]>);


        try {
            const result = await analyzeSchedule(weekScheduleData, allEmployeeNames, dateRange);
            setAnalysisResult(result);
        } catch (error) {
            console.error("Gemini API Error:", error);
            setAnalysisResult("Sorry, I couldn't analyze the schedule. An error occurred.");
        } finally {
            setIsAnalysisLoading(false);
        }
    };
    
    const handleExportToCSV = () => {
        const escapeCsvCell = (cell: string | null | undefined): string => {
            if (cell === null || cell === undefined) {
                return '';
            }
            const strCell = String(cell);
            // Per RFC 4180, if a field contains a comma, a double quote, or a newline,
            // it must be enclosed in double quotes.
            if (strCell.includes('"') || strCell.includes(',') || strCell.includes('\n')) {
                // Any double quote inside the field must be escaped with another double quote.
                const escapedCell = strCell.replace(/"/g, '""');
                return `"${escapedCell}"`;
            }
            return strCell;
        };

        const headers = ['Employee', ...dateRange.map(date => 
            date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        )];
        
        const rows = allEmployeeNames.map(employeeName => {
            const rowData = dateRange.map(date => {
                const dateKey = firebaseService.formatDateKey(date);
                const shift = mappedSchedules[employeeName]?.[dateKey];
                
                if (!shift) return '';
                
                switch (shift.type) {
                    case 'Shift':
                        return `${shift.shiftStart} - ${shift.shiftEnd === '00:00' ? '24:00' : shift.shiftEnd}`;
                    case 'DayOff':
                        return 'Day Off';
                    case 'PaidLeave':
                        return 'Paid Leave';
                    case 'Recup':
                        return 'Recup';
                    default:
                        return '';
                }
            });
            return [employeeName, ...rowData];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(escapeCsvCell).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        
        const startOfWeek = getStartOfWeek(currentDate);
        const fileNameDate = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
        link.setAttribute('download', `schedule_week_of_${fileNameDate}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 font-sans">
            <Header userId={userId} isAuthReady={isFirebaseReady} />

            <ScheduleForm onAddShift={handleAddShift} loading={loading || !isFirebaseReady} />

            <main className="max-w-7xl mx-auto mt-10 mb-10">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                     <WeekNavigator
                        currentDate={currentDate}
                        getStartOfWeek={getStartOfWeek}
                        onPrevWeek={handlePrevWeek}
                        onNextWeek={handleNextWeek}
                    />
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleAnalyzeSchedule}
                            disabled={isAnalysisLoading}
                            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isAnalysisLoading ? (
                               <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                               <BrainCircuit className="w-5 h-5 mr-2" />
                            )}
                            Analyze with AI
                        </button>
                        <button
                            onClick={handleExportToCSV}
                            className="flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ring-offset-gray-900 transition"
                        >
                            <FileDown className="w-5 h-5 mr-2" />
                            Save to CSV
                        </button>
                    </div>
                </div>
                
                <ScheduleGrid
                    loading={loading}
                    allEmployeeNames={allEmployeeNames}
                    dateRange={dateRange}
                    mappedSchedules={mappedSchedules}
                    onDeleteShift={handleDeleteShift}
                    onCreateShiftCopy={handleCreateShiftCopy}
                />
            </main>

            <AnalysisModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                content={analysisResult}
                isLoading={isAnalysisLoading}
            />
            
             <ConfirmationModal
                isOpen={confirmationState.isOpen}
                title={confirmationState.title}
                message={confirmationState.message}
                onConfirm={confirmationState.onConfirm!}
                onCancel={closeConfirmation}
            />
            
            <Footer />
        </div>
    );
};

export default App;