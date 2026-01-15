
import React from 'react';
import { X, Mail, Clock, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { translations, type Language } from '../translations';

interface NotificationLog {
    id: string;
    type: 'add' | 'edit' | 'delete';
    message: string;
    emailDraft: { subject: string; body: string };
    timestamp: Date;
}

interface NotificationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: NotificationLog[];
    language: Language;
}

const NotificationSidebar: React.FC<NotificationSidebarProps> = ({ isOpen, onClose, notifications, language }) => {
    const t = translations[language];
    return (
        <div 
            className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-gray-900 border-l border-gray-800 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-cyan-400" />
                        {t.recentActivity}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>{t.noRecentActivity}</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/60 transition group">
                                <div className="flex items-start gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${
                                        notif.type === 'add' ? 'bg-green-500/10 text-green-400' :
                                        notif.type === 'edit' ? 'bg-yellow-500/10 text-yellow-400' :
                                        'bg-red-500/10 text-red-400'
                                    }`}>
                                        {notif.type === 'add' ? <CheckCircle className="w-4 h-4" /> :
                                         notif.type === 'edit' ? <Clock className="w-4 h-4" /> :
                                         <AlertTriangle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{notif.emailDraft.subject}</p>
                                        <p className="text-xs text-gray-500 flex items-center mt-1">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-gray-700 pl-3">
                                    "{notif.emailDraft.body}"
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-800 text-center">
                    <p className="text-xs text-gray-500 italic">
                        {t.autoSentInfo}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationSidebar;
