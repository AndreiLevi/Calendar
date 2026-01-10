import React from 'react';

const DailyStrategy = ({ strategy, isLoading, error }) => {
    if (!strategy && !isLoading && !error) return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2rem',
            margin: '2rem 0',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                }}>
                    ✨
                </div>
                <h3 style={{ margin: 0, background: 'linear-gradient(to right, #e879f9, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Стратегия Дня (AI Oracle)
                </h3>
            </div>

            {isLoading ? (
                <div style={{ opacity: 0.7, fontStyle: 'italic' }}>
                    Синтез энергий... (Обращение к Оракулу)
                </div>
            ) : error ? (
                <div style={{ color: '#f87171', background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                    ⚠️ {error}
                </div>
            ) : (
                <div style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    color: '#e2e8f0',
                    whiteSpace: 'pre-line'
                }}>
                    {strategy}
                </div>
            )}
        </div>
    );
};

export default DailyStrategy;
