// HARDCODED PRODUCTION URL FOR DEBUGGING
// We bypass environment variables to ensure we hit the correct public address
const API_URL = 'Https://merry-flow-production.up.railway.app';

console.log("🚀 Frontend is connecting to Backend at:", API_URL);

console.log("🚀 Frontend is connecting to Backend at:", API_URL);

export const fetchDailyAnalysis = async (dob, date, name) => {
    try {
        const response = await fetch(`${https://merry-flow-production.up.railway.app}/api/analyze`, {
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
