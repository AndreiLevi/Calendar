// Use Environment Variable for Flexibility (Local vs Prod)
// In Railway, set VITE_API_URL to your Backend Public URL (https://...up.railway.app)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log("🚀 Frontend is connecting to Backend at:", API_URL);

export const fetchDailyAnalysis = async (dob, date, name, language = 'ru', birthTime = null, latitude = null, longitude = null) => {
    try {
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dob,
                date,
                name,
                language,
                birth_time: birthTime,
                latitude,
                longitude
            }),
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

// Profile Management API
export const profileAPI = {
    async createProfile(userId, profileData) {
        const response = await fetch(`${API_URL}/api/profiles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId
            },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) throw new Error('Failed to create profile');
        return await response.json();
    },

    async getProfiles(userId) {
        const response = await fetch(`${API_URL}/api/profiles`, {
            headers: { 'X-User-Id': userId }
        });
        if (!response.ok) throw new Error('Failed to fetch profiles');
        return await response.json();
    },

    async getActiveProfile(userId) {
        const response = await fetch(`${API_URL}/api/profiles/active`, {
            headers: { 'X-User-Id': userId }
        });
        if (!response.ok) throw new Error('Failed to fetch active profile');
        return await response.json();
    },

    async updateProfile(userId, profileId, updates) {
        const response = await fetch(`${API_URL}/api/profiles/${profileId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return await response.json();
    },

    async switchProfile(userId, profileId) {
        const response = await fetch(`${API_URL}/api/profiles/${profileId}/switch`, {
            method: 'POST',
            headers: { 'X-User-Id': userId }
        });
        if (!response.ok) throw new Error('Failed to switch profile');
        return await response.json();
    },

    async deleteProfile(userId, profileId) {
        const response = await fetch(`${API_URL}/api/profiles/${profileId}`, {
            method: 'DELETE',
            headers: { 'X-User-Id': userId }
        });
        if (!response.ok) throw new Error('Failed to delete profile');
        return await response.json();
    }
};
export async function fetchBirthChart(birthDate, birthTime, latitude, longitude) {
    const res = await fetch(`${API_URL}/api/birth-chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            birth_date: birthDate,
            birth_time: birthTime,
            latitude,
            longitude
        })
    });
    return res.json();
}

// Cosmic API for new features (Transits, Hora, Muhurtas, Tasks)
export const cosmicAPI = {
    async getHora(lat, lng, language = 'ru') {
        const response = await fetch(
            `${API_URL}/api/hora?latitude=${lat}&longitude=${lng}&language=${language}`
        );
        if (!response.ok) throw new Error('Failed to fetch hora');
        return await response.json();
    },

    async getMuhurtas(lat, lng, language = 'ru') {
        const response = await fetch(`${API_URL}/api/muhurtas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng, language })
        });
        if (!response.ok) throw new Error('Failed to fetch muhurtas');
        return await response.json();
    },

    async getTransits(language = 'ru') {
        const response = await fetch(`${API_URL}/api/transits?language=${language}`);
        if (!response.ok) throw new Error('Failed to fetch transits');
        return await response.json();
    },

    async getTasks(userId, options = {}) {
        const params = new URLSearchParams();
        if (options.status) params.append('status', options.status);
        if (options.type) params.append('task_type', options.type);
        if (options.sphere) params.append('life_sphere', options.sphere);

        const response = await fetch(`${API_URL}/api/tasks?${params}`, {
            headers: { 'X-User-Id': userId }
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return await response.json();
    },

    async getTodayTasks(userId) {
        const response = await fetch(`${API_URL}/api/tasks/today`, {
            headers: { 'X-User-Id': userId }
        });
        if (!response.ok) throw new Error('Failed to fetch today tasks');
        return await response.json();
    },

    async createTask(userId, taskData) {
        const response = await fetch(`${API_URL}/api/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId
            },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to create task');
        return await response.json();
    },

    async completeTask(userId, taskId) {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: { 'X-User-Id': userId }
        });
        if (!response.ok) throw new Error('Failed to complete task');
        return await response.json();
    }
};

