// import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide header on Onboarding page
    if (location.pathname === '/') return null;

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
            <button
                onClick={() => navigate('/')}
                className="flex items-center"
            >
                <img src="/hanmeot_logo.png" alt="Han-Meot" className="h-8 object-contain" />
            </button>

            {/* Optional: Add profile or other global actions here if needed */}
            <div className="w-8"></div>
        </header>
    );
}
