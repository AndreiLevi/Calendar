import React, { useMemo, useState, useEffect } from 'react';
import { ForecastingEngine } from '../utils/forecastingEngine';
import { translations } from '../utils/translations';

const StrategicAdvisor = ({ dob, language = 'ru' }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);

    const t = translations[language];

    // Fetch monthly data
    const monthlyData = useMemo(() => {
        if (!dob) return [];
        return ForecastingEngine.getMonthlyForecast(todayStr, dob, language);
    }, [dob, todayStr, language]);

    // Find data for selected date
    const selectedAnalysis = useMemo(() => {
        if (!monthlyData.length) return null;
        return monthlyData.find(d => d.date === selectedDate) || monthlyData[0];
    }, [monthlyData, selectedDate]);

    // Set initial selected date to today when data loads
    useEffect(() => {
        setSelectedDate(todayStr);
    }, [todayStr]);

    if (!selectedAnalysis) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Critical': return '#ef4444';
            case 'Caution': return '#f59e0b';
            case 'Excellent': return '#10b981';
            case 'Good': return '#3b82f6';
            default: return '#9ca3af';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Critical': return t.critical;
            case 'Caution': return t.caution;
            case 'Excellent': return t.excellent;
            case 'Good': return t.good;
            default: return t.neutral;
        }
    }

    const mainColor = getStatusColor(selectedAnalysis.status);
    const statusText = getStatusText(selectedAnalysis.status);

    return (
        <div style={{
            background: 'rgba(25, 25, 25, 0.9)',
            border: `1px solid ${mainColor}`,
            padding: '2rem',
            borderRadius: '20px',
            marginTop: '3rem',
            boxShadow: `0 0 30px ${mainColor}15`,
            transition: 'border-color 0.5s ease, box-shadow 0.5s ease'
        }}>
            {/* Header / Main Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    <div style={{
                        fontSize: '2.5rem',
                        background: mainColor,
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 15px ${mainColor}40`
                    }}>
                        {selectedAnalysis.status === 'Critical' ? '⚠️' :
                            selectedAnalysis.status === 'Caution' ? '✋' :
                                selectedAnalysis.status === 'Excellent' ? '🚀' : '✨'}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', opacity: 0.6 }}>{t.strategicInsight}</h2>
                        <h1 style={{ margin: 0, color: mainColor, fontSize: '1.8rem' }}>
                            {selectedAnalysis.dayLabel} — {statusText}
                        </h1>
                    </div>
                </div>

                <div style={{ fontSize: '1.1rem', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1rem' }}>
                    "{selectedAnalysis.summary}"
                </div>

                {/* Detailed Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.3rem' }}>{t.personalDay}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedAnalysis.details.numerology.number}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{selectedAnalysis.details.numerology.meaning}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.3rem' }}>{t.mayanEnergy}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{t.kin} {selectedAnalysis.details.mayan.kin}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{selectedAnalysis.details.mayan.summary}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.3rem' }}>{t.jyotishAlign}</div>
                        <div style={{ fontSize: '0.9rem' }}>
                            <div style={{ marginBottom: '0.2rem' }}>🌕 {selectedAnalysis.details.jyotish.tithi}</div>
                            <div style={{ marginBottom: '0.2rem' }}>✨ {selectedAnalysis.details.jyotish.nakshatra}</div>
                            <div>🧘 {selectedAnalysis.details.jyotish.yoga}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 30-Day Grid (Aligned to 13-Day Wavespell) */}
            <div>
                <h4 style={{ opacity: 0.6, marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                    {t.wavespell}
                </h4>

                {/* Column Headers (Tones 1-13) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', opacity: 0.5, fontSize: '0.7rem' }}>
                    {Array.from({ length: 13 }, (_, i) => i + 1).map(n => (
                        <div key={n}>{n}</div>
                    ))}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(13, 1fr)',
                    gap: '0.2rem'
                }}>
                    {/* Spacers for start offset */}
                    {monthlyData.length > 0 && Array.from({ length: (monthlyData[0].details.mayan.tone - 1) }).map((_, i) => (
                        <div key={`spacer-${i}`}></div>
                    ))}

                    {monthlyData.map((day, i) => {
                        const dayColor = getStatusColor(day.status);
                        const isSelected = day.date === selectedDate;
                        const kin = day.details.mayan.kin;
                        const tone = day.details.mayan.tone;
                        const personalDay = day.details.numerology.number;
                        const mayanColorName = day.details.mayan.color;

                        const dateObj = new Date(day.date);
                        const dayNum = dateObj.getDate();

                        const mayanColors = {
                            "Красный": "#ef4444", "Белый": "#ffffff", "Синий": "#3b82f6", "Желтый": "#eab308", "Зеленый": "#22c55e",
                            "Red": "#ef4444", "White": "#ffffff", "Blue": "#3b82f6", "Yellow": "#eab308", "Green": "#22c55e",
                            "אדום": "#ef4444", "לבן": "#ffffff", "כחול": "#3b82f6", "צהוב": "#eab308", "ירוק": "#22c55e"
                        };

                        const colorOrderMap = {
                            ru: ["Красный", "Белый", "Синий", "Желтый"],
                            en: ["Red", "White", "Blue", "Yellow"],
                            he: ["אדום", "לבן", "כחול", "צהוב"]
                        };
                        const colorOrder = colorOrderMap[language] || colorOrderMap.ru;

                        let wavespellColorName = "Красный";
                        if (typeof kin === 'number' && typeof tone === 'number') {
                            let startKin = kin - (tone - 1);
                            if (startKin <= 0) startKin += 260;

                            const startSealIndex = (startKin - 1) % 20;
                            wavespellColorName = colorOrder[startSealIndex % 4];
                        }

                        const weekColor = mayanColors[wavespellColorName] || "#4b5563";
                        const fillColor = mayanColors[mayanColorName] || "#4b5563";

                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDate(day.date)}
                                style={{
                                    background: `${fillColor}80`,
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    border: `3px solid ${weekColor}`,
                                    boxShadow: isSelected ? `0 0 10px 2px ${dayColor}` : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minHeight: '45px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}
                                title={`Tone ${tone} | PD ${personalDay} | Week: ${weekColor}`}
                            >
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{dayNum}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: dayColor
                                    }}></div>
                                    <div style={{ fontSize: '0.6rem', color: '#a5b4fc', fontWeight: 'bold' }}>{personalDay}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StrategicAdvisor;
