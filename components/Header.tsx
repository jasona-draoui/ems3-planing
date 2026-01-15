
import React, { useState } from 'react';
import { Bell, Settings, Monitor, Clock, History, Languages } from 'lucide-react';
import { translations, type Language } from '../translations';

interface HeaderProps {
    userId: string | null;
    isAuthReady: boolean;
    onToggleNotifications: () => void;
    notificationCount: number;
    viewPreference: 'current' | 'previous' | 'sticky';
    onViewPreferenceChange: (pref: 'current' | 'previous' | 'sticky') => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    userId, 
    isAuthReady, 
    onToggleNotifications, 
    notificationCount,
    viewPreference,
    onViewPreferenceChange,
    language,
    onLanguageChange
}) => {
    const [isPrefOpen, setIsPrefOpen] = useState(false);
    const t = translations[language];

    return (
        <header className="relative flex flex-col items-center mb-10">
            <div className="absolute top-0 left-0">
                 {/* Language Switcher */}
                 <div className="flex items-center bg-gray-800 border border-gray-700 rounded-full p-1 shadow-lg">
                    <button 
                        onClick={() => onLanguageChange('en')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${language === 'en' ? 'bg-cyan-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
                    >
                        EN
                    </button>
                    <button 
                        onClick={() => onLanguageChange('fr')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${language === 'fr' ? 'bg-cyan-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
                    >
                        FR
                    </button>
                </div>
            </div>

            <div className="absolute top-0 right-0 flex items-center space-x-3">
                {/* View Preferences Toggle */}
                <div className="relative">
                    <button 
                        onClick={() => setIsPrefOpen(!isPrefOpen)}
                        className="p-3 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 transition shadow-lg text-gray-400 hover:text-cyan-400"
                        title={t.startupView}
                    >
                        <Settings className="w-6 h-6" />
                    </button>

                    {isPrefOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-[70] overflow-hidden p-2">
                            <p className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.startupView}</p>
                            <button 
                                onClick={() => { onViewPreferenceChange('current'); setIsPrefOpen(false); }}
                                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition ${viewPreference === 'current' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                                <Monitor className="w-4 h-4 mr-2" />
                                {t.alwaysCurrent}
                            </button>
                            <button 
                                onClick={() => { onViewPreferenceChange('previous'); setIsPrefOpen(false); }}
                                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition ${viewPreference === 'previous' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                                <History className="w-4 h-4 mr-2" />
                                {t.alwaysLast}
                            </button>
                            <button 
                                onClick={() => { onViewPreferenceChange('sticky'); setIsPrefOpen(false); }}
                                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition ${viewPreference === 'sticky' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                {t.resumeLast}
                            </button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={onToggleNotifications}
                    className="relative p-3 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 transition shadow-lg group"
                >
                    <Bell className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition" />
                    {notificationCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </button>
            </div>
            
            <h1 className="text-5xl font-extrabold text-cyan-400 mb-2 tracking-tight text-center">{t.title}</h1>
            <p className="text-lg text-gray-400 text-center">{t.subtitle}</p>
            <p className="text-xs mt-3 text-gray-500 h-4 text-center">
                {isAuthReady ? `${t.session}: ${userId}` : t.initializing}
            </p>
        </header>
    );
};

export default Header;
