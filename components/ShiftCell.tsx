import React from 'react';
import { Sun, Calendar, Trash2 } from 'lucide-react';
import type { ScheduleEntry } from '../types';

interface ShiftCellProps {
    shift?: ScheduleEntry;
    onDelete: (id: string) => void;
}

const timeToMinutes = (time?: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const ShiftCell: React.FC<ShiftCellProps> = ({ shift, onDelete }) => {
    if (!shift) {
        return (
            <div className="h-20 p-2 flex items-center justify-center text-xs font-medium bg-gray-800/20 text-gray-600 border border-transparent rounded-lg">
                Unscheduled
            </div>
        );
    }

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const dataToCopy: Partial<ScheduleEntry> = {
            type: shift.type,
            shiftStart: shift.shiftStart,
            shiftEnd: shift.shiftEnd,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dataToCopy));
        e.dataTransfer.effectAllowed = 'copy';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
    };

    const baseProps = {
        className: "h-20 p-2 flex flex-col justify-center relative group rounded-lg transition-all duration-200 shadow-md border cursor-grab",
        draggable: true,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
    };
    
    const DeleteButton = () => (
        <button
            onClick={(e) => { e.stopPropagation(); onDelete(shift.id); }}
            className="absolute top-1 right-1 p-1 text-red-300 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-white hover:bg-red-500 transform-gpu group-hover:animate-shake"
            aria-label={`Delete entry`}
        >
            <Trash2 className="w-3 h-3" />
        </button>
    );

    let cellContent;
    switch (shift.type) {
        case 'DayOff':
            cellContent = (
                <div {...baseProps} className={`${baseProps.className} bg-indigo-900/60 text-indigo-300 shadow-inner border-indigo-700`}>
                    <div className="flex items-center justify-center h-full text-sm"><Sun className="w-4 h-4 mr-1.5"/>Day Off</div>
                    <DeleteButton />
                </div>
            );
            break;
        case 'PaidLeave':
            cellContent = (
                <div {...baseProps} className={`${baseProps.className} bg-green-900/60 text-green-300 shadow-inner border-green-700`}>
                    <div className="flex items-center justify-center h-full text-sm"><Calendar className="w-4 h-4 mr-1.5"/>Paid Leave</div>
                    <DeleteButton />
                </div>
            );
            break;
        case 'Recup':
            cellContent = (
                <div {...baseProps} className={`${baseProps.className} bg-yellow-900/60 text-yellow-300 shadow-inner border-yellow-700`}>
                    <div className="flex items-center justify-center h-full text-sm"><Calendar className="w-4 h-4 mr-1.5"/>Recup</div>
                    <DeleteButton />
                </div>
            );
            break;
        case 'Shift':
            const isCrossDay = timeToMinutes(shift.shiftEnd) < timeToMinutes(shift.shiftStart);
            const shiftDisplay = `${shift.shiftStart} - ${shift.shiftEnd === '00:00' ? '24:00' : shift.shiftEnd}`;
            cellContent = (
                <div {...baseProps} className={`${baseProps.className} ${isCrossDay ? 'bg-red-800/50 border-red-700' : 'bg-cyan-800/50 border-cyan-700'}`}>
                    <div className="text-sm font-bold text-white leading-tight">{shiftDisplay}</div>
                    {shift.role && <div className="text-xs text-gray-200 opacity-80 mt-1 truncate">{shift.role}</div>}
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