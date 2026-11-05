import axios from 'axios';
import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — Gemini OCR can take up to 30s for large images
});

// Request interceptor to attach authenticated Supabase JWT token and handle multipart
apiClient.interceptors.request.use(
  async (config) => {
    // When sending FormData, delete Content-Type so browser sets multipart/form-data with proper boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.warn('Could not retrieve Supabase session for API request:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error and status handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded — distinguish by status code
      const { status, data } = error.response;
      if (status === 401) {
        console.warn('Unauthorized request to WattWise backend API (401).');
      }
      const statusMessages = {
        400: data?.message || 'Invalid request. Check your file format or input fields.',
        401: 'Authentication required. Please sign in to continue.',
        403: 'Access denied. You do not have permission for this action.',
        413: 'File too large. Maximum upload size is 15 MB.',
        422: data?.message || 'Validation failed. Check your input data.',
        429: 'Too many requests. Please wait a moment and try again.',
        500: data?.message || 'Backend processing error. Please try again.',
        503: 'Backend service temporarily unavailable. Please try again shortly.',
      };
      return Promise.reject({
        status,
        message: statusMessages[status] || data?.message || `Request failed (HTTP ${status})`,
        errors: data?.errors || null,
        data,
        isOcrError: data?.ocrFailed === true,
      });
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // Request timed out waiting for response
        return Promise.reject({
          status: 0,
          message: 'Request timed out. The server is processing your file — please try again.',
          isTimeout: true,
        });
      }
      // Genuine network/connection failure
      return Promise.reject({
        status: 0,
        message: 'Cannot reach WattWise backend. Check that the Node.js server is running on port 5000.',
        isNetworkError: true,
      });
    }
    // Error before request was sent (e.g. config error)
    return Promise.reject({
      status: -1,
      message: error.message || 'Unknown error occurred',
    });
  }
);

export default apiClient;
