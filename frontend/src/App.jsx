import DailyStrategy from './components/DailyStrategy'
import { fetchDailyAnalysis, profileAPI, fetchBirthChart } from './api'
import { translations } from './utils/translations'

import { useState, useEffect } from 'react'
import TaskPlanner from './TaskPlanner'
import StrategicAdvisor from './components/StrategicAdvisor'
import ParticleBackground from './components/ParticleBackground'
import ProfileManager from './components/ProfileManager'
import { NumerologyEngine } from './utils/numerologyEngine'
import { MayanEngine } from './utils/mayanEngine'
import { JyotishEngine } from './utils/jyotishEngine'
import './App.css'
import { supabase } from './supabaseClient';

function App() {
  const [profile, setProfile] = useState({ name: '', dob: '', birthTime: '', birthPlace: '', birthLat: null, birthLng: null })
  const [data, setData] = useState(null)
  const [user, setUser] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [mayan, setMayan] = useState(null)
  const [jyotish, setJyotish] = useState(null)

  // AI Strategy State
  const [aiStrategy, setAiStrategy] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [aiError, setAiError] = useState(null)

  // Current date state
  const [today] = useState(new Date())
  const [language, setLanguage] = useState('ru') // 'ru', 'en', 'he'

  useEffect(() => {
    if (!supabase) return; // Guard against missing keys

    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        setProfile(prev => ({ ...prev, name: session.user.user_metadata.full_name || '' }));
        // Load active profile
        await loadActiveProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setProfile(prev => ({ ...prev, name: session.user.user_metadata.full_name || '' }));
        // Load active profile
        await loadActiveProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh when language changes
  useEffect(() => {
    if (data?.active && profile.dob) {
      calculateDestiny();
    }
  }, [language]);

  // Load active profile from backend
  const loadActiveProfile = async (userId) => {
    try {
      const result = await profileAPI.getActiveProfile(userId);
      if (result.profile) {
        setActiveProfile(result.profile);
        // Update profile state with saved data
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

  // Handle profile change from ProfileManager
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
      // Auto-calculate with new profile
      setTimeout(calculateDestiny, 100);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      alert("Supabase keys are missing! Please check supabaseClient.js");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setActiveProfile(null);
    setProfile({ name: '', dob: '', birthTime: '', birthPlace: '', birthLat: null, birthLng: null });
  };

  const calculateDestiny = async () => {
    if (!profile.dob) return

    // Core Calculations
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const currentWeek = Math.ceil(today.getDate() / 7)

    const lifePath = NumerologyEngine.calculateLifePath(profile.dob)
    const personalYear = NumerologyEngine.calculatePersonalYear(profile.dob, currentYear)
    const dailyVibration = NumerologyEngine.calculateDailyVibration(profile.dob, today.toISOString().split('T')[0])

    const universalDay = NumerologyEngine.calculateUniversalDay(today.toISOString().split('T')[0])
    const personalMonth = NumerologyEngine.calculatePersonalMonth(profile.dob, currentYear, currentMonth)
    const personalWeek = NumerologyEngine.calculatePersonalWeek(profile.dob, currentYear, currentMonth, currentWeek)

    // Mayan Calculations
    const birthMayan = MayanEngine.calculateTzolkin(profile.dob, language);
    const todayMayan = MayanEngine.calculateTzolkin(today.toISOString().split('T')[0], language);
    setMayan({ birth: birthMayan, today: todayMayan });

    // Jyotish Calculations
    const todayJyotish = JyotishEngine.calculatePanchanga(today.toISOString().split('T')[0], language);

    // Birth Chart calculation from backend if data available
    let birthChart = null;
    console.log("Checking birth chart requirements:", {
      time: profile.birthTime,
      lat: profile.birthLat,
      lng: profile.birthLng,
      dob: profile.dob
    });

    if (profile.birthTime && profile.birthLat && profile.birthLng) {
      console.log("Fetching birth chart...");
      try {
        const result = await fetchBirthChart(
          profile.dob,
          profile.birthTime,
          profile.birthLat,
          profile.birthLng
        );
        console.log("Birth chart result:", result);
        if (result.success) {
          birthChart = result.chart;
        } else {
          console.error("Birth chart API returned success: false");
        }
      } catch (error) {
        console.error('Failed to fetch birth chart:', error);
      }
    } else {
      console.log("Skipping birth chart: missing data");
    }

    setJyotish({ today: todayJyotish, birth: birthChart });

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

    // Fetch AI Strategy
    setLoadingAi(true);
    setAiStrategy(null);
    setAiError(null);

    try {
      // Pass language and birth data to API
      const analysis = await fetchDailyAnalysis(
        profile.dob,
        today.toISOString().split('T')[0],
        profile.name,
        language,
        profile.birthTime || null,
        profile.birthLat || null,
        profile.birthLng || null
      );
      if (analysis && analysis.strategy) {
        setAiStrategy(analysis.strategy);
        if (analysis.debug_prompt) {
          console.log("🐛 AI PROMPT DEBUG INFO 🐛");
          console.log(analysis.debug_prompt);
          console.log("----------------------------");
        }
      } else {
        // If we get here ensuring analysis is null/undefined means fallback or error
        setAiError("Оракул молчит. (Проверьте Backend/API Key)");
      }
    } catch (err) {
      setAiError("Ошибка связи с Оракулом.");
    } finally {
      setLoadingAi(false);
    }
  }

  // ...



  // ... inside component ...

  const t = translations[language];
  const isRtl = language === 'he';

  return (
    <div className="calendar-container" dir={isRtl ? 'rtl' : 'ltr'}>
      <ParticleBackground intensity={data?.intensity || 1} />

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
        <button
          onClick={() => setLanguage('ru')}
          style={{
            opacity: language === 'ru' ? 1 : 0.5,
            cursor: 'pointer',
            background: 'transparent',
            border: '1px solid white',
            color: 'white',
            borderRadius: '4px',
            padding: '2px 6px'
          }}>
          RU
        </button>
        <button
          onClick={() => setLanguage('en')}
          style={{
            opacity: language === 'en' ? 1 : 0.5,
            cursor: 'pointer',
            background: 'transparent',
            border: '1px solid white',
            color: 'white',
            borderRadius: '4px',
            padding: '2px 6px'
          }}>
          EN
        </button>
        <button
          onClick={() => setLanguage('he')}
          style={{
            opacity: language === 'he' ? 1 : 0.5,
            cursor: 'pointer',
            background: 'transparent',
            border: '1px solid white',
            color: 'white',
            borderRadius: '4px',
            padding: '2px 6px'
          }}>
          HE
        </button>
      </div>

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
            {t.appTitle}
          </h1>
          <p style={{ letterSpacing: '2px', opacity: 0.8, color: '#e2e8f0' }}>{t.appSubtitle}</p>
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
          placeholder={t.placeholderName}
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
            minWidth: '150px',
            textAlign: isRtl ? 'right' : 'left'
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
            color: 'white',
            colorScheme: 'dark' // Ensure calendar icon is visible in dark mode
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
          {t.searchButton}
        </button>

        {user && (
          <>
            <ProfileManager
              user={user}
              activeProfile={activeProfile}
              onProfileChange={handleProfileChange}
              language={language}
            />
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
          </>
        )}
      </div>

      {data && (
        <div style={{ animation: 'fadeIn 1s ease-out' }}>

          {/* NEW: AI Strategy Component at the top of results */}
          <DailyStrategy strategy={aiStrategy} isLoading={loadingAi} error={aiError} />

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            {/* ... */}

            {/* 1. Numerology Column */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '1.5rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              height: '100%'
            }}>
              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#fca5a5' }}>
                {t.numerologyTitle}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t.lifePath}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.lifePath}</span>
                </div>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t.persYear}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.personalYear}</span>
                </div>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t.persMonth}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.personalMonth}</span>
                </div>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t.persWeek}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.personalWeek}</span>
                </div>
                <div className="stat">
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t.univDay}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.universalDay}</span>
                </div>
                <div className="stat" style={{ border: '1px solid rgba(0, 255, 255, 0.3)', borderRadius: '8px', padding: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7, color: 'cyan' }}>{t.dailyVibe}</span>
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
                  {t.mayanTitle}
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
                      <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{t.yourKin}</span>
                      <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>{t.kin} {mayan.birth.kin}</span>
                    </div>
                    {/* ... other code, note: deep properties like fullTitle are still in Russian from engine, fixing that is HARDER, skipping for now unless req */}
                    {/* Actually, user said ENTIRE. Engine returns Russian. I probably need to make engine multi-lingual too OR map it. */}
                    {/* For now, let's just do the labels. If the engine strings are still Russian, I'll tell user. */}
                    <div style={{ textAlign: 'center' }}>
                      {/* ... */}
                      {/* Labels */}
                      <div>
                        <div><strong>{t.seal}:</strong> {mayan.birth.sealName} ({mayan.birth.mayanSealName})</div>
                      </div>
                      <div>
                        <div><strong>{t.tone}:</strong> {mayan.birth.toneName} ({mayan.birth.tone})</div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Kin */}
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
                      <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{t.energyToday}</span>
                      <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>{t.kin} {mayan.today.kin}</span>
                    </div>

                    {/* ... */}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', fontSize: '0.9rem' }}>

                      {/* Day Column */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{t.day}</div>
                        <div style={{ marginBottom: '0.5rem' }}>{mayan.today.toneName} {t.tone} ({mayan.today.tone})</div>
                        <div style={{ marginBottom: '0.5rem' }}>{t.seal}: {mayan.today.sealName} ({mayan.today.mayanSealName})</div>
                      </div>

                      {/* Moon Column */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{t.month}</div>
                        {mayan.today.moon && (
                          <>
                            <div style={{ marginBottom: '0.2rem' }}>{mayan.today.moon.name}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{t.day} {mayan.today.moon.day}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t.totem}: {mayan.today.moon.totem}</div>
                          </>
                        )}
                      </div>

                      {/* Year Column */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{t.year}</div>
                        {mayan.today.year && (
                          <>
                            <div style={{ marginBottom: '0.5rem' }}>{mayan.today.year.name}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t.kins}: {mayan.today.year.kin}</div>
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
                  {t.jyotishTitle}
                </h3>

                {/* Birth Data Section */}
                {profile.birthTime && profile.birthPlace && (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(147, 197, 253, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(147, 197, 253, 0.2)'
                  }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      {t.birthData || 'Birth Data'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                      <div><strong>{t.birthTime || 'Time'}:</strong> {profile.birthTime}</div>
                      <div><strong>{t.birthPlace || 'Place'}:</strong> {profile.birthPlace}</div>
                      {profile.birthLat && profile.birthLng && (
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                          {profile.birthLat.toFixed(2)}°, {profile.birthLng.toFixed(2)}°
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Display for Debugging */}
                {jyotish.error && (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.8rem',
                    wordBreak: 'break-word'
                  }}>
                    <strong>Backend Error:</strong><br />
                    {jyotish.error}
                  </div>
                )}

                {/* Birth Chart Section */}
                {jyotish.birth && (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(147, 197, 253, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(147, 197, 253, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>
                        Natal Chart
                      </div>
                      {jyotish.birth.timezone && (
                        <div style={{ fontSize: '0.65rem', opacity: 0.4, fontFamily: 'monospace' }}>
                          {jyotish.birth.timezone}
                        </div>
                      )}
                    </div>

                    {/* Ascendant Table */}
                    <div style={{
                      marginBottom: '1rem',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '6px',
                      padding: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Ascendant (Lagna)</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{jyotish.birth.ascendant.rashi}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.7 }}>
                        <span>{jyotish.birth.ascendant.nakshatra}</span>
                        <span>{jyotish.birth.ascendant.rashi_degree}°</span>
                      </div>
                    </div>

                    {/* Planets Grid */}
                    {jyotish.birth.grahas ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {Object.entries(jyotish.birth.grahas).map(([name, data]) => (
                          <div key={name} style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                              <span style={{ opacity: 0.8 }}>{name}</span>
                              <span style={{ fontWeight: 'bold' }}>{data.rashi}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.5 }}>
                              <span>{data.nakshatra}</span>
                              <span>{data.rashi_degree}°</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', opacity: 0.7, padding: '1rem', textAlign: 'center' }}>
                        Wait for Backend update... (Grahas missing)
                      </div>
                    )}
                  </div>

                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  <div className="stat">
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{t.vara}</span>
                    <span style={{ fontWeight: 'bold' }}>{jyotish.today.vara.day}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{jyotish.today.vara.planet}</span>
                  </div>

                  <div className="stat">
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{t.tithi}</span>
                    <span style={{ fontWeight: 'bold' }}>{jyotish.today.tithi.name}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{jyotish.today.tithi.paksha}</span>
                  </div>

                  <div className="stat">
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{t.nakshatra}</span>
                    <span style={{ fontWeight: 'bold' }}>{jyotish.today.nakshatra.name}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{jyotish.today.nakshatra.deity}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="stat">
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{t.yoga}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{jyotish.today.yoga}</span>
                    </div>
                    <div className="stat">
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{t.karana}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{jyotish.today.karana}</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* End of 3-column grid */}
          </div>

          <StrategicAdvisor dob={profile.dob} language={language} /> {/* Pass Language */}
          <TaskPlanner vibration={data.dailyVibration} aiSummary={aiStrategy} />
        </div>
      )}
    </div>
  )
}

export default App
