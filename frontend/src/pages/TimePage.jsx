import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cosmicAPI } from '../api';
import './TimePage.css';

export default function TimePage() {
    const { language, profile } = useOutletContext();
    const [hora, setHora] = useState(null);
    const [muhurtas, setMuhurtas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Use profile coordinates if available, otherwise default to Moscow
    const [coords, setCoords] = useState({
        lat: profile?.birthLat || 55.75,
        lng: profile?.birthLng || 37.62
    });

    useEffect(() => {
        // Use profile location if available
        if (profile?.birthLat && profile?.birthLng) {
            setCoords({ lat: profile.birthLat, lng: profile.birthLng });
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    console.log('Using default location');
                }
            );
        }
    }, [profile]);

    useEffect(() => {
        loadTimeData();
    }, [language, coords]);

    const loadTimeData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [horaData, muhurtasData] = await Promise.all([
                cosmicAPI.getHora(coords.lat, coords.lng, language),
                cosmicAPI.getMuhurtas(coords.lat, coords.lng, language)
            ]);
            console.log('Hora data:', horaData);
            console.log('Muhurtas data:', muhurtasData);
            setHora(horaData);
            setMuhurtas(muhurtasData);
        } catch (err) {
            console.error('Time data error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="loading-spinner">⏰</div>
                <p>{language === 'ru' ? 'Загрузка временных данных...' : 'Loading time data...'}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-error">
                <p>Error: {error}</p>
                <button onClick={loadTimeData}>Retry</button>
            </div>
        );
    }

    // API returns: { success: true, hora: {...} } for /api/hora
    // API returns: { success: true, data: {...} } for /api/muhurtas
    const currentHora = hora?.hora;
    const muhurtaData = muhurtas?.data;

    // Generate all 12 day Horas from sun_times
    const generateDayHoras = () => {
        if (!muhurtaData?.sun_times) return [];

        const sunriseTime = new Date(muhurtaData.sun_times.sunrise);
        const sunsetTime = new Date(muhurtaData.sun_times.sunset);
        const dayDuration = (sunsetTime - sunriseTime) / 12;

        // Get weekday to determine starting planet
        const weekday = sunriseTime.getDay(); // 0 = Sunday
        const dayRulers = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
        const horaPlanets = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
        const horaPlanetsRu = ['Солнце', 'Венера', 'Меркурий', 'Луна', 'Сатурн', 'Юпитер', 'Марс'];

        const startPlanet = dayRulers[weekday];
        const startIndex = horaPlanets.indexOf(startPlanet);

        const horas = [];
        for (let i = 0; i < 12; i++) {
            const start = new Date(sunriseTime.getTime() + i * dayDuration);
            const end = new Date(sunriseTime.getTime() + (i + 1) * dayDuration);
            const planetIndex = (startIndex + i) % 7;

            horas.push({
                start: start.toISOString(),
                end: end.toISOString(),
                planet: language === 'ru' ? horaPlanetsRu[planetIndex] : horaPlanets[planetIndex],
                planet_en: horaPlanets[planetIndex],
                hora_number: i + 1
            });
        }
        return horas;
    };

    const dayHoras = generateDayHoras();

    return (
        <div className="time-page">
            <header className="page-header">
                <h1>⏰ {language === 'ru' ? 'Планетарное Время' : 'Planetary Time'}</h1>
                <p className="page-subtitle">
                    {language === 'ru'
                        ? 'Hora, Kala и благоприятные периоды'
                        : 'Hora, Kala and auspicious periods'}
                </p>
                {profile?.birthPlace && (
                    <p className="location-info">📍 {profile.birthPlace}</p>
                )}
            </header>

            <div className="time-grid">
                {/* Current Hora */}
                <section className="time-card current-hora">
                    <h2>{language === 'ru' ? 'Текущий Hora' : 'Current Hora'}</h2>
                    {currentHora ? (
                        <>
                            <div className="hora-planet">
                                <span className="hora-planet-name">{currentHora.planet}</span>
                                <span className="hora-number">#{currentHora.hora_number}</span>
                            </div>
                            <div className="hora-time">
                                {new Date(currentHora.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' — '}
                                {new Date(currentHora.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="hora-quality">{currentHora.quality}</div>
                            <div className="hora-daynight">
                                {currentHora.is_day ? '☀️ День' : '🌙 Ночь'}
                            </div>
                        </>
                    ) : (
                        <p className="no-data">{language === 'ru' ? 'Нет данных' : 'No data'}</p>
                    )}
                </section>

                {/* Rahu Kala Warning */}
                <section className="time-card rahu-kala warning">
                    <h2>⚠️ Rahu Kala</h2>
                    {muhurtaData?.rahu_kala ? (
                        <>
                            <div className="kala-time">
                                {new Date(muhurtaData.rahu_kala.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' — '}
                                {new Date(muhurtaData.rahu_kala.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="kala-advice">
                                {language === 'ru'
                                    ? 'Избегайте важных начинаний'
                                    : 'Avoid important new beginnings'}
                            </div>
                            {muhurtaData.rahu_kala.is_active && (
                                <div className="kala-active-badge">
                                    {language === 'ru' ? 'СЕЙЧАС АКТИВЕН' : 'ACTIVE NOW'}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="no-data">{language === 'ru' ? 'Нет данных' : 'No data'}</p>
                    )}
                </section>

                {/* Brahma Muhurta */}
                <section className="time-card brahma-muhurta auspicious">
                    <h2>🌅 Brahma Muhurta</h2>
                    {muhurtaData?.brahma_muhurta ? (
                        <>
                            <div className="muhurta-time">
                                {new Date(muhurtaData.brahma_muhurta.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' — '}
                                {new Date(muhurtaData.brahma_muhurta.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="muhurta-advice">
                                {language === 'ru'
                                    ? 'Идеально для медитации и духовных практик'
                                    : 'Ideal for meditation and spiritual practices'}
                            </div>
                        </>
                    ) : (
                        <p className="no-data">{language === 'ru' ? 'Нет данных' : 'No data'}</p>
                    )}
                </section>

                {/* Abhijit Muhurta */}
                <section className="time-card abhijit-muhurta auspicious">
                    <h2>✨ Abhijit Muhurta</h2>
                    {muhurtaData?.abhijit_muhurta ? (
                        <>
                            <div className="muhurta-time">
                                {new Date(muhurtaData.abhijit_muhurta.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' — '}
                                {new Date(muhurtaData.abhijit_muhurta.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="muhurta-advice">
                                {muhurtaData.abhijit_muhurta.quality}
                            </div>
                        </>
                    ) : (
                        <p className="no-data">{language === 'ru' ? 'Нет данных' : 'No data'}</p>
                    )}
                </section>

                {/* Sun Times */}
                <section className="time-card sun-times">
                    <h2>🌅 {language === 'ru' ? 'Солнце' : 'Sun Times'}</h2>
                    {muhurtaData?.sun_times ? (
                        <div className="sun-times-grid">
                            <div className="sun-item">
                                <span className="sun-label">☀️ {language === 'ru' ? 'Восход' : 'Sunrise'}</span>
                                <span className="sun-time">
                                    {new Date(muhurtaData.sun_times.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="sun-item">
                                <span className="sun-label">🌙 {language === 'ru' ? 'Закат' : 'Sunset'}</span>
                                <span className="sun-time">
                                    {new Date(muhurtaData.sun_times.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="sun-item">
                                <span className="sun-label">{language === 'ru' ? 'Длина дня' : 'Day length'}</span>
                                <span className="sun-time">
                                    {muhurtaData.sun_times.day_duration_hours?.toFixed(1)}h
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="no-data">{language === 'ru' ? 'Нет данных' : 'No data'}</p>
                    )}
                </section>

                {/* Today's Hora Schedule */}
                <section className="time-card hora-schedule full-width">
                    <h2>{language === 'ru' ? 'Расписание Hora (дневные)' : "Today's Day Horas"}</h2>
                    {dayHoras.length > 0 ? (
                        <div className="hora-timeline">
                            {dayHoras.map((h, idx) => (
                                <div
                                    key={idx}
                                    className={`hora-slot ${h.planet_en?.toLowerCase()}`}
                                    title={h.planet}
                                >
                                    <span className="slot-time">
                                        {new Date(h.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="slot-planet">{h.planet}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">{language === 'ru' ? 'Нет данных для расписания' : 'No schedule data'}</p>
                    )}
                </section>
            </div>
        </div>
    );
}
