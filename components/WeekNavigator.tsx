
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekNavigatorProps {
    currentDate: Date;
    getStartOfWeek: (date: Date) => Date;
    onPrevWeek: () => void;
    onNextWeek: () => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({ currentDate, getStartOfWeek, onPrevWeek, onNextWeek }) => {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className="flex items-center space-x-4 bg-gray-800 p-2 rounded-lg border border-gray-700">
            <button onClick={onPrevWeek} className="p-2 rounded-md hover:bg-gray-700 transition text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center font-semibold text-white w-48">
                {formatDate(startOfWeek)} - {formatDate(endOfWeek)}
            </div>
            <button onClick={onNextWeek} className="p-2 rounded-md hover:bg-gray-700 transition text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};

export default WeekNavigator;
