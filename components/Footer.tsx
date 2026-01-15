
import React from 'react';
import { translations, type Language } from '../translations';

interface FooterProps {
    language: Language;
}

const Footer: React.FC<FooterProps> = ({ language }) => {
    const t = translations[language];
    return (
        <footer className="max-w-4xl mx-auto text-center pt-8 mt-10 border-t border-gray-700">
            <p className="text-sm text-gray-500">{t.footerInfo}</p>
        </footer>
    );
};

export default Footer;
