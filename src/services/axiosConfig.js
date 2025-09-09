import axios from "axios";

// Create axios instance with the correct base URL (services will include /api in their paths)
export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Response from ${response?.config?.url}: Status ${response?.status}`
      );
    }

    // Ensure response object structure is valid
    if (!response) {
      console.error("❌ Null response received");
      return Promise.reject(new Error("No response received from server"));
    }

    // Ensure data property exists
    if (response.data === undefined) {
      console.warn("⚠️ Response data is undefined, setting to empty object");
      response.data = {};
    }

    return response;
  },
  (error) => {
    console.error("Response error:", error?.response?.status, error?.message);
    if (error?.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on login page
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
