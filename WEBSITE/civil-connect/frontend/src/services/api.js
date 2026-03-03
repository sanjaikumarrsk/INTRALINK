// ============================================================
// INFRALINK – API Layer
// ============================================================

import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// On 401, clear auth and redirect to /login
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            localStorage.removeItem('mobileNumber');
            localStorage.removeItem('ward');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');

// Issues
export const createIssue = (data) => API.post('/issues', data, { headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {} });
export const getIssues = (params) => API.get('/issues', { params });
export const getIssue = (id) => API.get(`/issues/${id}`);
export const updateIssueStatus = (id, data) => API.patch(`/issues/${id}/status`, data, { headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {} });
export const confirmIssue = (id) => API.patch(`/issues/${id}/confirm`);
export const reopenIssue = (id, data) => API.patch(`/issues/${id}/reopen`, data);
export const assignAuthority = (id, data) => API.patch(`/issues/${id}/assign`, data);
export const addProgressNote = (id, data) => API.post(`/issues/${id}/notes`, data);
export const uploadSolutionImage = (id, data) => API.post(`/issues/${id}/solution-image`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteIssue = (id) => API.delete(`/issues/${id}`);
export const getAnalytics = () => API.get('/issues/analytics');
export const getIssueStats = () => API.get('/issues/stats');


// Users
export const getUsers = () => API.get('/users');
export const updateUserRole = (id, data) => API.patch(`/users/${id}/role`, data);

// Leaderboard
export const getUserLeaderboard = () => API.get('/leaderboard/users');
export const getWardLeaderboard = () => API.get('/leaderboard/wards');

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.patch('/notifications/read-all');
export const createNotification = (data) => API.post('/notifications', data);

// Zones
export const getZones = () => API.get('/zones');
export const getZonesByWard = (ward) => API.get(`/zones/ward/${ward}`);
export const createZone = (data) => API.post('/zones', data);
export const updateZone = (id, data) => API.patch(`/zones/${id}`, data);
export const deleteZone = (id) => API.delete(`/zones/${id}`);
export const getZoneStats = () => API.get('/zones/stats');

export default API;

