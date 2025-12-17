
import React, { useState, useCallback } from 'react';
import { User, Calendar, Clock, Loader2, Plus, Sun, Briefcase, Tag } from 'lucide-react';
import { PREDEFINED_EMPLOYEES, PREDEFINED_SHIFTS, getRoleByEmployee } from '../constants';
import type { NewShift, ShiftType } from '../types';

interface ScheduleFormProps {
    onAddShift: (newShift: NewShift) => void;
    loading: boolean;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onAddShift, loading }) => {
    const defaultEmployee = PREDEFINED_EMPLOYEES[0] || '';
    const initialFormState: NewShift = {
        employeeName: defaultEmployee,
        type: 'Shift',
        shiftDate: '',
        shiftTimeKey: PREDEFINED_SHIFTS[0].key,
        role: getRoleByEmployee(defaultEmployee),
    };

    const [newShift, setNewShift] = useState<NewShift>(initialFormState);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setNewShift(prev => {
            const newState = { ...prev, [name]: value };
            
            if (name === 'employeeName') {
                if (newState.type === 'Shift') {
                    newState.role = getRoleByEmployee(value);
                }
            }
            
            if (name === 'type') {
                const newType = value as ShiftType;
                if (newType === 'Shift') {
                    newState.role = getRoleByEmployee(newState.employeeName);
                } else if (newType === 'DayOff') {
                    newState.role = 'Day Off'; 
                } else if (newType === 'PaidLeave') {
                    newState.role = 'Paid Leave';
                } else if (newType === 'Recup') {
                    newState.role = 'Recup';
                }
            }
            
            return newState;
        });
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddShift(newShift);
        setNewShift(prev => ({
            ...initialFormState,
            employeeName: prev.employeeName, // Keep the last selected employee
            role: getRoleByEmployee(prev.employeeName), // Reset role based on kept employee
        }));
    };

    return (
        <div className="max-w-4xl mx-auto bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center">
                <Plus className="w-6 h-6 mr-3 text-cyan-400" />
                Add New Schedule Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative md:col-span-2">
                        <label htmlFor="employeeName" className="block text-sm font-medium text-gray-300 mb-1">Employee *</label>
                        <div className="relative">
                            <select id="employeeName" name="employeeName" value={newShift.employeeName} onChange={handleInputChange} required className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 text-white shadow-inner appearance-none">
                                {PREDEFINED_EMPLOYEES.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                            <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Type *</label>
                        <div className="relative">
                            <select id="type" name="type" value={newShift.type} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 text-white shadow-inner appearance-none">
                                <option value="Shift">Work Shift</option>
                                <option value="DayOff">Day Off</option>
                                <option value="PaidLeave">Paid Leave</option>
                                <option value="Recup">Recup</option>
                            </select>
                            { newShift.type === 'Shift' ? <Briefcase className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" /> : newShift.type === 'DayOff' ? <Sun className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" /> : <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" /> }
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <label htmlFor="shiftDate" className="block text-sm font-medium text-gray-300 mb-1">Date *</label>
                        <div className="relative">
                           <input type="date" id="shiftDate" name="shiftDate" value={newShift.shiftDate} onChange={handleInputChange} required className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 text-white shadow-inner" />
                           <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="relative md:col-span-2" style={{ display: newShift.type === 'Shift' ? 'block' : 'none' }}>
                        <label htmlFor="shiftTimeKey" className="block text-sm font-medium text-gray-300 mb-1">Shift Time *</label>
                        <div className="relative">
                            <select id="shiftTimeKey" name="shiftTimeKey" value={newShift.shiftTimeKey} onChange={handleInputChange} required={newShift.type === 'Shift'} disabled={newShift.type !== 'Shift'} className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 text-white shadow-inner appearance-none disabled:bg-gray-800 disabled:opacity-50">
                                {PREDEFINED_SHIFTS.map(shift => <option key={shift.key} value={shift.key}>{shift.label}</option>)}
                            </select>
                            <Clock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    
                     <div className="relative">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                        <div className="relative">
                            <input type="text" id="role" name="role" value={newShift.role} readOnly className="w-full pl-10 pr-4 py-2 bg-gray-700/60 border border-gray-600 rounded-lg text-gray-300 shadow-inner cursor-default" />
                            <Tag className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-gray-900 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ring-offset-gray-800 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                    Add Entry
                </button>
            </form>
        </div>
    );
};

export default ScheduleForm;
