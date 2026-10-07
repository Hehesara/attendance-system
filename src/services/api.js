import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('attendtrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 unauthorized
      localStorage.removeItem('attendtrack_token');
      localStorage.removeItem('attendtrack_user');
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Users Endpoints (Admin)
export const usersApi = {
  getUsers: (params) => api.get('/users', { params }),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  importCSV: (classId, students, initialPassword) =>
    api.post('/users/import-csv', { classId, students, initialPassword }),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
};

// Classes Endpoints
export const classesApi = {
  getClasses: () => api.get('/classes'),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/classes/${id}`),
  getClassStudents: (id) => api.get(`/classes/${id}/students`),
};

// Subjects Endpoints
export const subjectsApi = {
  getSubjects: () => api.get('/subjects'),
  createSubject: (data) => api.post('/subjects', data),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
};

// Allocations Endpoints
export const allocationsApi = {
  getAllocations: () => api.get('/allocations'),
  getMyClasses: () => api.get('/allocations/my-classes'),
  createAllocation: (data) => api.post('/allocations', data),
  deleteAllocation: (id) => api.delete(`/allocations/${id}`),
};

// Attendance Endpoints
export const attendanceApi = {
  markAttendance: (data) => api.post('/attendance', data),
  getSession: (id) => api.get(`/attendance/session/${id}`),
  updateSession: (id, data) => api.put(`/attendance/session/${id}`, data),
  getHistory: (params) => api.get('/attendance/history', { params }),
  getStudentMe: () => api.get('/attendance/student/me'),
  getReports: (params) => api.get('/attendance/reports', { params }),
  getAdminOverview: () => api.get('/attendance/admin-overview'),
};

// Settings Endpoints
export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export default api;
