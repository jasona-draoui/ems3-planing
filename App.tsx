
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { BrainCircuit, Loader2, FileDown, Copy, CloudCheck, Save, CheckCircle2, Calendar, Settings } from 'lucide-react';

import { PREDEFINED_EMPLOYEES } from './constants';
import type { ScheduleEntry, NewShift, MappedSchedules, ShiftTemplate } from './types';
import * as firebaseService from './services/firebaseService';
import { analyzeSchedule } from './services/geminiService';
import { notifyScheduleChange } from './services/notificationService';
import { translations, type Language } from './translations';

import Header from './components/Header';
import Footer from './components/Footer';
import ScheduleForm from './components/ScheduleForm';
import ScheduleGrid from './components/ScheduleGrid';
import WeekNavigator from './components/WeekNavigator';
import AnalysisModal from './components/AnalysisModal';
import ConfirmationModal from './components/ConfirmationModal';
import EditShiftModal from './components/EditShiftModal';
import NotificationSidebar from './components/NotificationSidebar';

type ViewPreference = 'current' | 'previous' | 'sticky';

// --- Main Application Component ---
const App: React.FC = () => {
    // Firebase State
    const [db, setDb] = useState<ReturnType<typeof getFirestore> | null>(null);
    const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);

    // Language State
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem('ems3_lang') as Language) || 'en';
    });

    const t = translations[language];

    // Application State
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCopying, setIsCopying] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
    const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);

    // Persistence: View Preferences
    const [viewPreference, setViewPreference] = useState<ViewPreference>(() => {
        return (localStorage.getItem('ems3_view_pref') as ViewPreference) || 'sticky';
    });

    // Persistence: Initial date logic based on preference
    const [currentDate, setCurrentDate] = useState(() => {
        const pref = localStorage.getItem('ems3_view_pref') || 'sticky';
        
        if (pref === 'current') {
            return new Date();
        }
        
        if (pref === 'previous') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            return lastWeek;
        }

        const savedDate = localStorage.getItem('ems3_current_date');
        if (savedDate) {
            try {
                return new Date(savedDate);
            } catch (e) {
                return new Date();
            }
        }
        return new Date();
    });

    // Update localStorage when preference changes
    const handleViewPreferenceChange = (pref: ViewPreference) => {
        setViewPreference(pref);
        localStorage.setItem('ems3_view_pref', pref);
    };

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('ems3_lang', lang);
    };

    // Save date to localStorage whenever it changes (for sticky mode)
    useEffect(() => {
        localStorage.setItem('ems3_current_date', currentDate.toISOString());
    }, [currentDate]);

    // UI Modals State
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<ScheduleEntry | null>(null);
    
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

        const unsubscribeNotifications = firebaseService.onNotificationsUpdate(db, (newNotifs) => {
            setNotifications(newNotifs);
        });

        const unsubscribeTemplates = firebaseService.onTemplatesUpdate(db, (newTemplates) => {
            setTemplates(newTemplates);
        });

        return () => {
            unsubscribeSchedules();
            unsubscribeNotifications();
            unsubscribeTemplates();
        };
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
        setSaveStatus('saving');
        const added = await firebaseService.addScheduleEntry(db, newShiftData, userId);
        if (added) {
            notifyScheduleChange(db, { actionType: 'add', shift: added }, language);
        }
        setTimeout(() => setSaveStatus('idle'), 1000);
    };

    const handleDeleteShift = async (id: string) => {
        if (!db) return;
        const shiftToDelete = schedules.find(s => s.id === id);
        setSaveStatus('saving');
        const success = await firebaseService.deleteScheduleEntry(db, id);
        if (success && shiftToDelete) {
            notifyScheduleChange(db, { actionType: 'delete', shift: shiftToDelete }, language);
        }
        setTimeout(() => setSaveStatus('idle'), 1000);
    };

    const handleUpdateShift = async (id: string, updates: Partial<ScheduleEntry>) => {
        if (!db) return;
        const previousShift = schedules.find(s => s.id === id);
        setSaveStatus('saving');
        const success = await firebaseService.updateScheduleEntry(db, id, updates);
        if (success && previousShift) {
            const updatedShift = { ...previousShift, ...updates };
            notifyScheduleChange(db, { actionType: 'edit', shift: updatedShift, previousShift }, language);
        }
        setTimeout(() => setSaveStatus('idle'), 1000);
    };

    const handleAddTemplate = async (templateData: Omit<ShiftTemplate, 'id' | 'createdAt'>) => {
        if (!db) return;
        return await firebaseService.addTemplate(db, templateData);
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!db) return;
        return await firebaseService.deleteTemplate(db, id);
    };

    const handleManualSave = () => {
        setSaveStatus('saving');
        setTimeout(() => {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 800);
    };

    const handleCopyLastWeek = async () => {
        if (!db || !userId) return;
        
        const startOfCurrentWeek = getStartOfWeek(currentDate);
        const startOfLastWeek = new Date(startOfCurrentWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);

        const lastWeekShifts = schedules.filter(shift => {
            const d = new Date(shift.shiftDate);
            return d >= startOfLastWeek && d <= endOfLastWeek;
        });

        if (lastWeekShifts.length === 0) {
            alert("No shifts found in the previous week to copy.");
            return;
        }

        const confirmCopy = () => {
            setIsCopying(true);
            const newEntries = lastWeekShifts.map(shift => {
                const newDate = new Date(shift.shiftDate);
                newDate.setDate(newDate.getDate() + 7);
                
                const { id, createdAt, shiftDate, ...baseData } = shift;
                return {
                    ...baseData,
                    shiftDate: Timestamp.fromDate(newDate),
                    userId: userId
                };
            });

            firebaseService.batchAddScheduleEntries(db, newEntries)
                .then(() => {
                    setIsCopying(false);
                    // Single notification for batch update
                    notifyScheduleChange(db, { 
                        actionType: 'add', 
                        shift: { employeeName: 'Entire Team', type: 'Shift' as any, shiftDate: dateRange[0] } 
                    }, language);
                })
                .catch(() => setIsCopying(false));
        };

        setConfirmationState({
            isOpen: true,
            title: t.copyConfirmTitle,
            message: t.copyConfirmMessage.replace('{count}', lastWeekShifts.length.toString()),
            onConfirm: confirmCopy,
        });
    };

    const handleCreateShiftCopy = (
        shiftDetails: Partial<ScheduleEntry>,
        targetEmployeeName: string,
        targetDateKey: string,
        existingShiftAtTarget: ScheduleEntry | null
    ) => {
        if (!db || !userId) return;

        const performCopy = async () => {
             await firebaseService.createShiftCopy(db, { 
                shiftDetails, 
                targetEmployeeName, 
                targetDateKey, 
                existingShiftIdAtTarget: existingShiftAtTarget ? existingShiftAtTarget.id : null,
                userId 
            });
            // Notify about the drag-and-drop copy
            notifyScheduleChange(db, { 
                actionType: 'add', 
                shift: { employeeName: targetEmployeeName, type: shiftDetails.type, shiftDate: new Date(targetDateKey) } 
            }, language);
            closeConfirmation();
        };

        if (existingShiftAtTarget) {
            setConfirmationState({
                isOpen: true,
                title: t.confirmTitle,
                message: t.confirmMessage.replace('{name}', targetEmployeeName),
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
            const result = await analyzeSchedule(weekScheduleData, allEmployeeNames, dateRange, language);
            setAnalysisResult(result);
        } catch (error) {
            console.error("Analysis error:", error);
            setAnalysisResult("Failed to generate analysis. Please try again later.");
        } finally {
            setIsAnalysisLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-20 selection:bg-cyan-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Header 
                    userId={userId} 
                    isAuthReady={isFirebaseReady} 
                    onToggleNotifications={() => setIsNotificationSidebarOpen(true)}
                    notificationCount={notifications.length}
                    viewPreference={viewPreference}
                    onViewPreferenceChange={handleViewPreferenceChange}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                />

                <main className="space-y-12">
                    <section>
                        <ScheduleForm 
                            onAddShift={handleAddShift} 
                            loading={saveStatus === 'saving'} 
                            language={language}
                            userId={userId || ''}
                            templates={templates}
                            onSaveTemplate={handleAddTemplate}
                            onDeleteTemplate={handleDeleteTemplate}
                        />
                    </section>

                    <section className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-2xl font-bold text-white flex items-center">
                                    <Calendar className="w-6 h-6 mr-2 text-cyan-400" />
                                    {t.weeklySchedule}
                                </h2>
                                <div className="flex items-center text-xs font-medium text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full border border-gray-600">
                                    {saveStatus === 'saving' ? (
                                        <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> {t.saving}</>
                                    ) : saveStatus === 'success' ? (
                                        <><CheckCircle2 className="w-3 h-3 mr-1.5 text-green-400" /> {t.synced}</>
                                    ) : (
                                        <><CloudCheck className="w-3 h-3 mr-1.5 text-gray-500" /> {t.ready}</>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                <WeekNavigator 
                                    currentDate={currentDate} 
                                    getStartOfWeek={getStartOfWeek}
                                    onPrevWeek={handlePrevWeek} 
                                    onNextWeek={handleNextWeek} 
                                    language={language}
                                />
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopyLastWeek}
                                        disabled={isCopying || loading}
                                        className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm font-medium rounded-lg border border-gray-600 transition disabled:opacity-50"
                                        title={t.copyPrev}
                                    >
                                        {isCopying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                                        {t.copyPrev}
                                    </button>

                                    <button
                                        onClick={handleAnalyzeSchedule}
                                        className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-500 text-sm font-medium rounded-lg shadow-lg shadow-purple-900/20 transition group"
                                    >
                                        <BrainCircuit className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                                        {t.aiAnalyze}
                                    </button>
                                    
                                    <button
                                        onClick={handleManualSave}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition"
                                        title={t.forceSync}
                                    >
                                        <Save className="w-5 h-5 text-gray-300" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <ScheduleGrid 
                            loading={loading}
                            allEmployeeNames={allEmployeeNames}
                            dateRange={dateRange}
                            mappedSchedules={mappedSchedules}
                            onDeleteShift={handleDeleteShift}
                            onEditShift={setEditingShift}
                            onCreateShiftCopy={handleCreateShiftCopy}
                            language={language}
                        />
                    </section>
                </main>

                <Footer language={language} />
            </div>

            {/* Modals & Sidebar */}
            <NotificationSidebar 
                isOpen={isNotificationSidebarOpen}
                onClose={() => setIsNotificationSidebarOpen(false)}
                notifications={notifications}
                language={language}
            />

            <AnalysisModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                content={analysisResult}
                isLoading={isAnalysisLoading}
                language={language}
            />

            <ConfirmationModal 
                isOpen={confirmationState.isOpen}
                title={confirmationState.title}
                message={confirmationState.message}
                onConfirm={confirmationState.onConfirm || (() => {})}
                onCancel={closeConfirmation}
                language={language}
            />

            <EditShiftModal 
                isOpen={!!editingShift}
                shift={editingShift}
                onClose={() => setEditingShift(null)}
                onUpdate={handleUpdateShift}
                onDelete={handleDeleteShift}
                language={language}
            />

            {/* Backdrop for Sidebar */}
            {isNotificationSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-[55] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsNotificationSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default App;
