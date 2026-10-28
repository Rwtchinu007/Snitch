import axios from "axios";

// Single axios instance for the whole app. In development Vite proxies /api to the
// backend; set VITE_API_URL to point at a different backend in other environments.
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // An expired/invalid session anywhere (other than the initial /auth/me probe) logs the user out
        const url = error.config?.url || "";
        if (error.response?.status === 401 && !url.includes("/auth/me")) {
            onUnauthorized();
        }
        return Promise.reject(error);
    }
);

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
    error?.response?.data?.message || fallback;
