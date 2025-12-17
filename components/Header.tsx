
import React from 'react';

interface HeaderProps {
    userId: string | null;
    isAuthReady: boolean;
}

const Header: React.FC<HeaderProps> = ({ userId, isAuthReady }) => {
    return (
        <header className="text-center mb-10">
            <h1 className="text-5xl font-extrabold text-cyan-400 mb-2 tracking-tight">Employee Planning</h1>
            <p className="text-lg text-gray-400">Schedule shifts and manage time off with real-time collaboration</p>
            <p className="text-xs mt-3 text-gray-500 h-4">
                {isAuthReady ? `Session ID: ${userId}` : "Initializing Authentication..."}
            </p>
        </header>
    );
};

export default Header;
