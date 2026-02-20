import axios from 'axios';
export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

console.log("[apiClient] Using Base URL:", API_BASE_URL || "(relative)");

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 90000, // 90 seconds for AI processing
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
