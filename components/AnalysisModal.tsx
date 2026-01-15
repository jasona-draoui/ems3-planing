
import React from 'react';
import { X, Loader2, BrainCircuit } from 'lucide-react';
import { translations, type Language } from '../translations';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string | null;
    isLoading: boolean;
    language: Language;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, content, isLoading, language }) => {
    const t = translations[language];
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-purple-300 flex items-center">
                        <BrainCircuit className="w-5 h-5 mr-2" />
                        {t.aiAnalysisTitle}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center text-center text-gray-400 h-64">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-4" />
                            <p className="font-semibold">{t.aiAnalyzing}</p>
                            <p className="text-sm">{t.aiReviewing}</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:text-purple-300 prose-strong:text-white whitespace-pre-wrap font-sans">
                            {content}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysisModal;
