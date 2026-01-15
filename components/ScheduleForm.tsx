
import React, { useState, useCallback } from 'react';
import { User, Calendar, Clock, Loader2, Plus, Sun, Briefcase, Tag, PhoneCall, Bookmark, Trash2, Check, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { PREDEFINED_EMPLOYEES, PREDEFINED_SHIFTS, getRoleByEmployee } from '../constants';
import type { NewShift, ShiftType, ShiftTemplate } from '../types';
import { translations, type Language } from '../translations';

interface ScheduleFormProps {
    onAddShift: (newShift: NewShift) => void;
    loading: boolean;
    language: Language;
    userId: string;
    templates: ShiftTemplate[];
    onSaveTemplate: (template: Omit<ShiftTemplate, 'id' | 'createdAt'>) => Promise<any>;
    onDeleteTemplate: (id: string) => Promise<any>;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
    onAddShift, 
    loading, 
    language, 
    userId, 
    templates, 
    onSaveTemplate, 
    onDeleteTemplate 
}) => {
    const t = translations[language];
    const defaultEmployee = PREDEFINED_EMPLOYEES[0] || '';
    const initialFormState: NewShift = {
        employeeName: defaultEmployee,
        type: 'Shift',
        shiftDate: '',
        shiftTimeKey: PREDEFINED_SHIFTS[0].key,
        role: getRoleByEmployee(defaultEmployee),
    };

    const [newShift, setNewShift] = useState<NewShift>(initialFormState);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

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
                    newState.role = t.dayOff; 
                } else if (newType === 'PaidLeave') {
                    newState.role = t.paidLeave;
                } else if (newType === 'Recup') {
                    newState.role = t.recup;
                } else if (newType === 'OnCall') {
                    newState.role = t.onCall;
                }
            }
            
            return newState;
        });
    }, [t]);

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            alert(t.enterTemplateName);
            return;
        }

        setIsSavingTemplate(true);
        const templateData: Omit<ShiftTemplate, 'id' | 'createdAt'> = {
            name: templateName,
            type: newShift.type,
            role: newShift.role,
            userId: userId
        };

        if (newShift.type === 'Shift') {
            const selected = PREDEFINED_SHIFTS.find(s => s.key === newShift.shiftTimeKey);
            if (selected) {
                templateData.shiftTimeKey = newShift.shiftTimeKey;
                templateData.shiftStart = selected.start;
                templateData.shiftEnd = selected.end;
            }
        }

        try {
            const success = await onSaveTemplate(templateData);
            if (success) {
                setTemplateName('');
                setShowSaveSuccess(true);
                setTimeout(() => setShowSaveSuccess(false), 3000);
            }
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent template selection when clicking delete
        await onDeleteTemplate(id);
    };

    const handleApplyTemplate = (tpl: ShiftTemplate) => {
        setNewShift(prev => {
            const newState = { ...prev };
            newState.type = tpl.type;
            newState.role = tpl.role;
            if (tpl.type === 'Shift' && tpl.shiftTimeKey) {
                newState.shiftTimeKey = tpl.shiftTimeKey;
            }
            return newState;
        });
        setIsTemplatesOpen(false);
    };

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
        <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700 relative overflow-hidden">
                {/* Template Success Bar */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-green-500 transition-transform duration-500 ${showSaveSuccess ? 'translate-y-0' : '-translate-y-full'}`}></div>
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-100 flex items-center">
                        <Plus className="w-6 h-6 mr-3 text-cyan-400" />
                        {t.addEntry}
                    </h2>
                    
                    <button 
                        type="button"
                        onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${isTemplatesOpen ? 'bg-cyan-500 text-gray-900 border border-cyan-400' : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                    >
                        <Bookmark className="w-4 h-4 mr-2" />
                        {t.templates}
                        {isTemplatesOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                    </button>
                </div>

                {/* Templates Panel */}
                {isTemplatesOpen && (
                    <div className="mb-8 p-6 bg-gray-900/60 rounded-xl border border-gray-700 animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-cyan-500/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center">
                                    <Save className="w-3.5 h-3.5 mr-2" />
                                    {t.saveAsTemplate}
                                </h3>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder={t.templateName}
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm shadow-inner transition-all focus:border-cyan-500"
                                    />
                                    <button 
                                        onClick={handleSaveTemplate}
                                        disabled={isSavingTemplate}
                                        className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-900 rounded-lg font-bold text-sm transition shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50"
                                        title={t.saveAsTemplate}
                                    >
                                        {isSavingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </button>
                                </div>
                                {showSaveSuccess && <p className="text-xs text-green-400 flex items-center animate-pulse"><Check className="w-3 h-3 mr-1"/> {t.templateSaved}</p>}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                    <Bookmark className="w-3.5 h-3.5 mr-2" />
                                    {t.applyTemplate}
                                </h3>
                                <div className="max-h-56 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {templates.length === 0 ? (
                                        <div className="text-center py-6 border border-dashed border-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 italic">{t.noTemplates}</p>
                                        </div>
                                    ) : (
                                        templates.map(tpl => (
                                            <div 
                                                key={tpl.id} 
                                                className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg group hover:border-cyan-500/50 transition cursor-pointer hover:bg-gray-700/50"
                                                onClick={() => handleApplyTemplate(tpl)}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{tpl.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight mt-0.5">
                                                        {tpl.type === 'Shift' ? tpl.shiftTimeKey : tpl.type} • {tpl.role}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={(e) => handleDelete(e, tpl.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition ml-2 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                    title={t.deleteTemplate}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative md:col-span-2">
                            <label htmlFor="employeeName" className="block text-sm font-medium text-gray-300 mb-1">{t.employee} *</label>
                            <div className="relative">
                                <select id="employeeName" name="employeeName" value={newShift.employeeName} onChange={handleInputChange} required className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white shadow-inner appearance-none transition-all">
                                    {PREDEFINED_EMPLOYEES.map(name => <option key={name} value={name}>{name}</option>)}
                                </select>
                                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        
                        <div className="relative">
                            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">{t.type} *</label>
                            <div className="relative">
                                <select id="type" name="type" value={newShift.type} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white shadow-inner appearance-none transition-all">
                                    <option value="Shift">{t.workShift}</option>
                                    <option value="OnCall">{t.onCall}</option>
                                    <option value="DayOff">{t.dayOff}</option>
                                    <option value="PaidLeave">{t.paidLeave}</option>
                                    <option value="Recup">{t.recup}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                { newShift.type === 'Shift' ? <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" /> : newShift.type === 'OnCall' ? <PhoneCall className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" /> : newShift.type === 'DayOff' ? <Sun className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" /> : <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" /> }
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <label htmlFor="shiftDate" className="block text-sm font-medium text-gray-300 mb-1">{t.date} *</label>
                            <div className="relative">
                                <input type="date" id="shiftDate" name="shiftDate" value={newShift.shiftDate} onChange={handleInputChange} required className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white shadow-inner transition-all" />
                                <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="relative md:col-span-2" style={{ display: newShift.type === 'Shift' ? 'block' : 'none' }}>
                            <label htmlFor="shiftTimeKey" className="block text-sm font-medium text-gray-300 mb-1">{t.shiftTime} *</label>
                            <div className="relative">
                                <select id="shiftTimeKey" name="shiftTimeKey" value={newShift.shiftTimeKey} onChange={handleInputChange} required={newShift.type === 'Shift'} disabled={newShift.type !== 'Shift'} className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white shadow-inner appearance-none disabled:bg-gray-800 disabled:opacity-50 transition-all">
                                    {PREDEFINED_SHIFTS.map(shift => <option key={shift.key} value={shift.key}>{shift.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        
                        <div className="relative">
                            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">{t.role}</label>
                            <div className="relative">
                                <input type="text" id="role" name="role" value={newShift.role} readOnly className="w-full pl-10 pr-4 py-2.5 bg-gray-700/60 border border-gray-600 rounded-lg text-gray-400 shadow-inner cursor-default font-medium" />
                                <Tag className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-xl shadow-xl text-gray-900 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 ring-offset-2 ring-offset-gray-900 transition-all duration-200 transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Plus className="w-6 h-6 mr-2" />}
                        {t.addEntry}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ScheduleForm;
