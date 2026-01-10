// Sanitize URL: remove trailing slash if present
const rawUrl = import.meta.env.VITE_API_URL || 'merry-flow.railway.app';
const API_URL = rawUrl.replace(/\/$/, '');

console.log("🚀 Frontend is connecting to Backend at:", merry-flow.railway.app);

export const fetchDailyAnalysis = async (dob, date, name) => {
    try {
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dob, date, name }),
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
