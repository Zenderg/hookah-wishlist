import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.API_URL || 'http://api:3000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include API key header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const botApiKey = process.env.BOT_API_KEY;

    if (botApiKey) {
      config.headers = config.headers || {};
      config.headers['X-API-Key'] = botApiKey;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
