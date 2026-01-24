import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cosmicAPI } from '../api';
import './TimePage.css';

export default function TimePage() {
    const { language, user } = useOutletContext();
    const [hora, setHora] = useState(null);
    const [muhurtas, setMuhurtas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coords, setCoords] = useState({ lat: 55.75, lng: 37.62 }); // Default: Moscow

    useEffect(() => {
        // Try to get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    console.log('Using default location');
                }
            );
        }
    }, []);

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
            setHora(horaData);
            setMuhurtas(muhurtasData);
        } catch (err) {
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

    const currentHora = hora?.hora;
    const muhurtaData = muhurtas?.data;

    return (
        <div className="time-page">
            <header className="page-header">
                <h1>⏰ {language === 'ru' ? 'Планетарное Время' : 'Planetary Time'}</h1>
                <p className="page-subtitle">
                    {language === 'ru'
                        ? 'Hora, Kala и благоприятные периоды'
                        : 'Hora, Kala and auspicious periods'}
                </p>
            </header>

            <div className="time-grid">
                {/* Current Hora */}
                <section className="time-card current-hora">
                    <h2>{language === 'ru' ? 'Текущий Hora' : 'Current Hora'}</h2>
                    {currentHora && (
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
                    )}
                </section>

                {/* Rahu Kala Warning */}
                <section className="time-card rahu-kala warning">
                    <h2>⚠️ Rahu Kala</h2>
                    {muhurtaData?.rahu_kala && (
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
                        </>
                    )}
                </section>

                {/* Brahma Muhurta */}
                <section className="time-card brahma-muhurta auspicious">
                    <h2>🌅 Brahma Muhurta</h2>
                    {muhurtaData?.brahma_muhurta && (
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
                    )}
                </section>

                {/* Today's Hora Schedule */}
                <section className="time-card hora-schedule full-width">
                    <h2>{language === 'ru' ? 'Расписание Hora на сегодня' : "Today's Hora Schedule"}</h2>
                    {muhurtaData?.hora_schedule && (
                        <div className="hora-timeline">
                            {muhurtaData.hora_schedule.slice(0, 12).map((h, idx) => (
                                <div
                                    key={idx}
                                    className={`hora-slot ${h.planet_en?.toLowerCase()}`}
                                    title={`${h.planet}: ${h.quality}`}
                                >
                                    <span className="slot-time">
                                        {new Date(h.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="slot-planet">{h.planet}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
