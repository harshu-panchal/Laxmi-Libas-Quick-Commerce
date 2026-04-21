import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const getDefaultApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window === "undefined") {
    return "http://localhost:5000/api/v1";
  }

  const { origin, hostname } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.");

  if (isLocalhost) {
    return `http://${hostname}:5000/api/v1`;
  }

  return `${origin}/api/v1`;
};

const API_BASE_URL = getDefaultApiBaseUrl();

export const getSocketBaseURL = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const apiBaseUrl = API_BASE_URL;
  const socketUrl = apiBaseUrl.replace(/\/api\/v\d+$|\/api$/, "");

  return socketUrl || "http://localhost:5000";
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("authToken");

    if (config.url?.includes("/payment/create-order")) {
      console.log("[Frontend Payment] create-order request", {
        baseURL: config.baseURL,
        url: config.url,
        fullUrl: `${config.baseURL || ""}${config.url || ""}`,
      });
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: any) => {
    if (error.config?.url?.includes("/payment/create-order")) {
      console.error("[Frontend Payment] create-order failed", {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");

      if (!isAuthEndpoint) {
        const currentPath = window.location.pathname;

        if (currentPath.includes("/login") || currentPath.includes("/signup")) {
          return Promise.reject(error);
        }

        const apiUrl = error.config?.url || "";
        let redirectPath = "/login";

        if (currentPath.includes("/admin/") || apiUrl.includes("/admin/")) {
          redirectPath = "/admin/login";
        } else if (
          currentPath.includes("/seller/") ||
          apiUrl.includes("/seller/") ||
          apiUrl.includes("/sellers")
        ) {
          redirectPath = "/seller/login";
        } else if (
          currentPath.includes("/delivery/") ||
          apiUrl.includes("/delivery/")
        ) {
          redirectPath = "/delivery/login";
        }

        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = redirectPath;
      }
    }

    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userData");
};

export const rootApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL.replace(/\/v1$/, ""),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

rootApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
