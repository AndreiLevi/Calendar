import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ParticleBackground from './ParticleBackground';
import { supabase } from '../supabaseClient';
import './Layout.css';

export default function Layout() {
    const [user, setUser] = useState(null);
    const [language, setLanguage] = useState('ru');

    useEffect(() => {
        if (!supabase) return;

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <div className="app-layout">
            <ParticleBackground intensity={1} />
            <Sidebar language={language} />

            <main className="main-content">
                {/* Language Switcher */}
                <div className="top-bar">
                    <div className="language-switcher">
                        {['ru', 'en', 'he'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={`lang-btn ${language === lang ? 'active' : ''}`}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {user && (
                        <div className="user-info">
                            {user.user_metadata?.avatar_url && (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="Avatar"
                                    className="user-avatar"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Page Content - rendered by React Router */}
                <Outlet context={{ user, language, setLanguage }} />
            </main>
        </div>
    );
}
