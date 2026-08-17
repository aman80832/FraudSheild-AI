import axios from "axios";

// =====================================================
// FRAUDSHIELD API CLIENT
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://fraud-sheild-backend.vercel.app";

console.log("FraudShield API URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login?session=expired");
      }
    }

    return Promise.reject(error);
  }
);

export { API_URL };

export default api;