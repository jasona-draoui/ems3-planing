
import React from 'react';
import { Sun, Calendar, Trash2, PhoneCall } from 'lucide-react';
import type { ScheduleEntry } from '../types';
import { translations, type Language } from '../translations';

interface ShiftCellProps {
    shift?: ScheduleEntry;
    onDelete: (id: string) => void;
    onEdit: (shift: ScheduleEntry) => void;
    language: Language;
}

const timeToMinutes = (time?: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const getShiftColorClass = (shift: ScheduleEntry) => {
    if (shift.type === 'OnCall') return 'bg-fuchsia-500/30 border-fuchsia-500 text-fuchsia-200';
    if (shift.type === 'DayOff') return 'bg-indigo-900/60 border-indigo-700 text-indigo-300';
    if (shift.type === 'PaidLeave') return 'bg-green-900/60 border-green-700 text-green-300';
    if (shift.type === 'Recup') return 'bg-yellow-900/60 border-yellow-700 text-yellow-300';
    
    // Logic for "Shift" type based on start time
    if (shift.type === 'Shift' && shift.shiftStart) {
        const startMin = timeToMinutes(shift.shiftStart);
        if (startMin <= 600) return 'bg-sky-500/30 border-sky-500 text-sky-200'; // Morning (<= 10:00)
        if (startMin <= 780) return 'bg-teal-500/30 border-teal-500 text-teal-200'; // Mid-Day (<= 13:00)
        if (startMin <= 900) return 'bg-amber-500/30 border-amber-500 text-amber-200'; // Evening (<= 15:00)
        return 'bg-rose-500/30 border-rose-500 text-rose-200'; // Night (>= 16:00)
    }

    return 'bg-gray-800/50 border-gray-700 text-gray-300';
};

const ShiftCell: React.FC<ShiftCellProps> = ({ shift, onDelete, onEdit, language }) => {
    const t = translations[language];

    if (!shift) {
        return (
            <div className="h-20 p-2 flex items-center justify-center text-xs font-medium bg-gray-800/20 text-gray-600 border border-transparent rounded-lg">
                {t.unscheduled}
            </div>
        );
    }

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const dataToCopy: Partial<ScheduleEntry> = {
            type: shift.type,
            shiftStart: shift.shiftStart,
            shiftEnd: shift.shiftEnd,
            role: shift.role
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dataToCopy));
        e.dataTransfer.effectAllowed = 'copy';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
    };

    const colorClasses = getShiftColorClass(shift);

    const baseProps = {
        className: `h-20 p-2 flex flex-col justify-center relative group rounded-lg transition-all duration-200 shadow-md border cursor-pointer hover:ring-2 hover:ring-cyan-500/50 ${colorClasses}`,
        draggable: true,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        onClick: () => onEdit(shift)
    };
    
    const DeleteButton = () => (
        <button
            onClick={(e) => { e.stopPropagation(); onDelete(shift.id); }}
            className="absolute top-1 right-1 p-1 text-red-300 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-white hover:bg-red-500 transform-gpu group-hover:animate-shake"
            aria-label={t.deleteEntry}
        >
            <Trash2 className="w-3 h-3" />
        </button>
    );

    let cellContent;
    switch (shift.type) {
        case 'DayOff':
            cellContent = (
                <div {...baseProps}>
                    <div className="flex items-center justify-center h-full text-sm font-semibold"><Sun className="w-4 h-4 mr-1.5"/>{t.dayOff}</div>
                    <DeleteButton />
                </div>
            );
            break;
        case 'PaidLeave':
            cellContent = (
                <div {...baseProps}>
                    <div className="flex items-center justify-center h-full text-sm font-semibold"><Calendar className="w-4 h-4 mr-1.5"/>{t.paidLeave}</div>
                    <DeleteButton />
                </div>
            );
            break;
        case 'Recup':
            cellContent = (
                <div {...baseProps}>
                    <div className="flex items-center justify-center h-full text-sm font-semibold"><Calendar className="w-4 h-4 mr-1.5"/>{t.recup}</div>
                    <DeleteButton />
                </div>
            );
            break;
        case 'OnCall':
            cellContent = (
                <div {...baseProps}>
                    <div className="flex items-center justify-center h-full text-sm font-semibold"><PhoneCall className="w-4 h-4 mr-1.5"/>{t.onCall}</div>
                    <DeleteButton />
                </div>
            );
            break;
        case 'Shift':
            const isCrossDay = timeToMinutes(shift.shiftEnd) < timeToMinutes(shift.shiftStart);
            const shiftDisplay = `${shift.shiftStart} - ${shift.shiftEnd === '00:00' ? '24:00' : shift.shiftEnd}`;
            cellContent = (
                <div {...baseProps}>
                    <div className="text-sm font-bold leading-tight">{shiftDisplay}</div>
                    {shift.role && <div className="text-[10px] uppercase font-bold opacity-80 mt-1 truncate">{shift.role}</div>}
                    <DeleteButton />
                </div>
            );
            break;
        default:
             cellContent = <div className="h-20 p-2" />;
    }

    return cellContent;
};

export default ShiftCell;
