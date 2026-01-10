import { useState } from 'react';

const TaskPlanner = ({ vibration, aiSummary }) => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    // Productivity map matching backend logic
    const productivityMap = {
        1: { theme: 'Initiation', suggestions: ['Launch a project', 'Take charge'] },
        2: { theme: 'Cooperation', suggestions: ['Network', 'Team meeting'] },
        3: { theme: 'Creativity', suggestions: ['Design assets', 'Write content'] },
        4: { theme: 'Organization', suggestions: ['Clear inbox', 'File taxes'] },
        5: { theme: 'Change', suggestions: ['Sales calls', 'Travel'] },
        6: { theme: 'Responsibility', suggestions: ['Support team', 'Home office setup'] },
        7: { theme: 'Analysis', suggestions: ['Deep research', 'Strategy review'] },
        8: { theme: 'Power', suggestions: ['Financial planning', 'Executive decisions'] },
        9: { theme: 'Completion', suggestions: ['Wrap up tasks', 'Reflect'] },
    };

    const advice = productivityMap[vibration] || { theme: 'Balance', suggestions: ['Rest', 'Plan'] };

    const addTask = () => {
        if (newTask.trim()) {
            setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
            setNewTask('');
        }
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    return (
        <div className="task-planner" style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Day {vibration}: {advice.theme} Mode
            </h3>

            {/* AI Summary Section */}
            {aiSummary && (
                <div style={{
                    marginBottom: '1.5rem',
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: '#e2e8f0',
                    lineHeight: '1.5',
                    fontStyle: 'italic'
                }}>
                    <strong>💡 AI Insight:</strong> {aiSummary}
                </div>
            )}

            <div className="suggestions" style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>✨ Power Tasks for Today:</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {advice.suggestions.map((s, i) => (
                        <span key={i} style={{
                            background: 'rgba(157, 80, 187, 0.2)',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            border: '1px solid rgba(157, 80, 187, 0.4)'
                        }}>
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            <div className="task-list">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a goal aligned with your vibe..."
                        style={{ marginBottom: 0 }}
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button onClick={addTask} style={{ width: 'auto', padding: '0 1.5rem' }}>+</button>
                </div>

                <ul style={{ listStyle: 'none' }}>
                    {tasks.map(task => (
                        <li key={task.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '0.5rem',
                            background: task.done ? 'rgba(255,255,255,0.02)' : 'transparent',
                            textDecoration: task.done ? 'line-through' : 'none',
                            color: task.done ? 'var(--text-dim)' : 'var(--text)'
                        }}>
                            <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => toggleTask(task.id)}
                                style={{ width: '1.2rem', height: '1.2rem', margin: 0, cursor: 'pointer' }}
                            />
                            {task.text}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TaskPlanner;
