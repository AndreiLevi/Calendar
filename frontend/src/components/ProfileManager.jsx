import { useState } from 'react';
import LocationInput from './LocationInput';
import { profileAPI } from '../api';
import { translations } from '../utils/translations';

/**
 * ProfileManager Component
 * Manages user birth profiles - create, edit, switch, delete
 * Supports multiple profiles per Google account
 */
export default function ProfileManager({ user, activeProfile, onProfileChange, language = 'ru' }) {
    const [profiles, setProfiles] = useState([]);
    const [showEditor, setShowEditor] = useState(false);
    const [editMode, setEditMode] = useState(null); // null, 'create', or profileId
    const [formData, setFormData] = useState({
        profile_name: '',
        birth_date: '',
        birth_time: '',
        birth_place: '',
        birth_lat: null,
        birth_lng: null
    });

    const t = translations[language];

    // Load user profiles
    const loadProfiles = async () => {
        if (!user) return;
        try {
            const result = await profileAPI.getProfiles(user.id);
            setProfiles(result.profiles || []);
        } catch (error) {
            console.error('Failed to load profiles:', error);
        }
    };

    // Create new profile
    const handleCreate = async () => {
        if (!user || !formData.birth_date) return;
        try {
            await profileAPI.createProfile(user.id, formData);
            await loadProfiles();
            const activeResult = await profileAPI.getActiveProfile(user.id);
            onProfileChange(activeResult.profile);
            setShowEditor(false);
            resetForm();
        } catch (error) {
            console.error('Failed to create profile:', error);
        }
    };

    // Update existing profile
    const handleUpdate = async () => {
        if (!user || !editMode || editMode === 'create') return;
        try {
            await profileAPI.updateProfile(user.id, editMode, formData);
            await loadProfiles();
            const activeResult = await profileAPI.getActiveProfile(user.id);
            onProfileChange(activeResult.profile);
            setShowEditor(false);
            resetForm();
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    // Switch profile
    const handleSwitch = async (profileId) => {
        if (!user) return;
        try {
            const result = await profileAPI.switchProfile(user.id, profileId);
            onProfileChange(result.profile);
            await loadProfiles();
        } catch (error) {
            console.error('Failed to switch profile:', error);
        }
    };

    // Delete profile
    const handleDelete = async (profileId) => {
        if (!user || !confirm(t.confirmDelete || 'Delete this profile?')) return;
        try {
            await profileAPI.deleteProfile(user.id, profileId);
            await loadProfiles();
            const activeResult = await profileAPI.getActiveProfile(user.id);
            onProfileChange(activeResult.profile);
        } catch (error) {
            console.error('Failed to delete profile:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            profile_name: '',
            birth_date: '',
            birth_time: '',
            birth_place: '',
            birth_lat: null,
            birth_lng: null
        });
        setEditMode(null);
    };

    const openCreateMode = () => {
        resetForm();
        setEditMode('create');
        setShowEditor(true);
    };

    const openEditMode = (profile) => {
        setFormData({
            profile_name: profile.profile_name,
            birth_date: profile.birth_date,
            birth_time: profile.birth_time || '',
            birth_place: profile.birth_place || '',
            birth_lat: profile.birth_lat,
            birth_lng: profile.birth_lng
        });
        setEditMode(profile.id);
        setShowEditor(true);
    };

    return (
        <div style={{
            position: 'relative',
            display: 'inline-block'
        }}>
            {/* Profile Button */}
            <button
                onClick={() => { loadProfiles(); setShowEditor(!showEditor); }}
                style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    transition: 'all 0.2s'
                }}
                title="Manage Profiles"
            >
                👤
            </button>

            {/* Profile Editor Modal */}
            {showEditor && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setShowEditor(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(20, 20, 40, 0.95)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                    >
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#fbbf24' }}>
                            {editMode === 'create' ? (t.createProfile || 'New Profile') : (t.editProfile || 'Edit Profile')}
                        </h2>

                        {/* Form */}
                        {editMode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder={t.profileName || 'Profile Name'}
                                    value={formData.profile_name}
                                    onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white'
                                    }}
                                />

                                <input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        colorScheme: 'dark'
                                    }}
                                />

                                <input
                                    type="time"
                                    value={formData.birth_time}
                                    onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                                    placeholder={t.birthTime || 'Birth Time'}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        colorScheme: 'dark'
                                    }}
                                />

                                <LocationInput
                                    value={formData.birth_place}
                                    onChange={(location) => setFormData({
                                        ...formData,
                                        birth_place: location.place,
                                        birth_lat: location.lat,
                                        birth_lng: location.lng
                                    })}
                                    language={language}
                                />

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button
                                        onClick={editMode === 'create' ? handleCreate : handleUpdate}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {editMode === 'create' ? (t.create || 'Create') : (t.update || 'Update')}
                                    </button>
                                    <button
                                        onClick={() => { setShowEditor(false); resetForm(); }}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '8px',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {t.cancel || 'Cancel'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Profile List */
                            <div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {profiles.map((profile) => (
                                        <div
                                            key={profile.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.75rem',
                                                background: profile.is_active ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${profile.is_active ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{profile.profile_name}</div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                                    {profile.birth_date} {profile.birth_time && `• ${profile.birth_time}`}
                                                </div>
                                                {profile.birth_place && (
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{profile.birth_place}</div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {!profile.is_active && (
                                                    <button
                                                        onClick={() => handleSwitch(profile.id)}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            background: 'rgba(251, 191, 36, 0.2)',
                                                            border: '1px solid rgba(251, 191, 36, 0.4)',
                                                            borderRadius: '4px',
                                                            color: '#fbbf24',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {t.activate || 'Activate'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openEditMode(profile)}
                                                    style={{
                                                        padding: '0.25rem 0.75rem',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(profile.id)}
                                                    style={{
                                                        padding: '0.25rem 0.75rem',
                                                        background: 'rgba(255, 59, 48, 0.2)',
                                                        border: '1px solid rgba(255, 59, 48, 0.4)',
                                                        borderRadius: '4px',
                                                        color: '#ff3b30',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={openCreateMode}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    + {t.newProfile || 'New Profile'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
