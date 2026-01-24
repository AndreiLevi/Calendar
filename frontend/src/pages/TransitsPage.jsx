import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { cosmicAPI } from '../api';
import './TransitsPage.css';

export default function TransitsPage() {
    const { language } = useOutletContext();
    const [transits, setTransits] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const t = translations[language] || translations.ru;

    useEffect(() => {
        loadTransits();
    }, [language]);

    const loadTransits = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await cosmicAPI.getTransits(language);
            setTransits(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="loading-spinner">🪐</div>
                <p>Loading planetary positions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-error">
                <p>Error: {error}</p>
                <button onClick={loadTransits}>Retry</button>
            </div>
        );
    }

    const planets = transits?.positions?.planets || {};
    const significantTransits = transits?.significant_transits || [];

    // Group planets by planning horizon
    const longTerm = ['saturn', 'jupiter', 'rahu', 'ketu'];
    const mediumTerm = ['mars', 'venus', 'mercury'];
    const shortTerm = ['sun', 'moon'];

    const getPlanetsByKeys = (keys) =>
        keys.map(key => ({ key, ...planets[key] })).filter(p => p.name);

    return (
        <div className="transits-page">
            <header className="page-header">
                <h1>🪐 {language === 'ru' ? 'Планетарные Транзиты' : 'Planetary Transits'}</h1>
                <p className="page-subtitle">
                    {language === 'ru'
                        ? 'Анализ для планирования проектов'
                        : 'Analysis for project planning'}
                </p>
            </header>

            {/* Significant Events Banner */}
            {significantTransits.length > 0 && (
                <div className="significant-banner">
                    <h3>⚡ {language === 'ru' ? 'Значимые события' : 'Significant Events'}</h3>
                    {significantTransits.map((event, idx) => (
                        <div key={idx} className="event-badge">
                            <span className="event-type">{event.type}</span>
                            <span className="event-desc">{event.description}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="transits-grid">
                {/* Long-term Planning (Saturn, Jupiter, Rahu, Ketu) */}
                <section className="transit-section long-term">
                    <h2>
                        📅 {language === 'ru' ? 'Долгосрочное (1-2.5 года)' : 'Long-term (1-2.5 years)'}
                    </h2>
                    <div className="planets-list">
                        {getPlanetsByKeys(longTerm).map(planet => (
                            <PlanetCard key={planet.key} planet={planet} language={language} />
                        ))}
                    </div>
                </section>

                {/* Medium-term Planning (Mars, Venus, Mercury) */}
                <section className="transit-section medium-term">
                    <h2>
                        📆 {language === 'ru' ? 'Среднесрочное (1-2 месяца)' : 'Medium-term (1-2 months)'}
                    </h2>
                    <div className="planets-list">
                        {getPlanetsByKeys(mediumTerm).map(planet => (
                            <PlanetCard key={planet.key} planet={planet} language={language} />
                        ))}
                    </div>
                </section>

                {/* Short-term / Daily (Sun, Moon) */}
                <section className="transit-section short-term">
                    <h2>
                        📋 {language === 'ru' ? 'Краткосрочное (день)' : 'Short-term (daily)'}
                    </h2>
                    <div className="planets-list">
                        {getPlanetsByKeys(shortTerm).map(planet => (
                            <PlanetCard key={planet.key} planet={planet} language={language} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function PlanetCard({ planet, language }) {
    return (
        <div className={`planet-card ${planet.is_retrograde ? 'retrograde' : ''}`}>
            <div className="planet-header">
                <span className="planet-name">{planet.name}</span>
                {planet.is_retrograde && <span className="retro-badge">℞</span>}
            </div>
            <div className="planet-position">
                <span className="rashi">{planet.rashi}</span>
                <span className="degree">{planet.rashi_degree?.toFixed(1)}°</span>
            </div>
            <div className="planet-nakshatra">
                {planet.nakshatra} (Pada {planet.nakshatra_pada})
            </div>
        </div>
    );
}
