import { useState, useEffect } from 'react'
import TaskPlanner from './TaskPlanner'
import StrategicAdvisor from './components/StrategicAdvisor'
import ParticleBackground from './components/ParticleBackground'
import { NumerologyEngine } from './utils/numerologyEngine'
import { MayanEngine } from './utils/mayanEngine'
import { JyotishEngine } from './utils/jyotishEngine'
import './App.css'

import { supabase } from './supabaseClient';

function App() {
  const [profile, setProfile] = useState({ name: '', dob: '' })
  const [data, setData] = useState(null)
  const [user, setUser] = useState(null);
  const [mayan, setMayan] = useState(null)
  const [jyotish, setJyotish] = useState(null)

  // Current date state
  const [today] = useState(new Date())

  useEffect(() => {
    if (!supabase) return; // Guard against missing keys

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        setProfile(prev => ({ ...prev, name: session.user.user_metadata.full_name || '' }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setProfile(prev => ({ ...prev, name: session.user.user_metadata.full_name || '' }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      alert("Supabase keys are missing! Please check supabaseClient.js");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(prev => ({ ...prev, name: '' }));
  };

  const calculateDestiny = () => {
    if (!profile.dob) return

    // Core Calculations
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    // Simple week calculation: day / 7 roughly
    const currentWeek = Math.ceil(today.getDate() / 7)

    const lifePath = NumerologyEngine.calculateLifePath(profile.dob)
    const personalYear = NumerologyEngine.calculatePersonalYear(profile.dob, currentYear)
    const dailyVibration = NumerologyEngine.calculateDailyVibration(profile.dob, today.toISOString().split('T')[0])

    // New Calculations
    const universalDay = NumerologyEngine.calculateUniversalDay(today.toISOString().split('T')[0])
    const personalMonth = NumerologyEngine.calculatePersonalMonth(profile.dob, currentYear, currentMonth)
    const personalWeek = NumerologyEngine.calculatePersonalWeek(profile.dob, currentYear, currentMonth, currentWeek)

    // Mayan Calculations
    const birthMayan = MayanEngine.calculateTzolkin(profile.dob);
    const todayMayan = MayanEngine.calculateTzolkin(today.toISOString().split('T')[0]);
    setMayan({ birth: birthMayan, today: todayMayan });

    // Jyotish Calculations
    const todayJyotish = JyotishEngine.calculatePanchanga(today.toISOString().split('T')[0]);
    setJyotish(todayJyotish);

    setData({
      active: true,
      lifePath,
      personalYear,
      dailyVibration,
      universalDay,
      personalMonth,
      personalWeek,
      intensity: [11, 22, 33].includes(dailyVibration) ? 2 : 1
    })
  }

  // Generate calendar grid for the current month
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="calendar-container">
      {/* Pass intensity based on the daily vibe */}
      <ParticleBackground intensity={data?.intensity || 1} />

      <div className="header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <img src="/sun_smooth.png" alt="Sun" className="sun-icon" style={{ height: '160px', width: '160px', objectFit: 'cover' }} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '3rem',
            background: 'linear-gradient(to right, #FFD700, #FFA500, #FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
            marginBottom: '0.5rem',
            fontFamily: '"Cinzel", serif'
          }}>
            Универсальный Календарь
          </h1>
          <p style={{ letterSpacing: '2px', opacity: 0.8, color: '#e2e8f0' }}>Ваша Судьба в Гармонии со Вселенной</p>
        </div>
        <img src="/moon_smooth.png" alt="Moon" className="moon-icon" style={{ height: '100px', width: '100px', objectFit: 'cover' }} />
      </div>

      {/* Compact Personal Data Row */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 2rem',
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.05)',
        padding: '0.5rem',
        borderRadius: '50px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Google Login Button */}
        {!user ? (
          <button
            onClick={handleGoogleLogin}
            style={{
              background: 'white',
              color: '#333',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              transition: 'transform 0.2s'
            }}
            title="Sign in with Google"
          >
            G
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #fbbf24' }}
              />
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="Ваше Имя"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          className="glass-input"
          style={{
            margin: 0,
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'white',
            minWidth: '150px'
          }}
        />

        <input
          type="date"
          value={profile.dob}
          onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
          className="glass-input"
          style={{
            margin: 0,
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            width: 'auto',
            background: 'transparent',
            border: 'none',
            color: 'white'
          }}
        />

        <button
          onClick={calculateDestiny}
          style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
            color: 'white',
            borderRadius: '50px',
            padding: '0.5rem 1.5rem',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
          }}
        >
          Искать
        </button>

        {user && (
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#d1d5db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
            title="Sign Out"
          >
            ✕
          </button>
        )}
      </div>

      {data && (
        <div style={{ animation: 'fadeIn 1s ease-out' }}>
          {/* Main Dashboard Grid */}
          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">

            {/* 1. Numerology Column */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '1.5rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              height: '100%'
            }}>
              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#fca5a5' }}>
                Нумерология
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>LIFE PATH</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.lifePath}</span>
                </div>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>PERS. YEAR</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.personalYear}</span>
                </div>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>PERS. MONTH</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.personalMonth}</span>
                </div>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>PERS. WEEK</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.personalWeek}</span>
                </div>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>UNIV. DAY</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.universalDay}</span>
                </div>
                <div className="stat" style={{ border: '1px solid rgba(0, 255, 255, 0.3)', borderRadius: '8px', padding: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7, color: 'cyan' }}>DAILY VIBE</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'cyan' }}>{data.dailyVibration}</span>
                </div>
              </div>
            </div>

            {/* Mayan Tzolkin Section */}
            {mayan && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                height: '100%'
              }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#fde047' }}>
                  Календарь Майя
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* User Birth Kin */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${mayan.birth.color === 'Красный' ? '#ff6b6b' : mayan.birth.color === 'Синий' ? '#4dabf7' : mayan.birth.color === 'Желтый' ? '#fcc419' : 'white'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>ВАШ КИН (РОЖДЕНИЕ)</span>
                      <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>Kin {mayan.birth.kin}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ margin: '0.5rem 0', color: mayan.birth.color === 'Красный' ? '#ff6b6b' : mayan.birth.color === 'Синий' ? '#4dabf7' : mayan.birth.color === 'Желтый' ? '#fcc419' : 'white' }}>
                        {mayan.birth.fullTitle}
                      </h2>
                      <div style={{ fontSize: '0.9rem', opacity: 0.8, fontStyle: 'italic', marginBottom: '1rem' }}>
                        {mayan.birth.fullMayanTitle}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', textAlign: 'left' }}>
                        <div>
                          <div><strong>Печать:</strong> {mayan.birth.sealName} ({mayan.birth.mayanSealName})</div>
                          <div style={{ opacity: 0.7 }}>{mayan.birth.action}, {mayan.birth.power}, {mayan.birth.essence}</div>
                        </div>
                        <div>
                          <div><strong>Тон:</strong> {mayan.birth.toneName} ({mayan.birth.tone})</div>
                          <div style={{ opacity: 0.7 }}>{mayan.birth.toneAction}, {mayan.birth.tonePower}, {mayan.birth.toneEssence}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Kin - Expanded View */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${mayan.today.color === 'Красный' ? '#ff6b6b' : mayan.today.color === 'Синий' ? '#4dabf7' : mayan.today.color === 'Желтый' ? '#fcc419' : 'white'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>ЭНЕРГИЯ СЕГОДНЯ</span>
                      <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>Kin {mayan.today.kin}</span>
                    </div>

                    {/* Top Row: Day Info */}
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      <h2 style={{ margin: '0.5rem 0', color: mayan.today.color === 'Красный' ? '#ff6b6b' : mayan.today.color === 'Синий' ? '#4dabf7' : mayan.today.color === 'Желтый' ? '#fcc419' : 'white' }}>
                        {mayan.today.fullTitle}
                      </h2>
                      <div style={{ fontSize: '0.9rem', opacity: 0.8, fontStyle: 'italic' }}>
                        {mayan.today.fullMayanTitle}
                      </div>
                    </div>

                    {/* Three Columns: Day Details, Moon, Year */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', fontSize: '0.9rem' }}>

                      {/* Day Column */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>ДЕНЬ</div>
                        <div style={{ marginBottom: '0.5rem' }}>{mayan.today.toneName} Тон ({mayan.today.tone})</div>
                        <div style={{ marginBottom: '0.5rem' }}>Печать: {mayan.today.sealName} ({mayan.today.mayanSealName})</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                          <em>"{mayan.today.toneQuestion}"</em>
                        </div>
                      </div>

                      {/* Moon Column */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>МЕСЯЦ</div>
                        {mayan.today.moon && (
                          <>
                            <div style={{ marginBottom: '0.2rem' }}>{mayan.today.moon.name}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>День {mayan.today.moon.day}-й</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Тотем: {mayan.today.moon.totem}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem', fontStyle: 'italic' }}>
                              {mayan.today.moon.question}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Year Column */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>ГОД</div>
                        {mayan.today.year && (
                          <>
                            <div style={{ marginBottom: '0.5rem' }}>{mayan.today.year.name}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Кинов: {mayan.today.year.kin}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Jyotish Panchanga Section */}
            {jyotish && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                height: '100%'
              }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#93c5fd' }}>
                  Ведический (Джйотиш)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  <div className="stat">
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>ВАРА (ДЕНЬ)</span>
                    <span style={{ fontWeight: 'bold' }}>{jyotish.vara.day}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{jyotish.vara.planet}</span>
                  </div>

                  <div className="stat">
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>ТИТХИ</span>
                    <span style={{ fontWeight: 'bold' }}>{jyotish.tithi.name}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{jyotish.tithi.paksha}</span>
                  </div>

                  <div className="stat">
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>НАКШАТРА</span>
                    <span style={{ fontWeight: 'bold' }}>{jyotish.nakshatra.name}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{jyotish.nakshatra.deity}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="stat">
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>ЙОГА</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{jyotish.yoga}</span>
                    </div>
                    <div className="stat">
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>КАРАНА</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{jyotish.karana}</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* End of 3-column grid */}
          </div>

          <StrategicAdvisor dob={profile.dob} />
          <TaskPlanner vibration={data.dailyVibration} />
        </div>
      )}
    </div>
  )
}

export default App
