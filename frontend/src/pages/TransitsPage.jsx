import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { cosmicAPI, fetchDailyAnalysis } from '../api';
import './TransitsPage.css';

export default function TransitsPage() {
    const { language, profile } = useOutletContext();
    const [transits, setTransits] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // AI Advisor state
    const [aiAdvice, setAiAdvice] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);

    const t = translations[language] || translations.ru;

    useEffect(() => {
        loadTransits();
    }, [language]);

    useEffect(() => {
        // Load AI advice when transits and profile are available
        if (transits && profile?.dob) {
            loadAiAdvice();
        }
    }, [transits, profile?.dob, language]);

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

    const loadAiAdvice = async () => {
        if (!profile?.dob) return;

        setLoadingAi(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const analysis = await fetchDailyAnalysis(
                profile.dob,
                today,
                profile.name || 'User',
                language,
                profile.birthTime,
                profile.birthLat,
                profile.birthLng
            );
            if (analysis?.strategy) {
                setAiAdvice(analysis.strategy);
            }
        } catch (err) {
            console.error('Failed to load AI advice:', err);
        } finally {
            setLoadingAi(false);
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="loading-spinner">🪐</div>
                <p>{language === 'ru' ? 'Загрузка позиций планет...' : 'Loading planetary positions...'}</p>
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

    // Generate planning insights based on transits
    const getPlanningInsights = () => {
        const insights = [];

        // Saturn analysis (long-term)
        const saturn = planets.saturn;
        if (saturn) {
            insights.push({
                type: 'long',
                planet: saturn.name,
                sign: saturn.rashi,
                message: language === 'ru'
                    ? `Сатурн в ${saturn.rashi} — время для дисциплины и структурирования долгосрочных проектов.`
                    : `Saturn in ${saturn.rashi} — time for discipline and structuring long-term projects.`
            });
        }

        // Jupiter analysis
        const jupiter = planets.jupiter;
        if (jupiter) {
            insights.push({
                type: 'medium',
                planet: jupiter.name,
                sign: jupiter.rashi,
                message: language === 'ru'
                    ? `Юпитер в ${jupiter.rashi} благоприятствует расширению и обучению.`
                    : `Jupiter in ${jupiter.rashi} favors expansion and learning.`
            });
        }

        // Mars analysis (energy for action)
        const mars = planets.mars;
        if (mars) {
            const marsEnergy = language === 'ru'
                ? `Марс в ${mars.rashi} даёт энергию для активных действий в сфере ${getSignSphere(mars.rashi, language)}.`
                : `Mars in ${mars.rashi} gives energy for action in ${getSignSphere(mars.rashi, language)}.`;
            insights.push({ type: 'medium', planet: mars.name, sign: mars.rashi, message: marsEnergy });
        }

        return insights;
    };

    const insights = getPlanningInsights();

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

            {/* AI Advisor Section */}
            <section className="ai-advisor">
                <h2>🔮 {language === 'ru' ? 'AI Оракул' : 'AI Oracle'}</h2>
                {!profile?.dob ? (
                    <p className="advisor-hint">
                        {language === 'ru'
                            ? 'Введите дату рождения на главной странице для персональных рекомендаций'
                            : 'Enter your birth date on Dashboard for personalized recommendations'}
                    </p>
                ) : loadingAi ? (
                    <div className="advisor-loading">
                        <span className="loading-dots">●●●</span>
                        {language === 'ru' ? 'Анализирую транзиты...' : 'Analyzing transits...'}
                    </div>
                ) : aiAdvice ? (
                    <div className="advisor-content">
                        <div className="advisor-text" dangerouslySetInnerHTML={{ __html: aiAdvice.replace(/\n/g, '<br/>') }} />
                    </div>
                ) : (
                    <p className="advisor-hint">
                        {language === 'ru' ? 'Нажмите для получения совета' : 'Click for advice'}
                    </p>
                )}
            </section>

            {/* Planning Insights */}
            {insights.length > 0 && (
                <section className="planning-insights">
                    <h3>{language === 'ru' ? '📊 Инсайты для планирования' : '📊 Planning Insights'}</h3>
                    <div className="insights-grid">
                        {insights.map((insight, idx) => (
                            <div key={idx} className={`insight-card ${insight.type}`}>
                                <span className="insight-planet">{insight.planet} → {insight.sign}</span>
                                <p className="insight-message">{insight.message}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

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

// Helper: Map zodiac sign to life sphere
function getSignSphere(sign, language) {
    const spheres = {
        'Овен': { ru: 'личной инициативы', en: 'personal initiative' },
        'Aries': { ru: 'личной инициативы', en: 'personal initiative' },
        'Телец': { ru: 'финансов и ресурсов', en: 'finances and resources' },
        'Taurus': { ru: 'финансов и ресурсов', en: 'finances and resources' },
        'Близнецы': { ru: 'коммуникации', en: 'communication' },
        'Gemini': { ru: 'коммуникации', en: 'communication' },
        'Рак': { ru: 'семьи и дома', en: 'family and home' },
        'Cancer': { ru: 'семьи и дома', en: 'family and home' },
        'Лев': { ru: 'творчества', en: 'creativity' },
        'Leo': { ru: 'творчества', en: 'creativity' },
        'Дева': { ru: 'здоровья и работы', en: 'health and work' },
        'Virgo': { ru: 'здоровья и работы', en: 'health and work' },
        'Весы': { ru: 'партнёрства', en: 'partnerships' },
        'Libra': { ru: 'партнёрства', en: 'partnerships' },
        'Скорпион': { ru: 'трансформации', en: 'transformation' },
        'Scorpio': { ru: 'трансформации', en: 'transformation' },
        'Стрелец': { ru: 'обучения и путешествий', en: 'learning and travel' },
        'Sagittarius': { ru: 'обучения и путешествий', en: 'learning and travel' },
        'Козерог': { ru: 'карьеры', en: 'career' },
        'Capricorn': { ru: 'карьеры', en: 'career' },
        'Водолей': { ru: 'социальных связей', en: 'social connections' },
        'Aquarius': { ru: 'социальных связей', en: 'social connections' },
        'Рыбы': { ru: 'духовности', en: 'spirituality' },
        'Pisces': { ru: 'духовности', en: 'spirituality' },
    };

    const sphere = spheres[sign];
    if (!sphere) return sign;
    return language === 'ru' ? sphere.ru : sphere.en;
}
