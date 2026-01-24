import { useOutletContext } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cosmicAPI } from '../api';
import './ProjectsPage.css';

export default function ProjectsPage() {
    const { language, user } = useOutletContext();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('spheres'); // 'spheres', 'tasks', 'projects'

    useEffect(() => {
        if (user) {
            loadTasks();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await cosmicAPI.getTasks(user.id);
            setTasks(data.tasks || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // System life spheres
    const lifeSpheres = [
        { key: 'career', name: language === 'ru' ? 'Карьера' : 'Career', icon: '💼', color: '#60a5fa' },
        { key: 'health', name: language === 'ru' ? 'Здоровье' : 'Health', icon: '❤️', color: '#34d399' },
        { key: 'relationships', name: language === 'ru' ? 'Отношения' : 'Relationships', icon: '💕', color: '#f472b6' },
        { key: 'finance', name: language === 'ru' ? 'Финансы' : 'Finance', icon: '💰', color: '#fbbf24' },
        { key: 'family', name: language === 'ru' ? 'Семья' : 'Family', icon: '👨‍👩‍👧', color: '#a78bfa' },
        { key: 'creativity', name: language === 'ru' ? 'Творчество' : 'Creativity', icon: '🎨', color: '#fb923c' },
        { key: 'spirituality', name: language === 'ru' ? 'Духовность' : 'Spirituality', icon: '🧘', color: '#818cf8' },
        { key: 'education', name: language === 'ru' ? 'Образование' : 'Education', icon: '📚', color: '#2dd4bf' },
    ];

    const getTasksBySphere = (sphere) => tasks.filter(t => t.life_sphere === sphere);

    return (
        <div className="projects-page">
            <header className="page-header">
                <h1>📂 {language === 'ru' ? 'Проекты и Задачи' : 'Projects & Tasks'}</h1>
                <p className="page-subtitle">
                    {language === 'ru'
                        ? 'Управление сферами жизни и проектами'
                        : 'Manage life spheres and projects'}
                </p>
            </header>

            {/* Tab Navigation */}
            <div className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === 'spheres' ? 'active' : ''}`}
                    onClick={() => setActiveTab('spheres')}
                >
                    🌐 {language === 'ru' ? 'Сферы' : 'Spheres'}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    ✅ {language === 'ru' ? 'Задачи' : 'Tasks'}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('projects')}
                >
                    📁 {language === 'ru' ? 'Проекты' : 'Projects'}
                </button>
            </div>

            {!user ? (
                <div className="auth-required">
                    <p>{language === 'ru' ? 'Войдите для управления задачами' : 'Sign in to manage tasks'}</p>
                </div>
            ) : (
                <>
                    {/* Life Spheres Tab */}
                    {activeTab === 'spheres' && (
                        <div className="spheres-grid">
                            {lifeSpheres.map(sphere => {
                                const sphereTasks = getTasksBySphere(sphere.key);
                                const completed = sphereTasks.filter(t => t.status === 'completed').length;
                                const total = sphereTasks.length;
                                const progress = total > 0 ? (completed / total) * 100 : 0;

                                return (
                                    <div
                                        key={sphere.key}
                                        className="sphere-card"
                                        style={{ borderColor: sphere.color }}
                                    >
                                        <div className="sphere-icon">{sphere.icon}</div>
                                        <div className="sphere-name">{sphere.name}</div>
                                        <div className="sphere-stats">
                                            {completed}/{total} {language === 'ru' ? 'задач' : 'tasks'}
                                        </div>
                                        <div className="sphere-progress">
                                            <div
                                                className="progress-bar"
                                                style={{
                                                    width: `${progress}%`,
                                                    backgroundColor: sphere.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tasks Tab */}
                    {activeTab === 'tasks' && (
                        <div className="tasks-list">
                            {loading ? (
                                <p>Loading...</p>
                            ) : tasks.length === 0 ? (
                                <div className="empty-state">
                                    <p>{language === 'ru' ? 'Нет задач. Создайте первую!' : 'No tasks. Create your first one!'}</p>
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className={`task-item ${task.status}`}>
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'completed'}
                                            readOnly
                                        />
                                        <div className="task-content">
                                            <span className="task-title">{task.title}</span>
                                            {task.life_sphere && (
                                                <span className="task-sphere">{task.life_sphere}</span>
                                            )}
                                        </div>
                                        <span className={`task-type ${task.task_type}`}>
                                            {task.task_type}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Projects Tab */}
                    {activeTab === 'projects' && (
                        <div className="projects-placeholder">
                            <p>{language === 'ru' ? 'Скоро: управление проектами' : 'Coming soon: project management'}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
