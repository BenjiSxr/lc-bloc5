import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5030/api';
const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

// Stored image paths are relative to the API server; full URLs are used as they are.
export const getAssetUrl = (path) => (/^https?:\/\//.test(path) ? path : `${SERVER_URL}${path}`);

const API = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to attach JWT token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
