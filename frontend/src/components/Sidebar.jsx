import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard', labelRu: 'Главная' },
    { path: '/transits', icon: '🪐', label: 'Transits', labelRu: 'Транзиты' },
    { path: '/time', icon: '⏰', label: 'Time', labelRu: 'Время' },
    { path: '/projects', icon: '📂', label: 'Projects', labelRu: 'Проекты' },
];

export default function Sidebar({ language = 'ru' }) {
    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <img src="/sun_smooth.png" alt="Logo" className="sidebar-logo-img" />
                <span className="sidebar-logo-text">Cosmic</span>
            </div>

            <ul className="sidebar-nav">
                {navItems.map((item) => (
                    <li key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            end={item.path === '/'}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">
                                {language === 'ru' ? item.labelRu : item.label}
                            </span>
                        </NavLink>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <span className="sidebar-version">v2.0</span>
            </div>
        </nav>
    );
}
