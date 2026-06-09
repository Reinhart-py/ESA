import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure request interceptor to append authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supabase_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const impersonateTenantId = localStorage.getItem('impersonate_tenant_id');
    if (impersonateTenantId && config.headers) {
      config.headers['x-impersonate-tenant-id'] = impersonateTenantId;
    }
    const mfaToken = localStorage.getItem('mfa_verified_token');
    if (mfaToken && config.headers) {
      config.headers['x-mfa-token'] = mfaToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
