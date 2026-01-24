import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ParticleBackground from './ParticleBackground';
import { supabase } from '../supabaseClient';
import { profileAPI } from '../api';
import './Layout.css';

export default function Layout() {
    const [user, setUser] = useState(null);
    const [language, setLanguage] = useState('ru');

    // Shared profile state across all pages
    const [profile, setProfile] = useState({
        name: '',
        dob: '',
        birthTime: '',
        birthPlace: '',
        birthLat: null,
        birthLng: null
    });
    const [activeProfile, setActiveProfile] = useState(null);

    useEffect(() => {
        if (!supabase) return;

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (currentUser) {
                await loadActiveProfile(currentUser.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (currentUser) {
                await loadActiveProfile(currentUser.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load active profile from backend
    const loadActiveProfile = async (userId) => {
        try {
            const result = await profileAPI.getActiveProfile(userId);
            if (result.profile) {
                setActiveProfile(result.profile);
                setProfile({
                    name: result.profile.profile_name,
                    dob: result.profile.birth_date,
                    birthTime: result.profile.birth_time || '',
                    birthPlace: result.profile.birth_place || '',
                    birthLat: result.profile.birth_lat,
                    birthLng: result.profile.birth_lng
                });
            }
        } catch (error) {
            console.error('Failed to load active profile:', error);
        }
    };

    // Handle profile change (called from Dashboard)
    const handleProfileChange = (newProfile) => {
        setActiveProfile(newProfile);
        if (newProfile) {
            setProfile({
                name: newProfile.profile_name,
                dob: newProfile.birth_date,
                birthTime: newProfile.birth_time || '',
                birthPlace: newProfile.birth_place || '',
                birthLat: newProfile.birth_lat,
                birthLng: newProfile.birth_lng
            });
        }
    };

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
                <Outlet context={{
                    user,
                    language,
                    setLanguage,
                    profile,
                    setProfile,
                    activeProfile,
                    setActiveProfile,
                    handleProfileChange,
                    loadActiveProfile
                }} />
            </main>
        </div>
    );
}
