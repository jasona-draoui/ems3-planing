
import React from 'react';
import { Loader2, Users, User, Sun, Calendar, Briefcase, PhoneCall } from 'lucide-react';
import type { ScheduleEntry, MappedSchedules } from '../types';
import ShiftCell from './ShiftCell';
import { formatDateKey } from '../services/firebaseService';
import { translations, type Language } from '../translations';

interface ScheduleGridProps {
    loading: boolean;
    allEmployeeNames: string[];
    dateRange: Date[];
    mappedSchedules: MappedSchedules;
    onDeleteShift: (id: string) => void;
    onEditShift: (shift: ScheduleEntry) => void;
    onCreateShiftCopy: (
        shiftDetails: Partial<ScheduleEntry>,
        targetEmployeeName: string,
        targetDateKey: string,
        existingShiftAtTarget: ScheduleEntry | null
    ) => void;
    language: Language;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
    loading,
    allEmployeeNames,
    dateRange,
    mappedSchedules,
    onDeleteShift,
    onEditShift,
    onCreateShiftCopy,
    language
}) => {
    const t = translations[language];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12 text-cyan-400">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                {t.initializing}
            </div>
        );
    }

    if (allEmployeeNames.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl mt-8 border border-dashed border-gray-700">
                <Users className="w-10 h-10 mx-auto mb-4 text-cyan-500" />
                <p className="text-lg font-medium">No employees found.</p>
            </div>
        );
    }

    const gridTemplateColumns = `minmax(180px, 1fr) repeat(${dateRange.length}, minmax(140px, 1fr))`;

    const handleDrop = (
        e: React.DragEvent<HTMLDivElement>,
        targetEmployeeName: string,
        targetDate: Date
    ) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-target-active');

        try {
            const draggedData: Partial<ScheduleEntry> = JSON.parse(e.dataTransfer.getData('application/json'));
            const targetDateKey = formatDateKey(targetDate);
            const existingShiftAtTarget = mappedSchedules[targetEmployeeName]?.[targetDateKey] || null;
            
            if (draggedData.type) {
                onCreateShiftCopy(
                    draggedData,
                    targetEmployeeName,
                    targetDateKey,
                    existingShiftAtTarget
                );
            }
        } catch (error) {
            console.error("Invalid drag data format or drop error:", error);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drop-target-active');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('drop-target-active');
    };

    return (
        <div className="mt-8 space-y-4">
            <div className="text-[10px] sm:text-xs text-gray-400 flex flex-wrap justify-end gap-x-3 gap-y-2 uppercase font-bold tracking-wider px-2">
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-sky-500/30 border border-sky-500 mr-1.5"></div>{t.morning}</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-teal-500/30 border border-teal-500 mr-1.5"></div>{t.midDay}</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500 mr-1.5"></div>{t.evening}</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500 mr-1.5"></div>{t.night}</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-fuchsia-500/30 border border-fuchsia-500 mr-1.5"></div>{t.onCall}</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-indigo-900/60 border border-indigo-700 mr-1.5"></div>{t.dayOff}</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-green-900/60 border border-green-700 mr-1.5"></div>{t.paidLeave}</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded bg-yellow-900/60 border border-yellow-700 mr-1.5"></div>{t.recup}</div>
                <div className="flex items-center border-l border-gray-700 pl-3 ml-1"><Briefcase className="w-3 h-3 mr-1 text-cyan-400" />{t.draggable}</div>
            </div>

            <div className="overflow-x-auto shadow-2xl rounded-xl">
                <div className="min-w-full inline-block align-middle">
                    <div className="grid border border-gray-700 rounded-xl overflow-hidden" style={{ gridTemplateColumns }}>
                        <div className="sticky left-0 z-20 bg-gray-700 p-3 font-semibold text-lg text-cyan-300 flex items-center border-r border-gray-600">{t.employee}</div>
                        {dateRange.map((date, index) => {
                            const isToday = formatDateKey(date) === formatDateKey(new Date());
                            return (
                                <div key={index} className={`p-3 text-center text-sm font-medium border-l border-gray-600 ${isToday ? 'bg-cyan-900/40 text-cyan-300' : 'bg-gray-700 text-gray-300'}`}>
                                    <div className="font-bold">{date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'short' })}</div>
                                    <div className="text-xs">{date.getDate()}</div>
                                </div>
                            );
                        })}
                        
                        {allEmployeeNames.map(employeeName => (
                            <React.Fragment key={employeeName}>
                                <div className="sticky left-0 z-10 bg-gray-800 p-3 font-semibold text-white flex items-center border-r border-t border-gray-700">
                                    <User className="w-4 h-4 mr-2 text-cyan-500 flex-shrink-0" />
                                    <span className="truncate">{employeeName}</span>
                                </div>
                                {dateRange.map((date, index) => {
                                    const dateKey = formatDateKey(date);
                                    const shift = mappedSchedules[employeeName]?.[dateKey];
                                    return (
                                        <div key={index} className="p-1 border-l border-t border-gray-700 transition duration-100" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, employeeName, date)}>
                                            <ShiftCell shift={shift} onDelete={onDeleteShift} onEdit={onEditShift} language={language} />
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleGrid;
