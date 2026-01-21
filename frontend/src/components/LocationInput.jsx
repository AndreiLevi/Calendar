import { useState, useEffect } from 'react';

/**
 * LocationInput Component
 * Allows user to search for birth location using Nominatim (OpenStreetMap) geocoding
 * Returns location with coordinates for astrological calculations
 */
export default function LocationInput({ value, onChange, language = 'ru' }) {
    const [searchQuery, setSearchQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const t = {
        ru: {
            placeholder: 'Город рождения (например, Москва)',
            searching: 'Поиск...',
            noResults: 'Ничего не найдено'
        },
        en: {
            placeholder: 'Birth place (e.g., Moscow)',
            searching: 'Searching...',
            noResults: 'No results found'
        },
        he: {
            placeholder: 'מקום לידה (למשל, מוסקבה)',
            searching: 'מחפש...',
            noResults: 'לא נמצאו תוצאות'
        }
    }[language];

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(searchQuery)}&` +
                    `format=json&` +
                    `addressdetails=1&` +
                    `limit=5&` +
                    `accept-language=${language}`
                );
                const data = await response.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Geocoding error:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, language]);

    const handleSelect = (location) => {
        const displayName = location.display_name;
        setSearchQuery(displayName);
        setShowSuggestions(false);

        // Call parent onChange with full location data
        onChange({
            place: displayName,
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lon)
        });
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={t.placeholder}
                className="glass-input"
                style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                }}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'rgba(20, 20, 30, 0.98)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    {suggestions.map((location, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(location)}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {location.address?.city || location.address?.town || location.address?.village || location.display_name.split(',')[0]}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                                {location.display_name}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isLoading && (
                <div style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.8rem',
                    opacity: 0.6
                }}>
                    {t.searching}
                </div>
            )}
        </div>
    );
}
