// Use Environment Variable for Flexibility (Local vs Prod)
// In Railway, set VITE_API_URL to your Backend Public URL (https://...up.railway.app)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log("🚀 Frontend is connecting to Backend at:", API_URL);

export const fetchDailyAnalysis = async (dob, date, name, language = 'ru') => {
    try {
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dob, date, name, language }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch analysis');
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return null; // Fallback to local calculation if API fails
    }
};
