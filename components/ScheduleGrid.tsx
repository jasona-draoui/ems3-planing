import React from 'react';
import { Loader2, Users, User, Sun, Calendar, Briefcase } from 'lucide-react';
import type { ScheduleEntry, MappedSchedules } from '../types';
import ShiftCell from './ShiftCell';
import { formatDateKey } from '../services/firebaseService';

interface ScheduleGridProps {
    loading: boolean;
    allEmployeeNames: string[];
    dateRange: Date[];
    mappedSchedules: MappedSchedules;
    onDeleteShift: (id: string) => void;
    onCreateShiftCopy: (
        shiftDetails: Partial<ScheduleEntry>,
        targetEmployeeName: string,
        targetDateKey: string,
        existingShiftAtTarget: ScheduleEntry | null
    ) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
    loading,
    allEmployeeNames,
    dateRange,
    mappedSchedules,
    onDeleteShift,
    onCreateShiftCopy,
}) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12 text-cyan-400">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                Loading Schedule...
            </div>
        );
    }

    if (allEmployeeNames.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl mt-8 border border-dashed border-gray-700">
                <Users className="w-10 h-10 mx-auto mb-4 text-cyan-500" />
                <p className="text-lg font-medium">No employees found.</p>
                <p className="text-sm">Add employees to the constants file to begin.</p>
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
            <div className="text-sm text-gray-400 flex flex-wrap justify-end space-x-4 gap-y-2">
                <div className="flex items-center"><Sun className="w-4 h-4 mr-1 text-indigo-400" />Day Off</div>
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-green-400" />Paid Leave</div>
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-yellow-400" />Recup</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-700/70 mr-1.5"></div>Cross-Midnight</div>
                <div className="flex items-center"><Briefcase className="w-4 h-4 mr-1 text-cyan-400" />Draggable</div>
            </div>

            <div className="overflow-x-auto shadow-2xl rounded-xl">
                <div className="min-w-full inline-block align-middle">
                    <div className="grid border border-gray-700 rounded-xl overflow-hidden" style={{ gridTemplateColumns }}>
                        <div className="sticky left-0 z-20 bg-gray-700 p-3 font-semibold text-lg text-cyan-300 flex items-center border-r border-gray-600">Employee</div>
                        {dateRange.map((date, index) => {
                            const isToday = formatDateKey(date) === formatDateKey(new Date());
                            return (
                                <div key={index} className={`p-3 text-center text-sm font-medium border-l border-gray-600 ${isToday ? 'bg-cyan-900/40 text-cyan-300' : 'bg-gray-700 text-gray-300'}`}>
                                    <div className="font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
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
                                            <ShiftCell shift={shift} onDelete={onDeleteShift} />
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