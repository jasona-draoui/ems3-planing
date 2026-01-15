
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Clock, Briefcase, Sun, Calendar, PhoneCall } from 'lucide-react';
import type { ScheduleEntry, ShiftType } from '../types';
import { PREDEFINED_SHIFTS } from '../constants';
import { translations, type Language } from '../translations';

interface EditShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    shift: ScheduleEntry | null;
    onUpdate: (id: string, updates: Partial<ScheduleEntry>) => void;
    onDelete: (id: string) => void;
    language: Language;
}

const EditShiftModal: React.FC<EditShiftModalProps> = ({ isOpen, onClose, shift, onUpdate, onDelete, language }) => {
    const t = translations[language];
    const [type, setType] = useState<ShiftType>('Shift');
    const [shiftTimeKey, setShiftTimeKey] = useState(PREDEFINED_SHIFTS[0].key);

    useEffect(() => {
        if (shift) {
            setType(shift.type);
            if (shift.type === 'Shift' && shift.shiftStart && shift.shiftEnd) {
                const found = PREDEFINED_SHIFTS.find(s => s.start === shift.shiftStart && s.end === shift.shiftEnd);
                if (found) setShiftTimeKey(found.key);
            }
        }
    }, [shift]);

    if (!isOpen || !shift) return null;

    const handleSave = () => {
        const updates: Partial<ScheduleEntry> = { type };
        
        if (type === 'Shift') {
            const selected = PREDEFINED_SHIFTS.find(s => s.key === shiftTimeKey);
            if (selected) {
                updates.shiftStart = selected.start;
                updates.shiftEnd = selected.end;
                updates.role = shift.role; // Keep existing role for shift
            }
        } else {
            updates.role = type === 'DayOff' ? t.dayOff : type === 'PaidLeave' ? t.paidLeave : type === 'OnCall' ? t.onCall : t.recup;
            updates.shiftStart = undefined;
            updates.shiftEnd = undefined;
        }

        onUpdate(shift.id, updates);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="text-xl font-bold text-cyan-400 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2" />
                        {t.editEntry.replace('{name}', shift.employeeName)}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t.entryType}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Shift', 'OnCall', 'DayOff', 'PaidLeave', 'Recup'] as ShiftType[]).map(typeKey => (
                                <button
                                    key={typeKey}
                                    onClick={() => setType(typeKey)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                                        type === typeKey 
                                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                                            : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {typeKey === 'Shift' ? t.work : typeKey === 'OnCall' ? t.onCall : typeKey === 'DayOff' ? t.dayOff : typeKey === 'PaidLeave' ? t.leave : t.recup}
                                </button>
                            ))}
                        </div>
                    </div>

                    {type === 'Shift' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                                <Clock className="w-4 h-4 mr-1" /> {t.shiftTime}
                            </label>
                            <select 
                                value={shiftTimeKey}
                                onChange={(e) => setShiftTimeKey(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            >
                                {PREDEFINED_SHIFTS.map(s => (
                                    <option key={s.key} value={s.key}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-700">
                        <button
                            onClick={handleSave}
                            className="w-full flex items-center justify-center px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-95"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {t.saveChanges}
                        </button>
                        
                        <button
                            onClick={() => { onDelete(shift.id); onClose(); }}
                            className="w-full flex items-center justify-center px-6 py-2 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 font-medium rounded-xl transition"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t.deleteEntry}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditShiftModal;
