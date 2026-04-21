import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Patient APIs
export const identifyPatient = (data) => api.post('/patients/identify', data);
export const lookupPatient = (params) => api.get('/patients/lookup', { params });

// Tenant APIs
export const getTenants = () => api.get('/tenants');
export const getTenant = (id) => api.get(`/tenants/${id}`);

// Department APIs
export const getDepartmentsByTenant = (tenant_id) => api.get(`/departments/tenant/${tenant_id}`);
export const getDepartment = (id) => api.get(`/departments/${id}`);

// Booking APIs
export const createBooking = (data) => api.post('/bookings', data);
export const getPatientBookings = (patient_id) => api.get(`/bookings/patient/${patient_id}`);

// Queue APIs
export const triggerGeofence = (data) => api.post('/queue/geofence', data);
export const getTodaySession = (department_id, token) =>
  api.get(`/queue/session/today/${department_id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Staff APIs
export const getNurseDashboard = (session_id, token) =>
  api.get(`/queue/session/${session_id}/nurse`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const callPatient = (ticket_id, token) =>
  api.put(`/queue/ticket/${ticket_id}/call`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const servePatient = (ticket_id, token) =>
  api.put(`/queue/ticket/${ticket_id}/serve`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const markEMRReady = (ticket_id, token) =>
  api.put(`/queue/ticket/${ticket_id}/emr-ready`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const verifyPatient = (patient_id, tenant_id, token) =>
  api.put(`/patients/${patient_id}/verify`, { tenant_id }, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getDirectorView = (tenant_id, token) =>
  api.get(`/queue/director/${tenant_id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const staffLogin = (email, password) =>
  api.post('/auth/login', { email, password });

export default api;